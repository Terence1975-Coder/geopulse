from __future__ import annotations

from typing import Any, Dict, List, Optional

from backend.intel.chain_state import update_chain_outputs
from backend.intel.context_builder import build_context_block
from backend.intel.llm_client import LLMClient
from backend.intel.schemas import (
    AgentEngageRequest,
    AgentEngageResponse,
    AnalysisSelection,
    ChainOutputs,
    ExecutionPlan,
    ExecutionPlanPhase,
    InteractionHooks,
    MultiAnalystView,
    StrategicPath,
    StrategyDecision,
    StructuredAgentOutput,
)
from backend.services.memory_service import init_persistence, save_agent_run
from backend.services.signal_ingestion import select_supporting_signals_for_text


class AgentService:
    def __init__(self) -> None:
        self.llm = LLMClient()
        init_persistence()

    def engage(self, req: AgentEngageRequest) -> AgentEngageResponse:
        if req.stage == "full_chain":
            return self._run_full_chain(req)

        return self._run_single_stage(req)

    def _run_full_chain(self, req: AgentEngageRequest) -> AgentEngageResponse:
        chain_outputs: Optional[ChainOutputs] = req.chain_outputs
        outputs: Dict[str, StructuredAgentOutput] = {}

        analyse_req = req.model_copy(update={"stage": "analyse", "chain_outputs": chain_outputs})
        analyse_res = self._run_single_stage(analyse_req, persist=False)
        chain_outputs = analyse_res.chain_outputs
        if analyse_res.output and isinstance(analyse_res.output, StructuredAgentOutput):
            outputs["analyse"] = analyse_res.output

        advise_req = req.model_copy(update={"stage": "advise", "chain_outputs": chain_outputs})
        advise_res = self._run_single_stage(advise_req, persist=False)
        chain_outputs = advise_res.chain_outputs
        if advise_res.output and isinstance(advise_res.output, StructuredAgentOutput):
            outputs["advise"] = advise_res.output

        plan_req = req.model_copy(update={"stage": "plan", "chain_outputs": chain_outputs})
        plan_res = self._run_single_stage(plan_req, persist=False)
        chain_outputs = plan_res.chain_outputs
        if plan_res.output and isinstance(plan_res.output, StructuredAgentOutput):
            outputs["plan"] = plan_res.output

        if "analyse" not in outputs or "advise" not in outputs or "plan" not in outputs:
            raise ValueError("Full chain execution did not return all expected stage outputs.")

        analyst_views = self._build_analyst_views(req.input, outputs["analyse"])
        analysis_selection = self._select_best_analyst(analyst_views)
        strategic_paths = self._build_strategic_paths(
            req.input,
            analysis_selection=analysis_selection,
            advise_output=outputs["advise"],
        )
        strategy_decision = self._select_strategy_path(strategic_paths)
        execution_plan = self._build_execution_plan(
            req.input,
            strategy_decision=strategy_decision,
            plan_output=outputs["plan"],
        )
        interaction_hooks = self._build_interaction_hooks(strategy_decision)

        supporting_signals = select_supporting_signals_for_text(req.input, limit=4)

        context_summary = {
            "chain_executed": True,
            "stages": ["analyse", "advise", "plan"],
            "phase": "v8_3_contract_hardened",
            "multi_analyst_generated": True,
            "strategic_paths_generated": len(strategic_paths),
            "selected_analyst_id": analysis_selection.recommended_analyst_id,
            "selected_path_id": strategy_decision.selected_path_id,
            "supporting_signals": [signal.get("id", "") for signal in supporting_signals],
            "company_id": req.company_id,
            "company_name": req.company_name or (req.company_profile.company_name if req.company_profile else None),
        }

        multi_path_output = {
            "analyst_views": [item.model_dump() for item in analyst_views],
            "analysis_selection": analysis_selection.model_dump(),
            "strategic_paths": [item.model_dump() for item in strategic_paths],
            "strategy_decision": strategy_decision.model_dump(),
            "execution_plan": execution_plan.model_dump(),
            "interaction_hooks": interaction_hooks.model_dump(),
        }

        response = AgentEngageResponse(
            output=None,
            outputs=outputs,
            chain_outputs=chain_outputs,
            analyst_views=analyst_views,
            analysis_selection=analysis_selection,
            strategic_paths=strategic_paths,
            strategy_decision=strategy_decision,
            execution_plan=execution_plan,
            interaction_hooks=interaction_hooks,
            multi_path_output=multi_path_output,
            context_summary=context_summary,
            meta={
                "mode": "full_chain",
                "legacy_chain_preserved": True,
                "supporting_signals": supporting_signals,
                "contract_version": "v8.3",
            },
        )

        self._persist_response(
            req=req,
            requested_stage="full_chain",
            completed_steps=["analyse", "advise", "plan"],
            chain_outputs=chain_outputs.model_dump() if hasattr(chain_outputs, "model_dump") else outputs,
            evidence={
                "supporting_signals": supporting_signals,
                "multi_path_output": multi_path_output,
            },
            explanation={
                "context_summary": context_summary,
                "meta": response.meta,
            },
            privacy={},
        )

        return response

    def _run_single_stage(
        self,
        req: AgentEngageRequest,
        persist: bool = True,
    ) -> AgentEngageResponse:
        conversation_history = [
            item.model_dump() if hasattr(item, "model_dump") else item
            for item in (req.conversation_history or [])
        ]

        context = build_context_block(
            user_input=req.input,
            stage=req.stage,
            profile=req.company_profile,
            chain_outputs=req.chain_outputs,
            conversation_history=conversation_history,
        )

        output = self.llm.generate_structured_json(
            prompt=context["prompt"],
            stage=req.stage,
            response_model=StructuredAgentOutput,
        )

        if not output.missing_profile_data:
            output.missing_profile_data = list(context["missing_profile_data"])

        if not output.profile_references:
            output.profile_references = list(context["profile_references"])

        prior_stages: List[str] = []
        if req.chain_outputs:
            if req.chain_outputs.analyse:
                prior_stages.append("analyse")
            if req.chain_outputs.advise:
                prior_stages.append("advise")
            if req.chain_outputs.plan:
                prior_stages.append("plan")
            if req.chain_outputs.profile:
                prior_stages.append("profile")

        if not output.based_on_stages:
            output.based_on_stages = prior_stages

        supporting_signals = select_supporting_signals_for_text(req.input, limit=3)
        derived_confidence = self._derive_confidence(output, supporting_signals)
        time_relevance = self._derive_time_relevance(supporting_signals)

        output.confidence = derived_confidence
        output.based_on_signals = [signal.get("id", "") for signal in supporting_signals]
        output.time_relevance = time_relevance
        output.supporting_signal_details = [
            {
                "id": signal.get("id", ""),
                "headline": signal.get("headline", ""),
                "source": signal.get("source", ""),
                "confidence_score": float(signal.get("confidence_score", 0.0)),
                "relative_time": signal.get("relative_time", ""),
                "lifecycle": signal.get("lifecycle", ""),
            }
            for signal in supporting_signals
        ]

        updated_chain = update_chain_outputs(
            chain_outputs=req.chain_outputs,
            stage=req.stage,
            output=output,
        )

        response = AgentEngageResponse(
            output=output,
            outputs=None,
            chain_outputs=updated_chain,
            context_summary={
                "follow_up_detected": context["follow_up"],
                "profile_references": output.profile_references,
                "missing_profile_data": output.missing_profile_data,
                "based_on_stages": output.based_on_stages,
                "based_on_signals": output.based_on_signals,
                "time_relevance": output.time_relevance,
                "company_id": req.company_id,
            },
            meta={
                "stage": req.stage,
                "supporting_signals": supporting_signals,
                "credibility_layer": True,
                "contract_version": "v8.3",
            },
        )

        if persist:
            serialised_outputs = (
                updated_chain.model_dump()
                if hasattr(updated_chain, "model_dump")
                else {
                    req.stage: output.model_dump() if hasattr(output, "model_dump") else output
                }
            )
            self._persist_response(
                req=req,
                requested_stage=req.stage,
                completed_steps=[req.stage],
                chain_outputs=serialised_outputs,
                evidence={"supporting_signals": supporting_signals},
                explanation={
                    "context_summary": response.context_summary,
                    "meta": response.meta,
                },
                privacy={},
            )

        return response

    def _persist_response(
        self,
        *,
        req: AgentEngageRequest,
        requested_stage: str,
        completed_steps: List[str],
        chain_outputs: Dict[str, Any],
        evidence: Dict[str, Any],
        explanation: Dict[str, Any],
        privacy: Dict[str, Any],
    ) -> None:
        try:
            save_agent_run(
                company_name=req.company_name or (req.company_profile.company_name if req.company_profile else None),
                input_text=req.input,
                anonymized_input=req.input,
                requested_stage=requested_stage,
                completed_steps=completed_steps,
                chain_outputs=chain_outputs,
                evidence=evidence,
                explanation=explanation,
                privacy=privacy,
            )
        except Exception:
            # Persistence should never break live agent responses.
            pass

    def _derive_confidence(
        self,
        output: StructuredAgentOutput,
        supporting_signals: List[Dict[str, Any]],
    ) -> float:
        signal_confidence = (
            sum(float(signal.get("confidence_score", 0.0)) for signal in supporting_signals)
            / max(1, len(supporting_signals))
        )

        base_confidence = getattr(output, "confidence", None)
        if isinstance(base_confidence, (int, float)):
            blended = (float(base_confidence) * 0.55) + (signal_confidence * 0.45)
        else:
            blended = signal_confidence

        return round(max(0.0, min(1.0, blended)), 2)

    def _derive_time_relevance(self, supporting_signals: List[Dict[str, Any]]) -> str:
        if not supporting_signals:
            return "Short-term"

        freshest = min(int(signal.get("freshness_minutes", 999999)) for signal in supporting_signals)

        if freshest < 60:
            return "Immediate"
        if freshest <= 360:
            return "Short-term"
        return "Medium-term"

    def _build_analyst_views(
        self,
        user_input: str,
        analyse_output: StructuredAgentOutput,
    ) -> List[MultiAnalystView]:
        base_drivers = list(analyse_output.drivers or [])
        base_effects = list(analyse_output.second_order_effects or [])
        base_actions = list(analyse_output.recommended_actions or [])

        systemic_view = MultiAnalystView(
            id="A1",
            lens="Systemic Risk View",
            headline=analyse_output.headline or "Systemic risk view",
            key_insight=analyse_output.key_insight or "",
            drivers=base_drivers,
            second_order_effects=base_effects,
            opportunity_signal="Resilience pressure may create demand for advisory, operational, and implementation support.",
            risk_signal="Without prioritisation, resources may be spread too broadly and commercial focus may weaken.",
            confidence=analyse_output.confidence,
        )

        commercial_view = MultiAnalystView(
            id="A2",
            lens="Commercial Opportunity View",
            headline=f"Commercial Opportunity: {analyse_output.headline or 'Emerging window'}",
            key_insight=(
                f"{analyse_output.key_insight or ''} "
                "The strongest upside is likely in offers that can be packaged, deployed quickly, and tied to measurable outcomes."
            ).strip(),
            drivers=base_drivers,
            second_order_effects=base_effects,
            opportunity_signal="Clients under resilience pressure often unlock budget faster for services linked to continuity, speed, and efficiency.",
            risk_signal="Fast-growing demand can become commoditised if differentiation and delivery speed are weak.",
            confidence=min(1.0, float(analyse_output.confidence) + 0.05),
        )

        operational_view = MultiAnalystView(
            id="A3",
            lens="Operational Constraint View",
            headline=f"Operational Constraint: {analyse_output.headline or 'Execution pressure'}",
            key_insight=(
                f"{analyse_output.key_insight or ''} "
                "Execution risk rises if capability, delivery capacity, or target-sector fit are unclear."
            ).strip(),
            drivers=base_drivers,
            second_order_effects=base_effects + (base_actions[:2] if base_actions else []),
            opportunity_signal="Operationally realistic offers can establish early credibility and create repeatable service lines.",
            risk_signal="Over-committing before delivery readiness is proven can damage trust and reduce future expansion options.",
            confidence=max(0.0, float(analyse_output.confidence) - 0.05),
        )

        return [systemic_view, commercial_view, operational_view]

    def _select_best_analyst(self, analyst_views: List[MultiAnalystView]) -> AnalysisSelection:
        selected = next((view for view in analyst_views if view.id == "A2"), analyst_views[0])
        return AnalysisSelection(
            recommended_analyst_id=selected.id,
            reason="This view is the most commercially actionable because it balances demand signal strength, monetisation potential, and speed-to-offer.",
            tradeoffs=[
                "A more systemic view may be stronger for board-level risk framing.",
                "A more operational view may reduce execution risk but slow market entry.",
            ],
        )

    def _build_strategic_paths(
        self,
        user_input: str,
        analysis_selection: AnalysisSelection,
        advise_output: StructuredAgentOutput,
    ) -> List[StrategicPath]:
        base_actions = list(advise_output.recommended_actions or [])

        return [
            StrategicPath(
                id="S1",
                name="Rapid Pilot Launch",
                approach="Launch a focused resilience service pilot quickly using existing capabilities and test demand with priority clients.",
                where_it_wins="Best when speed matters, demand is visible, and the organisation needs commercial validation before wider investment.",
                risks=[
                    "Offer may be too narrow if demand assumptions are wrong.",
                    "Pilot may underperform if target segment is poorly chosen.",
                ],
                requirements=[
                    "Fast packaging of an offer",
                    "Access to a small set of target clients",
                    "Basic delivery readiness",
                ],
                time_horizon="short",
                confidence=max(0.0, min(1.0, float(advise_output.confidence))),
                recommended_actions=base_actions[:3] if base_actions else [],
                selected_from_analyst=analysis_selection.recommended_analyst_id,
            ),
            StrategicPath(
                id="S2",
                name="Sector-Focused Differentiation",
                approach="Prioritise one or two sectors with acute resilience pressure and build a more differentiated sector-specific offer.",
                where_it_wins="Best when premium positioning and sharper differentiation matter more than speed.",
                risks=[
                    "Longer time to market",
                    "Risk of over-specialisation too early",
                ],
                requirements=[
                    "Sector insight",
                    "Sharper messaging",
                    "Capability alignment to specific client needs",
                ],
                time_horizon="medium",
                confidence=max(0.0, min(1.0, float(advise_output.confidence) - 0.05)),
                recommended_actions=base_actions[1:4] if len(base_actions) > 1 else base_actions,
                selected_from_analyst=analysis_selection.recommended_analyst_id,
            ),
            StrategicPath(
                id="S3",
                name="Capability-First Internal Readiness",
                approach="Delay external push slightly and strengthen capability, packaging, and delivery readiness before go-to-market.",
                where_it_wins="Best when internal readiness is low and delivery failure would be costly.",
                risks=[
                    "Opportunity window may narrow",
                    "Competitors may establish stronger market position first",
                ],
                requirements=[
                    "Internal alignment",
                    "Clear service architecture",
                    "Delivery capability mapping",
                ],
                time_horizon="medium",
                confidence=max(0.0, min(1.0, float(advise_output.confidence) - 0.1)),
                recommended_actions=base_actions[-3:] if base_actions else [],
                selected_from_analyst=analysis_selection.recommended_analyst_id,
            ),
        ]

    def _select_strategy_path(self, strategic_paths: List[StrategicPath]) -> StrategyDecision:
        selected = next((path for path in strategic_paths if path.id == "S1"), strategic_paths[0])
        return StrategyDecision(
            selected_path_id=selected.id,
            reason="Rapid Pilot Launch is the strongest first move because it maximises speed of learning, limits downside exposure, and creates real market evidence.",
            why_not_others=[
                "Sector-Focused Differentiation may be stronger later, but slows first proof.",
                "Capability-First Internal Readiness is safer, but risks losing momentum.",
            ],
        )

    def _build_execution_plan(
        self,
        user_input: str,
        strategy_decision: StrategyDecision,
        plan_output: StructuredAgentOutput,
    ) -> ExecutionPlan:
        base_actions = list(plan_output.recommended_actions or [])

        immediate_actions = [
            "Confirm executive owner for the selected resilience growth initiative.",
            "Define the first pilot offer, target client profile, and core value promise.",
            "Review current capabilities to identify what can be sold immediately.",
        ]

        short_term_actions = [
            "Prototype one to two resilience-focused service packages.",
            "Run targeted client outreach to validate demand and gather objections.",
            "Track competitor positioning and adjust packaging to preserve differentiation.",
        ]

        mid_term_actions = [
            "Convert pilot learning into a repeatable go-to-market motion.",
            "Refine delivery process, pricing logic, and proof points from early engagements.",
            "Decide whether to scale, narrow, or reposition based on pilot performance.",
        ]

        if base_actions:
            short_term_actions = short_term_actions + base_actions[:2]

        return ExecutionPlan(
            objective="Execute the selected strategy path in a way that captures near-term demand while validating commercial fit and delivery readiness.",
            selected_path_id=strategy_decision.selected_path_id,
            phases=[
                ExecutionPlanPhase(
                    phase="Immediate (0-7 days)",
                    actions=immediate_actions,
                    owner="Executive / Strategy Lead",
                ),
                ExecutionPlanPhase(
                    phase="Short-term (1-4 weeks)",
                    actions=short_term_actions,
                    owner="Product / Commercial / Client Team",
                ),
                ExecutionPlanPhase(
                    phase="Mid-term (1-3 months)",
                    actions=mid_term_actions,
                    owner="Leadership / Delivery / Growth Team",
                ),
            ],
        )

    def _build_interaction_hooks(self, strategy_decision: StrategyDecision) -> InteractionHooks:
        return InteractionHooks(
            primary_recommendation=strategy_decision.selected_path_id,
            alternatives_available=True,
            feedback_required=True,
            actions=[
                {"id": "execute", "label": "Execute"},
                {"id": "save", "label": "Save for later"},
                {"id": "reject", "label": "Reject"},
            ],
        )