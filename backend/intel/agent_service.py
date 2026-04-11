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
    SupportingSignalDetail,
)
from backend.services.signal_ingestion import select_supporting_signals_for_text


class AgentService:
    def __init__(self) -> None:
        self.llm = LLMClient()

    def engage(self, req: AgentEngageRequest) -> AgentEngageResponse:
        if req.stage == "full_chain":
            return self._run_full_chain(req)

        return self._run_single_stage(req)

    def _run_full_chain(self, req: AgentEngageRequest) -> AgentEngageResponse:
        chain_outputs: Optional[ChainOutputs] = req.chain_outputs
        outputs: Dict[str, StructuredAgentOutput] = {}

        analyse_req = req.model_copy(update={"stage": "analyse", "chain_outputs": chain_outputs})
        analyse_res = self._run_single_stage(analyse_req)
        chain_outputs = analyse_res.chain_outputs
        if isinstance(analyse_res.output, StructuredAgentOutput):
            outputs["analyse"] = analyse_res.output

        advise_req = req.model_copy(update={"stage": "advise", "chain_outputs": chain_outputs})
        advise_res = self._run_single_stage(advise_req)
        chain_outputs = advise_res.chain_outputs
        if isinstance(advise_res.output, StructuredAgentOutput):
            outputs["advise"] = advise_res.output

        plan_req = req.model_copy(update={"stage": "plan", "chain_outputs": chain_outputs})
        plan_res = self._run_single_stage(plan_req)
        chain_outputs = plan_res.chain_outputs
        if isinstance(plan_res.output, StructuredAgentOutput):
            outputs["plan"] = plan_res.output

        if "analyse" not in outputs or "advise" not in outputs or "plan" not in outputs:
            raise ValueError("Full chain execution did not return all expected stage outputs.")

        analyst_views = self._build_analyst_views(outputs["analyse"])
        analysis_selection = self._select_best_analyst(analyst_views)
        strategic_paths = self._build_strategic_paths(
            analysis_selection=analysis_selection,
            advise_output=outputs["advise"],
            analyse_output=outputs["analyse"],
        )
        strategy_decision = self._select_strategy_path(strategic_paths)
        execution_plan = self._build_execution_plan(
            strategy_decision=strategy_decision,
            plan_output=outputs["plan"],
        )
        interaction_hooks = self._build_interaction_hooks(strategy_decision)

        supporting_signals = select_supporting_signals_for_text(req.input, limit=4)
        supporting_signal_ids = [signal.get("id", "") for signal in supporting_signals]

        context_summary = {
            "chain_executed": True,
            "stages": ["analyse", "advise", "plan"],
            "phase": "v8_3_signal_grounded_chain",
            "multi_analyst_generated": True,
            "strategic_paths_generated": len(strategic_paths),
            "selected_analyst_id": analysis_selection.recommended_analyst_id,
            "selected_path_id": strategy_decision.selected_path_id,
            "supporting_signals": supporting_signal_ids,
            "company_id": req.company_id,
            "company_name": req.company_name or (
                req.company_profile.company_name if req.company_profile else None
            ),
        }

        multi_path_output = {
            "analyst_views": [item.model_dump() for item in analyst_views],
            "analysis_selection": analysis_selection.model_dump(),
            "strategic_paths": [item.model_dump() for item in strategic_paths],
            "strategy_decision": strategy_decision.model_dump(),
            "execution_plan": execution_plan.model_dump(),
            "interaction_hooks": interaction_hooks.model_dump(),
        }

        return AgentEngageResponse(
            output=None,
            outputs=outputs,
            chain_outputs=chain_outputs,
            analyst_views=[item.model_dump() for item in analyst_views],
            analysis_selection=analysis_selection.model_dump(),
            strategic_paths=[item.model_dump() for item in strategic_paths],
            strategy_decision=strategy_decision.model_dump(),
            execution_plan=execution_plan.model_dump(),
            interaction_hooks=interaction_hooks.model_dump(),
            multi_path_output=multi_path_output,
            context_summary=context_summary,
            meta={
                "mode": "full_chain",
                "legacy_chain_preserved": True,
                "supporting_signals": supporting_signals,
                "contract_version": "v8.3",
            },
        )

    def _run_single_stage(self, req: AgentEngageRequest) -> AgentEngageResponse:
        conversation_history = [
            item.model_dump() if hasattr(item, "model_dump") else item
            for item in (req.conversation_history or [])
        ]

        supporting_signals = select_supporting_signals_for_text(req.input, limit=4)

        context = build_context_block(
            user_input=req.input,
            stage=req.stage,
            profile=req.company_profile,
            chain_outputs=req.chain_outputs,
            conversation_history=conversation_history,
            supporting_signals=supporting_signals,
        )

        output = self.llm.generate_structured_json(
            prompt=context["prompt"],
            stage=req.stage,
            response_model=StructuredAgentOutput,
        )

        output = self._enrich_output(
            req=req,
            output=output,
            supporting_signals=supporting_signals,
            context=context,
        )

        updated_chain = update_chain_outputs(
            chain_outputs=req.chain_outputs,
            stage=req.stage,
            output=output,
        )

        return AgentEngageResponse(
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
                "supporting_signal_count": context.get("supporting_signal_count", 0),
            },
            meta={
                "stage": req.stage,
                "supporting_signals": supporting_signals,
                "credibility_layer": True,
                "contract_version": "v8.3",
            },
        )

    def _enrich_output(
        self,
        req: AgentEngageRequest,
        output: StructuredAgentOutput,
        supporting_signals: List[Dict[str, Any]],
        context: Dict[str, Any],
    ) -> StructuredAgentOutput:
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

        output.based_on_signals = [
            signal.get("id", "")
            for signal in supporting_signals
            if signal.get("id")
        ]

        output.time_relevance = self._derive_time_relevance(supporting_signals)
        output.confidence = self._derive_confidence(output, supporting_signals)
        output.supporting_signal_details = [
            self._normalise_signal_detail(signal) for signal in supporting_signals
        ]

        if not output.time_horizon:
            output.time_horizon = self._map_time_relevance_to_horizon(output.time_relevance)

        if not output.urgency:
            output.urgency = self._derive_urgency(supporting_signals)

        output = self._repair_output(req=req, output=output, supporting_signals=supporting_signals)

        return output

    def _normalise_signal_detail(self, signal: Dict[str, Any]) -> SupportingSignalDetail:
        return SupportingSignalDetail(
            id=signal.get("id"),
            headline=signal.get("headline"),
            summary=signal.get("summary"),
            source=signal.get("source"),
            source_type=signal.get("source_type"),
            region=signal.get("region"),
            cluster_tag=signal.get("cluster_tag"),
            kind=signal.get("kind"),
            severity=signal.get("severity"),
            lifecycle=signal.get("lifecycle"),
            confidence=signal.get("confidence"),
            confidence_score=float(signal.get("confidence_score", 0.0))
            if signal.get("confidence_score") is not None
            else None,
            signal_strength=float(signal.get("signal_strength", 0.0))
            if signal.get("signal_strength") is not None
            else None,
            freshness_minutes=int(signal.get("freshness_minutes"))
            if signal.get("freshness_minutes") is not None
            else None,
            timestamp=signal.get("timestamp"),
            detected_at=signal.get("detected_at"),
            updated_at=signal.get("updated_at"),
            relative_time=signal.get("relative_time"),
        )

    def _repair_output(
        self,
        req: AgentEngageRequest,
        output: StructuredAgentOutput,
        supporting_signals: List[Dict[str, Any]],
    ) -> StructuredAgentOutput:
        signal_headlines = [
            str(signal.get("headline", "")).strip()
            for signal in supporting_signals
            if signal.get("headline")
        ]
        signal_clusters = [
            str(signal.get("cluster_tag", "")).strip()
            for signal in supporting_signals
            if signal.get("cluster_tag")
        ]
        signal_summaries = [
            str(signal.get("summary", "")).strip()
            for signal in supporting_signals
            if signal.get("summary")
        ]

        profile_name = req.company_profile.company_name if req.company_profile else None
        priorities = list(req.company_profile.strategic_priorities or []) if req.company_profile else []

        if not output.headline or output.headline.strip().lower() in {"not available", "unknown", "n/a"}:
            if signal_clusters:
                cluster = signal_clusters[0]
                if req.stage == "analyse":
                    output.headline = f"{cluster} signal pattern is shaping executive attention"
                elif req.stage == "advise":
                    output.headline = f"{cluster} conditions require a near-term management response"
                elif req.stage == "plan":
                    output.headline = f"{cluster} response plan should be sequenced and owned"
                else:
                    output.headline = f"{cluster} context should recalibrate company interpretation"
            else:
                output.headline = f"{req.stage.title()} response for {profile_name or 'the company'}"

        if not output.key_insight or output.key_insight.strip().lower() in {"not available", "unknown", "n/a"}:
            if signal_summaries:
                insight_seed = signal_summaries[0]
                if req.stage == "analyse":
                    output.key_insight = (
                        f"Supporting signals indicate that {insight_seed[:220].rstrip('.')}."
                    )
                elif req.stage == "advise":
                    output.key_insight = (
                        "The strongest next move is to make a decision that matches the current signal pattern "
                        "to company priorities and timing."
                    )
                elif req.stage == "plan":
                    output.key_insight = (
                        "The selected response now needs clear ownership, short sequencing, and measurable checkpoints."
                    )
                else:
                    output.key_insight = (
                        "Profile calibration should focus on the company details that most change relevance and action quality."
                    )
            else:
                output.key_insight = f"GeoPulse generated a {req.stage} view with limited supporting evidence depth."

        if len(output.drivers) < 2:
            inferred_drivers = []
            for signal in supporting_signals[:3]:
                headline = str(signal.get("headline", "")).strip()
                cluster = str(signal.get("cluster_tag", "")).strip()
                if headline:
                    inferred_drivers.append(headline)
                elif cluster:
                    inferred_drivers.append(f"Signal cluster: {cluster}")
            output.drivers = self._merge_unique(output.drivers, inferred_drivers, limit=4)

        if len(output.second_order_effects) < 2 and req.stage in {"analyse", "advise"}:
            inferred_effects = [
                "Management attention may shift toward timing-sensitive risk and opportunity decisions.",
                "Budget, delivery, or prioritisation pressure may increase if multiple signals keep reinforcing the same pattern.",
            ]
            output.second_order_effects = self._merge_unique(
                output.second_order_effects,
                inferred_effects,
                limit=4,
            )

        if len(output.implications) < 2:
            inferred_implications = []
            if priorities:
                inferred_implications.append(
                    f"Any response should be evaluated against current priorities: {', '.join(priorities[:3])}."
                )
            inferred_implications.append(
                "Leadership should treat this as an evidence-led decision area rather than a generic market observation."
            )
            output.implications = self._merge_unique(output.implications, inferred_implications, limit=4)

        if len(output.recommended_actions) < 2:
            stage_actions = {
                "analyse": [
                    "Validate whether the signal pattern is strengthening, stabilising, or fading over the next monitoring cycle.",
                    "Review direct company exposure against the strongest supporting signals.",
                ],
                "advise": [
                    "Choose a near-term response that aligns with company priorities and delivery reality.",
                    "Test the preferred option against downside risk, timing, and commercial upside.",
                ],
                "plan": [
                    "Assign an accountable owner for the first response phase.",
                    "Define the first checkpoint, success metric, and review date.",
                ],
                "profile": [
                    "Fill the most material missing company profile fields before deeper analysis.",
                    "Confirm the priority weighting GeoPulse should use for future recommendations.",
                ],
            }
            output.recommended_actions = self._merge_unique(
                output.recommended_actions,
                stage_actions.get(req.stage, []),
                limit=5,
            )

        if req.stage == "advise":
            if not output.decision_context:
                output.decision_context = (
                    "Management should decide how aggressively to respond given current evidence strength, timing, "
                    "and company priorities."
                )
            if not output.tradeoffs:
                output.tradeoffs = [
                    "Moving early may capture upside faster but increase execution risk.",
                    "Waiting for more confirmation may reduce false moves but can narrow the timing window.",
                ]

        if req.stage == "plan":
            if not output.dependencies:
                output.dependencies = [
                    "Confirmed executive owner",
                    "Clear target outcome",
                    "Access to current supporting evidence and company context",
                ]
            if not output.milestones:
                output.milestones = [
                    "Initial decision confirmed",
                    "First response actions launched",
                    "Review point completed with evidence update",
                ]
            if not output.success_metrics:
                output.success_metrics = [
                    "Decision executed on time",
                    "First response actions completed",
                    "Executive review shows improved clarity or reduced exposure",
                ]
            if not output.review_checkpoints:
                output.review_checkpoints = [
                    "Review evidence quality after first cycle",
                    "Check whether the signal pattern is strengthening or weakening",
                    "Decide whether to scale, adjust, or stop the response",
                ]

        if not output.explanation_notes:
            if supporting_signals:
                output.explanation_notes = [
                    f"Response grounded in {len(supporting_signals)} supporting signals.",
                    "Confidence blends model output quality with supporting signal confidence.",
                ]
            else:
                output.explanation_notes = [
                    "Supporting signal depth was limited, so confidence is constrained."
                ]

        return output

    def _merge_unique(self, existing: List[str], additions: List[str], limit: int) -> List[str]:
        result: List[str] = []
        for item in list(existing or []) + list(additions or []):
            text = str(item or "").strip()
            if text and text not in result:
                result.append(text)
            if len(result) >= limit:
                break
        return result

    def _derive_confidence(
        self,
        output: StructuredAgentOutput,
        supporting_signals: List[Dict[str, Any]],
    ) -> float:
        signal_confidence_values: List[float] = []
        for signal in supporting_signals:
            raw = signal.get("confidence_score", 0.0)
            try:
                value = float(raw)
                if value > 1:
                    value = value / 100.0
                signal_confidence_values.append(value)
            except (TypeError, ValueError):
                continue

        signal_confidence = (
            sum(signal_confidence_values) / max(1, len(signal_confidence_values))
            if signal_confidence_values
            else 0.45
        )

        base_confidence = getattr(output, "confidence", None)
        if isinstance(base_confidence, (int, float)):
            base_value = float(base_confidence)
            if base_value > 1:
                base_value = base_value / 100.0
            blended = (base_value * 0.60) + (signal_confidence * 0.40)
        else:
            blended = signal_confidence

        return round(max(0.0, min(1.0, blended)), 2)

    def _derive_time_relevance(self, supporting_signals: List[Dict[str, Any]]) -> str:
        if not supporting_signals:
            return "Short-term"

        freshness_values: List[int] = []
        for signal in supporting_signals:
            raw = signal.get("freshness_minutes", 999999)
            try:
                freshness_values.append(int(raw))
            except (TypeError, ValueError):
                continue

        if not freshness_values:
            return "Short-term"

        freshest = min(freshness_values)

        if freshest < 60:
            return "Immediate"
        if freshest <= 360:
            return "Short-term"
        return "Medium-term"

    def _map_time_relevance_to_horizon(self, time_relevance: Optional[str]) -> str:
        mapping = {
            "Immediate": "short",
            "Short-term": "short",
            "Medium-term": "medium",
        }
        return mapping.get(time_relevance or "", "medium")

    def _derive_urgency(self, supporting_signals: List[Dict[str, Any]]) -> str:
        if not supporting_signals:
            return "Medium"

        severe_count = 0
        fresh_count = 0

        for signal in supporting_signals:
            severity = str(signal.get("severity", "")).lower()
            freshness = signal.get("freshness_minutes", 999999)

            if severity == "high":
                severe_count += 1

            try:
                if int(freshness) <= 180:
                    fresh_count += 1
            except (TypeError, ValueError):
                pass

        if severe_count >= 2 or (severe_count >= 1 and fresh_count >= 2):
            return "High"
        if fresh_count >= 1:
            return "Medium"
        return "Low"

    def _build_analyst_views(
        self,
        analyse_output: StructuredAgentOutput,
    ) -> List[MultiAnalystView]:
        base_drivers = list(analyse_output.drivers or [])
        base_effects = list(analyse_output.second_order_effects or [])

        systemic_view = MultiAnalystView(
            id="A1",
            lens="Systemic Risk View",
            headline=analyse_output.headline or "Systemic risk view",
            key_insight=analyse_output.key_insight or "",
            drivers=base_drivers,
            second_order_effects=base_effects,
            opportunity_signal="Cross-signal alignment may create demand for resilience, advisory, and timing-sensitive decision support.",
            risk_signal="If the pattern intensifies, leadership may face compounding pressure across priorities, capital allocation, and delivery focus.",
            confidence=max(0.0, min(1.0, float(analyse_output.confidence or 0.0))),
        )

        commercial_view = MultiAnalystView(
            id="A2",
            lens="Commercial Opportunity View",
            headline=f"Commercial Opportunity: {analyse_output.headline or 'Emerging window'}",
            key_insight=(
                f"{analyse_output.key_insight or ''} "
                "The strongest upside is likely in offers that can be packaged quickly and tied to measurable outcomes."
            ).strip(),
            drivers=base_drivers,
            second_order_effects=base_effects,
            opportunity_signal="Where signals reinforce urgency or pressure, buying intent may accelerate for practical and outcome-led offers.",
            risk_signal="Commercial upside can still be missed if the offer is vague, slow to deploy, or weakly differentiated.",
            confidence=max(0.0, min(1.0, float(analyse_output.confidence or 0.0) + 0.04)),
        )

        operational_view = MultiAnalystView(
            id="A3",
            lens="Operational Constraint View",
            headline=f"Operational Constraint: {analyse_output.headline or 'Execution pressure'}",
            key_insight=(
                f"{analyse_output.key_insight or ''} "
                "Execution risk rises if capability, capacity, ownership, or sequencing are unclear."
            ).strip(),
            drivers=base_drivers,
            second_order_effects=base_effects,
            opportunity_signal="A narrow, operationally realistic response can create credibility and repeatable delivery confidence.",
            risk_signal="Over-committing before readiness is clear can weaken trust and reduce future room to expand.",
            confidence=max(0.0, min(1.0, float(analyse_output.confidence or 0.0) - 0.05)),
        )

        return [systemic_view, commercial_view, operational_view]

    def _select_best_analyst(self, analyst_views: List[MultiAnalystView]) -> AnalysisSelection:
        selected = next((view for view in analyst_views if view.id == "A2"), analyst_views[0])
        return AnalysisSelection(
            recommended_analyst_id=selected.id,
            reason="This view is the most commercially actionable because it balances signal strength, monetisation potential, and speed-to-action.",
            tradeoffs=[
                "A more systemic view may be stronger for board-level risk framing.",
                "A more operational view may reduce execution risk but slow market entry.",
            ],
        )

    def _build_strategic_paths(
        self,
        analysis_selection: AnalysisSelection,
        advise_output: StructuredAgentOutput,
        analyse_output: StructuredAgentOutput,
    ) -> List[StrategicPath]:
        base_actions = list(advise_output.recommended_actions or [])
        analyse_confidence = max(0.0, min(1.0, float(analyse_output.confidence or 0.0)))
        advise_confidence = max(0.0, min(1.0, float(advise_output.confidence or 0.0)))

        return [
            StrategicPath(
                id="S1",
                name="Rapid Pilot Launch",
                approach="Launch a focused response quickly using current capabilities and test demand or exposure with a contained first move.",
                where_it_wins="Best when speed matters, evidence is fresh, and leadership needs real-world proof before wider commitment.",
                risks=[
                    "The first move may be too narrow if demand or exposure is misread.",
                    "Pilot quality may suffer if ownership and delivery readiness are unclear.",
                ],
                requirements=[
                    "Named executive owner",
                    "Clear first use case or pilot audience",
                    "Ability to move within a short window",
                ],
                time_horizon="short",
                confidence=max(0.0, min(1.0, (advise_confidence * 0.65) + (analyse_confidence * 0.35))),
                recommended_actions=base_actions[:3] if base_actions else [],
                selected_from_analyst=analysis_selection.recommended_analyst_id,
                commercial_impact="Fastest route to market learning and early executive proof.",
            ),
            StrategicPath(
                id="S2",
                name="Sector-Focused Differentiation",
                approach="Prioritise a narrower segment or use case and build a more differentiated response around that focus area.",
                where_it_wins="Best when premium positioning and sharper relevance matter more than immediate speed.",
                risks=[
                    "Longer time to market",
                    "Risk of narrowing too early before enough evidence is gathered",
                ],
                requirements=[
                    "Sharper segmentation decision",
                    "Focused messaging",
                    "Clear sector or use-case relevance",
                ],
                time_horizon="medium",
                confidence=max(0.0, min(1.0, advise_confidence - 0.05)),
                recommended_actions=base_actions[1:4] if len(base_actions) > 1 else base_actions,
                selected_from_analyst=analysis_selection.recommended_analyst_id,
                commercial_impact="Stronger differentiation if the chosen focus area is correct.",
            ),
            StrategicPath(
                id="S3",
                name="Capability-First Internal Readiness",
                approach="Strengthen internal readiness, packaging, decision discipline, and delivery confidence before moving more aggressively.",
                where_it_wins="Best when internal execution risk is high and early failure would be costly.",
                risks=[
                    "Window may narrow while internal work continues",
                    "Competitors or alternatives may move first",
                ],
                requirements=[
                    "Internal alignment",
                    "Capability and ownership clarity",
                    "Disciplined review process",
                ],
                time_horizon="medium",
                confidence=max(0.0, min(1.0, advise_confidence - 0.10)),
                recommended_actions=base_actions[-3:] if base_actions else [],
                selected_from_analyst=analysis_selection.recommended_analyst_id,
                commercial_impact="Safer initial posture with lower near-term execution risk.",
            ),
        ]

    def _select_strategy_path(self, strategic_paths: List[StrategicPath]) -> StrategyDecision:
        selected = next((path for path in strategic_paths if path.id == "S1"), strategic_paths[0])
        return StrategyDecision(
            selected_path_id=selected.id,
            reason="Rapid Pilot Launch is the strongest first move because it maximises speed of learning, limits downside exposure, and creates real operating evidence quickly.",
            why_not_others=[
                "Sector-Focused Differentiation may be stronger later, but slows first proof.",
                "Capability-First Internal Readiness is safer, but risks losing momentum.",
            ],
            scoring_summary={
                "speed_of_learning": "high",
                "downside_control": "medium-high",
                "proof_generation": "high",
            },
        )

    def _build_execution_plan(
        self,
        strategy_decision: StrategyDecision,
        plan_output: StructuredAgentOutput,
    ) -> ExecutionPlan:
        immediate_actions = [
            "Confirm executive owner for the selected response path.",
            "Define the first target outcome, target audience, and decision boundary.",
            "Review current evidence, dependencies, and delivery constraints before launch.",
        ]

        short_term_actions = [
            "Launch the first controlled response or pilot.",
            "Track early feedback, objections, risks, and evidence changes.",
            "Refine messaging, offer shape, or mitigation logic based on live results.",
        ]

        mid_term_actions = [
            "Decide whether to scale, narrow, or reposition based on real-world results.",
            "Convert learning into a repeatable operating motion.",
            "Refresh the evidence base and rerun GeoPulse to validate the next move.",
        ]

        if plan_output.recommended_actions:
            short_term_actions = self._merge_unique(
                short_term_actions,
                list(plan_output.recommended_actions[:2]),
                limit=5,
            )

        return ExecutionPlan(
            objective=(
                plan_output.headline
                or plan_output.objective
                or "Execute the selected strategy path in a way that captures near-term value while validating fit, timing, and execution readiness."
            ),
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
                    owner="Commercial / Product / Delivery Lead",
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