from __future__ import annotations

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


def build_stage_rules(stage: AgentStage) -> str:
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
        return """
STAGE RULES: PLANNER
- Prioritise sequencing
- Convert advice into practical execution
- Clarify likely ownership and execution order
- Focus on operationalisation, not broad commentary
- Return boardroom-grade execution guidance
- Be highly specific about what should happen first
- Prefer short, scannable action statements over abstract prose
- Where possible, include:
  - immediate_actions
  - dependencies
  - risks
  - success_metrics
  - review_checkpoints
  - execution_phases
- Immediate actions should be concrete actions leadership can trigger now
- Dependencies should describe what must be true before execution succeeds
- Risks should describe execution, commercial, delivery, or timing risks
- Success metrics should describe measurable proof that the plan is working
- Review checkpoints should identify decision gates or moments to reassess
- execution_phases should be an ordered list with phase, owner, and actions
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


def build_output_contract(stage: AgentStage) -> str:
    if stage == "plan":
        return """
OUTPUT CONTRACT
You MUST return valid JSON only.
Use exactly this schema:
{
  "headline": "string",
  "key_insight": "string",
  "objective": "string",
  "drivers": ["string"],
  "second_order_effects": ["string"],
  "implications": ["string"],
  "recommended_actions": ["string"],
  "immediate_actions": ["string"],
  "dependencies": ["string"],
  "risks": ["string"],
  "success_metrics": ["string"],
  "review_checkpoints": ["string"],
  "execution_phases": [
    {
      "phase": "string",
      "owner": "string",
      "actions": ["string"]
    }
  ],
  "confidence": 0.0,
  "time_horizon": "short | medium | long",
  "urgency": "optional string",
  "missing_profile_data": ["string"],
  "profile_references": ["string"],
  "based_on_stages": ["string"],
  "reasoning_notes": ["string"],
  "explanation_notes": ["string"]
}
Planner requirements:
- objective must state the execution goal clearly
- immediate_actions should contain the first actions to trigger now
- execution_phases should be ordered from earliest to latest
- Each phase should contain concise, practical actions
- Do not include markdown
- Do not include prose outside JSON
""".strip()

    return """
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
  "explanation_notes": ["string"]
}
Do not include markdown.
Do not include prose outside JSON.
""".strip()


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

    output_contract = build_output_contract(stage)
    stage_rules = build_stage_rules(stage)

    prompt = f"""
You are GeoPulse AI.
Your role is to produce structured executive intelligence.

CURRENT STAGE
{stage.upper()}

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
- Be concise, structured, and scannable
- Prefer specific action language over general commentary

{output_contract}
""".strip()

    return {
        "prompt": prompt,
        "follow_up": follow_up,
        "missing_profile_data": missing_profile_data,
        "profile_references": profile_refs,
    }