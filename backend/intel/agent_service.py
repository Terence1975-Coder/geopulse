from __future__ import annotations

import re
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

        analyse_req = req.model_copy(
            update={"stage": "analyse", "chain_outputs": chain_outputs}
        )
        analyse_res = self._run_single_stage(analyse_req)
        chain_outputs = analyse_res.chain_outputs
        if analyse_res.output and isinstance(analyse_res.output, StructuredAgentOutput):
            outputs["analyse"] = analyse_res.output

        advise_req = req.model_copy(
            update={"stage": "advise", "chain_outputs": chain_outputs}
        )
        advise_res = self._run_single_stage(advise_req)
        chain_outputs = advise_res.chain_outputs
        if advise_res.output and isinstance(advise_res.output, StructuredAgentOutput):
            outputs["advise"] = advise_res.output

        plan_req = req.model_copy(
            update={"stage": "plan", "chain_outputs": chain_outputs}
        )
        plan_res = self._run_single_stage(plan_req)
        chain_outputs = plan_res.chain_outputs
        if plan_res.output and isinstance(plan_res.output, StructuredAgentOutput):
            outputs["plan"] = plan_res.output

        if "analyse" not in outputs or "advise" not in outputs or "plan" not in outputs:
            raise ValueError(
                "Full chain execution did not return all expected stage outputs."
            )

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
            "phase": "v8_3_methodology_enforced",
            "multi_analyst_generated": True,
            "strategic_paths_generated": len(strategic_paths),
            "selected_analyst_id": analysis_selection.recommended_analyst_id,
            "selected_path_id": strategy_decision.selected_path_id,
            "supporting_signals": [signal.get("id", "") for signal in supporting_signals],
            "company_id": req.company_id,
            "company_name": req.company_name
            or (req.company_profile.company_name if req.company_profile else None),
            "delivery_mode": getattr(outputs["plan"], "delivery_mode", "hybrid"),
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

    def _run_single_stage(self, req: AgentEngageRequest) -> AgentEngageResponse:
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

        if req.stage == "plan":
            output = self._enforce_planner_methodology(req, output, supporting_signals)
        else:
            output = self._repair_generic_output(req, output)

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
                "based_on_signals": getattr(output, "based_on_signals", []),
                "time_relevance": getattr(output, "time_relevance", None),
                "company_id": req.company_id,
                "delivery_mode": getattr(output, "delivery_mode", None),
            },
            meta={
                "stage": req.stage,
                "supporting_signals": supporting_signals,
                "credibility_layer": True,
                "contract_version": "v8.3",
            },
        )

    def _repair_generic_output(
        self,
        req: AgentEngageRequest,
        output: StructuredAgentOutput,
    ) -> StructuredAgentOutput:
        if not output.headline:
            output.headline = f"{req.stage.title()} response"

        if not output.key_insight:
            output.key_insight = (
                "GeoPulse generated a structured response, but the model returned limited narrative detail."
            )

        if req.stage in {"advise", "analyse"} and len(output.recommended_actions) < 2:
            output.recommended_actions = self._merge_unique(
                output.recommended_actions,
                [
                    "Review the strongest evidence and confirm the next management decision.",
                    "Validate company exposure and timing before scaling response.",
                ],
                limit=4,
            )

        if req.stage == "advise" and not getattr(output, "decision_context", None):
            output.decision_context = (
                "Management should decide how aggressively to respond given evidence strength, timing, and company priorities."
            )

        if req.stage == "advise" and len(getattr(output, "tradeoffs", []) or []) < 2:
            output.tradeoffs = [
                "Moving early may capture upside faster but increase execution risk.",
                "Waiting for more confirmation may reduce false moves but narrow the timing window.",
            ]

        return output

    def _enforce_planner_methodology(
        self,
        req: AgentEngageRequest,
        output: StructuredAgentOutput,
        supporting_signals: List[Dict[str, Any]],
    ) -> StructuredAgentOutput:
        mode = self._extract_requested_methodology(req.input)
        company_name = (
            req.company_profile.company_name
            if req.company_profile and req.company_profile.company_name
            else "the company"
        )

        if not output.headline or output.headline.strip().lower() in {
            "not available",
            "unknown",
            "n/a",
        }:
            if mode == "prince2":
                output.headline = f"PRINCE2-governed execution plan for {company_name}"
            elif mode == "agile":
                output.headline = f"Agile execution plan for {company_name}"
            else:
                output.headline = f"Hybrid execution plan for {company_name}"

        if not output.key_insight or output.key_insight.strip().lower() in {
            "not available",
            "unknown",
            "n/a",
        }:
            if mode == "prince2":
                output.key_insight = (
                    "The plan should be controlled through formal stage governance, defined owners, milestone gates, and review tolerances."
                )
            elif mode == "agile":
                output.key_insight = (
                    "The plan should move through short iterations, visible priorities, rapid review loops, and continuous adaptation."
                )
            else:
                output.key_insight = (
                    "The plan should combine executive control with iterative delivery so governance and speed reinforce each other."
                )

        setattr(output, "delivery_mode", mode)
        setattr(output, "recommended_methodology", mode.upper() if mode != "hybrid" else "HYBRID")
        setattr(output, "methodology_rationale", self._methodology_rationale(mode, req))
        setattr(output, "governance_model", self._governance_model(mode))
        setattr(output, "cadence_model", self._cadence_model(mode))
        setattr(output, "workstreams", self._build_workstreams(mode, req))
        setattr(output, "risks", self._build_plan_risks(mode, req, supporting_signals))
        setattr(output, "next_7_days", self._build_next_7_days(mode, req))
        setattr(output, "plan_display_mode", mode)

        output.recommended_actions = self._merge_unique(
            output.recommended_actions,
            self._recommended_actions_by_mode(mode, req),
            limit=8,
        )
        output.dependencies = self._merge_unique(
            getattr(output, "dependencies", []) or [],
            self._dependencies_by_mode(mode),
            limit=8,
        )
        output.milestones = self._merge_unique(
            getattr(output, "milestones", []) or [],
            self._milestones_by_mode(mode),
            limit=8,
        )
        output.success_metrics = self._merge_unique(
            getattr(output, "success_metrics", []) or [],
            self._success_metrics_by_mode(mode),
            limit=8,
        )
        output.review_checkpoints = self._merge_unique(
            getattr(output, "review_checkpoints", []) or [],
            self._review_checkpoints_by_mode(mode),
            limit=8,
        )
        output.reasoning_notes = self._merge_unique(
            getattr(output, "reasoning_notes", []) or [],
            self._reasoning_notes_by_mode(mode, req),
            limit=8,
        )
        output.explanation_notes = self._merge_unique(
            getattr(output, "explanation_notes", []) or [],
            [
                "Planner mode was explicitly enforced from the execution handoff request.",
                "Plan detail is grounded in analyse and advise outputs plus current evidence context.",
            ],
            limit=8,
        )

        if len(output.recommended_actions) < 3:
            output.recommended_actions = self._merge_unique(
                output.recommended_actions,
                [
                    "Confirm executive sponsor and delivery owner.",
                    "Validate first-phase scope and decision boundary.",
                    "Set the first formal review point before launch.",
                ],
                limit=8,
            )

        return output

    def _extract_requested_methodology(self, user_input: str) -> str:
        text = (user_input or "").lower()

        explicit_match = re.search(
            r"preferred methodology:\s*(prince2|agile|hybrid|auto|hybrid / auto-select)",
            text,
        )
        if explicit_match:
            value = explicit_match.group(1)
            if value == "prince2":
                return "prince2"
            if value == "agile":
                return "agile"
            return "hybrid"

        if "prince2" in text:
            return "prince2"
        if "agile" in text:
            return "agile"

        return "hybrid"

    def _methodology_rationale(self, mode: str, req: AgentEngageRequest) -> str:
        priorities = (
            ", ".join(req.company_profile.strategic_priorities[:3])
            if req.company_profile and req.company_profile.strategic_priorities
            else "company priorities"
        )

        if mode == "prince2":
            return (
                f"PRINCE2 fits because the requested execution pattern requires stronger governance, stage control, ownership clarity, and formal review against {priorities}."
            )
        if mode == "agile":
            return (
                f"Agile fits because the requested execution pattern benefits from speed, iteration, short feedback loops, and rapid adaptation while still aligning to {priorities}."
            )
        return (
            f"Hybrid fits because the plan needs executive governance and review discipline while also preserving iterative delivery speed against {priorities}."
        )

    def _governance_model(self, mode: str) -> str:
        if mode == "prince2":
            return "Executive sponsor, project manager, stage gate reviews, exception-based escalation."
        if mode == "agile":
            return "Product-led governance with sprint reviews, backlog prioritisation, and lightweight executive oversight."
        return "Executive steering oversight with iterative delivery reviews and milestone-based governance."

    def _cadence_model(self, mode: str) -> str:
        if mode == "prince2":
            return "Stage reviews, milestone control, formal checkpoint cadence."
        if mode == "agile":
            return "Sprint planning, weekly progress review, sprint demo, retrospective."
        return "Weekly delivery rhythm with milestone gates and monthly executive review."

    def _build_workstreams(self, mode: str, req: AgentEngageRequest) -> List[str]:
        common = [
            "Executive alignment and ownership",
            "Commercial / stakeholder mobilisation",
            "Delivery readiness and execution",
        ]
        if mode == "prince2":
            return common + [
                "Governance and stage control",
                "Risk / issue / dependency management",
            ]
        if mode == "agile":
            return common + [
                "Backlog and priority management",
                "Iteration review and adaptation",
            ]
        return common + [
            "Governance checkpoints",
            "Iterative execution and learning",
        ]

    def _build_plan_risks(
        self,
        mode: str,
        req: AgentEngageRequest,
        supporting_signals: List[Dict[str, Any]],
    ) -> List[str]:
        signal_risks = []
        for signal in supporting_signals[:2]:
            headline = str(signal.get("headline", "")).strip()
            if headline:
                signal_risks.append(f"Execution assumptions may be invalidated if the signal pattern around '{headline}' shifts materially.")

        mode_risks = {
            "prince2": [
                "Governance overhead can slow momentum if stage control becomes too heavy.",
                "Escalation or approval delays may stall execution timing.",
            ],
            "agile": [
                "Iteration speed can create drift if executive decision boundaries are unclear.",
                "Backlog growth may weaken focus if priorities are not actively managed.",
            ],
            "hybrid": [
                "Governance and agility can conflict if ownership of decisions is ambiguous.",
                "The team may default to either control or speed rather than balancing both intentionally.",
            ],
        }

        return self._merge_unique(mode_risks.get(mode, []), signal_risks, limit=6)

    def _build_next_7_days(self, mode: str, req: AgentEngageRequest) -> List[str]:
        if mode == "prince2":
            return [
                "Confirm executive sponsor, project manager, and stage owner.",
                "Define stage-one scope, tolerances, and approval gate.",
                "Create a first-stage checkpoint pack with risks, dependencies, and success criteria.",
            ]
        if mode == "agile":
            return [
                "Define the initial sprint objective and delivery owner.",
                "Prioritise the first actionable backlog items.",
                "Schedule sprint review and retrospective dates before work starts.",
            ]
        return [
            "Confirm executive sponsor and delivery lead.",
            "Define the first milestone and the first iteration goal.",
            "Set both a weekly delivery review and a milestone governance checkpoint.",
        ]

    def _recommended_actions_by_mode(
        self,
        mode: str,
        req: AgentEngageRequest,
    ) -> List[str]:
        if mode == "prince2":
            return [
                "Define project board structure and approval authority.",
                "Break delivery into formal stages with entry and exit criteria.",
                "Set tolerances for scope, timing, and escalation.",
                "Create a RAID view before stage one begins.",
            ]
        if mode == "agile":
            return [
                "Define the initial sprint goal and visible backlog.",
                "Prioritise the first iteration against highest-value outcomes.",
                "Set sprint review and adaptation cadence from day one.",
                "Track learning and reprioritise after each review cycle.",
            ]
        return [
            "Create an executive governance rail alongside an iterative delivery rail.",
            "Define milestone checkpoints and weekly delivery reviews.",
            "Separate non-negotiable controls from adaptable execution tasks.",
            "Use milestone outcomes to re-prioritise the next delivery cycle.",
        ]

    def _dependencies_by_mode(self, mode: str) -> List[str]:
        if mode == "prince2":
            return [
                "Executive sponsor confirmed",
                "Project manager or equivalent control owner assigned",
                "Stage-one scope approved",
                "Risk and dependency register created",
            ]
        if mode == "agile":
            return [
                "Product or delivery owner confirmed",
                "Initial backlog prioritised",
                "Sprint rhythm agreed",
                "Stakeholder feedback loop available",
            ]
        return [
            "Executive sponsor confirmed",
            "Delivery lead confirmed",
            "Milestone governance checkpoints agreed",
            "Iterative review rhythm agreed",
        ]

    def _milestones_by_mode(self, mode: str) -> List[str]:
        if mode == "prince2":
            return [
                "Stage one approved",
                "First governance checkpoint passed",
                "Stage transition decision completed",
                "Board review confirms continuation or adjustment",
            ]
        if mode == "agile":
            return [
                "Sprint 1 objective delivered",
                "Sprint review completed",
                "Backlog reprioritised after first iteration",
                "Iteration velocity and outcome fit validated",
            ]
        return [
            "Initial governance gate passed",
            "First delivery cycle completed",
            "Weekly learning converted into milestone update",
            "Scale / adjust / stop decision taken at review gate",
        ]

    def _success_metrics_by_mode(self, mode: str) -> List[str]:
        if mode == "prince2":
            return [
                "Stage objectives achieved on approved scope",
                "No ungoverned exceptions or uncontrolled scope growth",
                "Review gates passed with clear sponsor confidence",
            ]
        if mode == "agile":
            return [
                "Sprint objectives achieved",
                "Cycle time and review quality improve over iterations",
                "Priority outcomes delivered with validated feedback",
            ]
        return [
            "Milestones achieved without loss of delivery speed",
            "Executive reviews confirm control and adaptability are both working",
            "Early execution evidence supports continuation or scaling",
        ]

    def _review_checkpoints_by_mode(self, mode: str) -> List[str]:
        if mode == "prince2":
            return [
                "End-of-stage review",
                "Exception escalation checkpoint",
                "Sponsor / board decision gate",
            ]
        if mode == "agile":
            return [
                "Sprint planning",
                "Sprint review",
                "Retrospective and reprioritisation checkpoint",
            ]
        return [
            "Weekly delivery review",
            "Milestone governance review",
            "Monthly executive steering checkpoint",
        ]

    def _reasoning_notes_by_mode(
        self,
        mode: str,
        req: AgentEngageRequest,
    ) -> List[str]:
        priorities = (
            ", ".join(req.company_profile.strategic_priorities[:3])
            if req.company_profile and req.company_profile.strategic_priorities
            else "current company priorities"
        )

        if mode == "prince2":
            return [
                f"PRINCE2 was selected because stronger control and stage governance appear more important for {priorities}.",
                "The delivery logic prioritises formal ownership, approvals, and checkpoint discipline.",
            ]
        if mode == "agile":
            return [
                f"Agile was selected because speed, iteration, and adaptive execution appear more important for {priorities}.",
                "The delivery logic prioritises short-cycle learning and rapid reprioritisation.",
            ]
        return [
            f"Hybrid was selected because both executive control and adaptive execution matter for {priorities}.",
            "The delivery logic combines governance checkpoints with iterative progress cycles.",
        ]

    def _derive_confidence(
        self,
        output: StructuredAgentOutput,
        supporting_signals: List[Dict[str, Any]],
    ) -> float:
        signal_confidence = (
            sum(float(signal.get("confidence_score", 0.0)) for signal in supporting_signals)
            / max(1, len(supporting_signals))
        )

        if signal_confidence > 1:
            signal_confidence = signal_confidence / 100.0

        base_confidence = getattr(output, "confidence", None)
        if isinstance(base_confidence, (int, float)):
            base_value = float(base_confidence)
            if base_value > 1:
                base_value = base_value / 100.0
            blended = (base_value * 0.55) + (signal_confidence * 0.45)
        else:
            blended = signal_confidence

        return round(max(0.0, min(1.0, blended)), 2)

    def _derive_time_relevance(self, supporting_signals: List[Dict[str, Any]]) -> str:
        if not supporting_signals:
            return "Short-term"

        freshest = min(
            int(signal.get("freshness_minutes", 999999)) for signal in supporting_signals
        )

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
        mode = getattr(plan_output, "delivery_mode", "hybrid")
        base_actions = list(plan_output.recommended_actions or [])

        if mode == "prince2":
            immediate_actions = [
                "Confirm executive sponsor, project manager, and stage owner.",
                "Approve stage-one scope, tolerances, and first review gate.",
                "Create RAID register and stage checkpoint pack.",
            ]
            short_term_actions = [
                "Execute stage-one activities under agreed controls.",
                "Review progress against milestone gate and tolerances.",
                "Escalate exceptions formally where thresholds are exceeded.",
            ]
            mid_term_actions = [
                "Complete stage transition review and continuation decision.",
                "Refine controls, resource plans, and scope for the next stage.",
                "Confirm sponsor confidence before scaling execution.",
            ]
        elif mode == "agile":
            immediate_actions = [
                "Confirm delivery owner and first sprint objective.",
                "Prioritise the first backlog against the highest-value outcome.",
                "Schedule sprint review and retrospective dates before launch.",
            ]
            short_term_actions = [
                "Execute sprint work and review visible progress weekly.",
                "Capture delivery feedback and reprioritise backlog items.",
                "Adjust iteration scope based on evidence from the first cycle.",
            ]
            mid_term_actions = [
                "Use sprint outcomes to confirm scale, pivot, or stop decisions.",
                "Stabilise cadence and improve velocity or focus quality.",
                "Convert validated execution patterns into repeatable delivery motion.",
            ]
        else:
            immediate_actions = [
                "Confirm executive sponsor and delivery lead.",
                "Define first milestone and first iteration goal.",
                "Set both a weekly delivery review and a milestone governance checkpoint.",
            ]
            short_term_actions = [
                "Deliver the first execution cycle while maintaining governance visibility.",
                "Use review cadence to refine next-step priorities without losing control.",
                "Track milestone movement and adapt delivery tasks where evidence changes.",
            ]
            mid_term_actions = [
                "Convert early learning into a more repeatable operating model.",
                "Review whether governance and delivery rhythm remain balanced.",
                "Decide whether to scale, narrow, or reposition the response path.",
            ]

        if base_actions:
            short_term_actions = short_term_actions + base_actions[:2]

        return ExecutionPlan(
            objective=plan_output.headline
            or "Execute the selected strategy path in a way that captures near-term demand while validating commercial fit and delivery readiness.",
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
                    owner="Delivery / Commercial Lead",
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

    def _merge_unique(
        self,
        existing: List[str],
        additions: List[str],
        limit: int,
    ) -> List[str]:
        result: List[str] = []
        for item in list(existing or []) + list(additions or []):
            text = str(item or "").strip()
            if text and text not in result:
                result.append(text)
            if len(result) >= limit:
                break
        return result