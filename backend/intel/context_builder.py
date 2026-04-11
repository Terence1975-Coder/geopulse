from __future__ import annotations

import re
from typing import Dict, List, Tuple

from backend.intel.chain_state import serialise_chain_for_prompt
from backend.intel.schemas import AgentStage, ChainOutputs, CompanyProfile


FOLLOW_UP_PHRASES = {
    "dig deeper",
    "expand",
    "relook",
    "go deeper",
    "deepen",
    "look again",
    "review again",
}


def detect_follow_up_intent(user_input: str) -> bool:
    text = (user_input or "").strip().lower()
    return any(phrase in text for phrase in FOLLOW_UP_PHRASES)


def detect_requested_delivery_mode(user_input: str) -> str:
    text = (user_input or "").lower()

    if re.search(r"\bprince2\b", text):
        return "prince2"

    if re.search(r"\bagile\b", text) or re.search(r"\bsprint\b", text):
        return "agile"

    if re.search(r"\bhybrid\b", text) or re.search(r"auto[- ]?select", text):
        return "hybrid"

    return "hybrid"


def summarise_profile(profile: CompanyProfile | None) -> Tuple[str, List[str], List[str]]:
    if not profile:
        return (
            "No company profile has been provided.",
            [],
            [
                "company_name",
                "sector",
                "markets",
                "strategic_priorities",
                "risk_tolerance",
                "recommendation_style",
            ],
        )

    missing: List[str] = []
    if not profile.company_name:
        missing.append("company_name")
    if not profile.sector:
        missing.append("sector")
    if not profile.markets:
        missing.append("markets")
    if not profile.strategic_priorities:
        missing.append("strategic_priorities")
    if not profile.risk_tolerance:
        missing.append("risk_tolerance")
    if not profile.recommendation_style:
        missing.append("recommendation_style")

    profile_refs: List[str] = []
    if profile.company_name:
        profile_refs.append("company_name")
    if profile.sector:
        profile_refs.append("sector")
    if profile.markets:
        profile_refs.append("markets")
    if profile.strategic_priorities:
        profile_refs.append("strategic_priorities")
    if profile.risk_tolerance:
        profile_refs.append("risk_tolerance")
    if profile.recommendation_style:
        profile_refs.append("recommendation_style")

    summary = f"""
COMPANY PROFILE
- Company Name: {profile.company_name or "Unknown"}
- Sector: {profile.sector or "Unknown"}
- Markets: {", ".join(profile.markets) if profile.markets else "Unknown"}
- Strategic Priorities: {", ".join(profile.strategic_priorities) if profile.strategic_priorities else "Unknown"}
- Operating Model: {profile.operating_model or "Unknown"}
- Cost Sensitivities: {", ".join(profile.cost_sensitivities) if profile.cost_sensitivities else "Unknown"}
- Growth Objectives: {", ".join(profile.growth_objectives) if profile.growth_objectives else "Unknown"}
- Risk Tolerance: {profile.risk_tolerance or "Unknown"}
- Recommendation Style: {profile.recommendation_style or "Unknown"}
- Notes: {profile.notes or "None"}
""".strip()

    return summary, profile_refs, missing


def build_stage_rules(stage: AgentStage, requested_delivery_mode: str = "hybrid") -> str:
    if stage == "analyse":
        return """
STAGE RULES: ANALYST
- Prioritise drivers
- Prioritise second-order effects
- Highlight uncertainty where relevant
- Explain what is happening and why it matters
- Do NOT jump too quickly into execution detail
""".strip()

    if stage == "advise":
        return """
STAGE RULES: ADVISOR
- Prioritise recommended_actions
- Explain tradeoffs between options
- Focus on decisions management should make next
- Tie recommendations to company priorities
""".strip()

    if stage == "plan":
        planner_mode_rules = {
            "prince2": """
PLANNER MODE: PRINCE2
- Use stage-based delivery
- Include governance, decision gates, controls, ownership, and tolerances
- Emphasise business justification, stage boundaries, and review authority
- Phrase milestones like stage approvals, readiness checks, or go/no-go points
- Include a governance model appropriate for executive oversight
""".strip(),
            "agile": """
PLANNER MODE: AGILE
- Use iteration-led delivery
- Include sprint-like increments, backlog shaping, feedback loops, and reprioritisation
- Emphasise adaptability, learning speed, review cadence, and delivery slices
- Phrase milestones like sprint outcomes, review outcomes, or release increments
- Include a cadence model appropriate for iterative execution
""".strip(),
            "hybrid": """
PLANNER MODE: HYBRID
- Combine governance with iterative execution
- Separate control mechanisms from delivery rhythm
- Include oversight, checkpoints, and delivery increments
- Phrase milestones as both control gates and practical delivery outcomes
- Include both governance model and cadence model
""".strip(),
        }

        return f"""
STAGE RULES: PLANNER
- Produce a PROFESSIONAL EXECUTION PLAN, not light commentary
- Convert advice into a mode-specific delivery structure
- Make the chosen methodology explicit
- Explain why the chosen methodology fits
- Include workstreams, owners, dependencies, risks, success metrics, review checkpoints, and a next-7-days view
- Structure the response so it can be used by an executive team immediately
- Avoid generic planning language that could apply to any project
- Be concrete, sequenced, and boardroom-ready

{planner_mode_rules.get(requested_delivery_mode, planner_mode_rules["hybrid"])}
""".strip()

    if stage == "profile":
        return """
STAGE RULES: PROFILE AGENT
- Prioritise company-specific calibration
- Reweight importance according to company priorities
- Explain where priorities conflict
- State what profile information is still missing
""".strip()

    raise ValueError(f"Unsupported stage: {stage}")


def build_context_block(
    user_input: str,
    stage: AgentStage,
    profile: CompanyProfile | None,
    chain_outputs: ChainOutputs | None,
    conversation_history: List[Dict[str, str]],
) -> Dict[str, object]:
    profile_summary, profile_refs, missing_profile_data = summarise_profile(profile)
    follow_up = detect_follow_up_intent(user_input)
    chain_text = serialise_chain_for_prompt(chain_outputs)
    requested_delivery_mode = detect_requested_delivery_mode(user_input)

    history_block = "\n".join(
        [
            f"{item.get('role', 'unknown').upper()}: {item.get('content', '')}"
            for item in conversation_history[-8:]
        ]
    ) or "No recent conversation history."

    strict_profile_rules = """
STRICT PROFILE RULES
- You MUST use the company profile explicitly
- You MUST reference company priorities where available
- You MUST explain tradeoffs between priorities
- If the profile is weak or incomplete, state exactly what is missing
- You MUST avoid generic macro commentary that is not relevant to the company
""".strip()

    follow_up_rules = """
FOLLOW-UP RULE
- Do not restart the analysis
- Extend the previous output
- Add deeper layers
- Prefer causal chains, second-order effects, timing implications, and decision consequences
- Avoid repeating the same points unless refining them
""".strip() if follow_up else "FOLLOW-UP RULE\n- This is not a follow-up request."

    output_contract = """
OUTPUT CONTRACT
You MUST return valid JSON only.
Use exactly this schema:
{
  "headline": "string",
  "key_insight": "string",
  "drivers": ["string"],
  "second_order_effects": ["string"],
  "implications": ["string"],
  "recommended_actions": ["string"],
  "confidence": 0.0,
  "time_horizon": "short | medium | long",
  "missing_profile_data": ["string"],
  "profile_references": ["string"],
  "based_on_stages": ["string"],
  "urgency": "optional string",
  "reasoning_notes": ["string"],
  "explanation_notes": ["string"],

  "decision_context": "optional string",
  "tradeoffs": ["string"],
  "dependencies": ["string"],
  "milestones": ["string"],
  "success_metrics": ["string"],
  "review_checkpoints": ["string"],

  "delivery_mode": "prince2 | agile | hybrid",
  "methodology_rationale": "string",
  "governance_model": ["string"],
  "cadence_model": ["string"],
  "workstreams": ["string"],
  "risks": ["string"],
  "next_7_days": ["string"],
  "phases": [
    {
      "phase": "string",
      "owner": "string",
      "actions": ["string"]
    }
  ]
}

PLAN QUALITY FLOOR
- delivery_mode must be explicitly stated for PLAN stage
- methodology_rationale must be explicitly stated for PLAN stage
- phases must be mode-specific, not generic
- governance_model must be populated for PRINCE2 and Hybrid
- cadence_model must be populated for Agile and Hybrid
- next_7_days must contain immediate execution actions
- workstreams must be meaningful and not generic
- risks must be explicit and practical
- milestones must read like real checkpoints or outcomes
- success_metrics must be measurable or assessable

GENERAL QUALITY FLOOR
- headline must never be empty
- key_insight must never be empty
- recommended_actions for advise and plan must be concrete
- do not include markdown
- do not include prose outside JSON
""".strip()

    stage_rules = build_stage_rules(stage, requested_delivery_mode)

    prompt = f"""
You are GeoPulse AI.
Your role is to produce structured executive intelligence.

CURRENT STAGE
{stage.upper()}

REQUESTED DELIVERY MODE
{requested_delivery_mode.upper()}

{stage_rules}

{strict_profile_rules}

{follow_up_rules}

{profile_summary}

PREVIOUS STRUCTURED CHAIN OUTPUTS
{chain_text}

RECENT CONVERSATION HISTORY
{history_block}

USER INPUT
{user_input}

GLOBAL RESPONSE RULES
- No filler
- No generic macro commentary unless directly relevant
- Build on prior reasoning
- Tie reasoning to the company profile
- Produce decision-useful output
- Write for an executive dashboard
- Make methodology explicit when planning

{output_contract}
""".strip()

    return {
        "prompt": prompt,
        "follow_up": follow_up,
        "missing_profile_data": missing_profile_data,
        "profile_references": profile_refs,
        "requested_delivery_mode": requested_delivery_mode,
    }