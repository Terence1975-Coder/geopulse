from __future__ import annotations

from typing import Any, Dict, List, Tuple

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


def summarise_profile(
    profile: CompanyProfile | None,
) -> Tuple[str, List[str], List[str]]:
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


def summarise_supporting_signals(
    supporting_signals: List[Dict[str, Any]],
) -> str:
    if not supporting_signals:
        return "No supporting signals were retrieved."

    lines: List[str] = []
    for index, signal in enumerate(supporting_signals[:6], start=1):
        headline = signal.get("headline") or "Unknown headline"
        summary = signal.get("summary") or "No summary provided."
        source = signal.get("source") or "Unknown source"
        region = signal.get("region") or "Unknown region"
        cluster_tag = signal.get("cluster_tag") or "Unclassified"
        kind = signal.get("kind") or "unknown"
        severity = signal.get("severity") or "unknown"
        lifecycle = signal.get("lifecycle") or "unknown"
        relative_time = signal.get("relative_time") or "unknown"
        confidence = signal.get("confidence_score", "unknown")
        strength = signal.get("signal_strength", "unknown")

        lines.append(
            (
                f"{index}. "
                f"Headline: {headline}\n"
                f"   Summary: {summary}\n"
                f"   Source: {source} | Region: {region} | Cluster: {cluster_tag}\n"
                f"   Kind: {kind} | Severity: {severity} | Lifecycle: {lifecycle}\n"
                f"   Relative Time: {relative_time} | Confidence: {confidence} | Strength: {strength}"
            )
        )

    return "\n".join(lines)


def build_stage_rules(stage: AgentStage) -> str:
    if stage == "analyse":
        return """
STAGE RULES: ANALYST
- Prioritise drivers
- Prioritise second-order effects
- Explain what is happening, why it matters, and what may happen next
- You MUST use the supporting signals as evidence
- You MUST synthesise across multiple signals where possible
- Do NOT jump too quickly into execution detail
- Do NOT return empty lists unless the evidence is genuinely absent
- If evidence is mixed, say so clearly
""".strip()

    if stage == "advise":
        return """
STAGE RULES: ADVISOR
- Prioritise recommended_actions
- Explain tradeoffs between options
- Focus on decisions management should make next
- Tie recommendations to company priorities
- Ground recommendations in the analyse stage and supporting signals
- Avoid generic advice that could apply to any company
- Include decision_context and tradeoffs where useful
""".strip()

    if stage == "plan":
        return """
STAGE RULES: PLANNER
- You are producing a PROFESSIONAL DELIVERY PLAN, not light operational commentary
- Convert strategy into an execution-grade delivery structure
- Recommend the best-fit methodology: PRINCE2, Agile, or Hybrid
- Explicitly explain WHY the chosen methodology fits the situation
- Include governance, control, sequencing, owners, measurable success, and review cadence
- If PRINCE2 is appropriate, use stage-based delivery, governance, tolerances, risks, and review gates
- If Agile is appropriate, use iterative delivery, sprint logic, backlog-style actions, feedback loops, and adaptation points
- If Hybrid is appropriate, combine governance with iterative execution and explain the split
- Prioritise dependencies, milestones, success metrics, and execution risks
- Produce plan content that could be used in a professional steering-group or board discussion
- Avoid generic planning language that could apply to any project
- Include an immediate first-step view for the next 7 days
- Make owners plausible and specific by function even if exact names are unknown
""".strip()

    if stage == "profile":
        return """
STAGE RULES: PROFILE AGENT
- Prioritise company-specific calibration
- Reweight importance according to company priorities
- Explain where priorities conflict
- State what profile information is still missing
- Identify which missing profile details would most improve future analysis quality
""".strip()

    raise ValueError(f"Unsupported stage: {stage}")


def build_context_block(
    user_input: str,
    stage: AgentStage,
    profile: CompanyProfile | None,
    chain_outputs: ChainOutputs | None,
    conversation_history: List[Dict[str, str]],
    supporting_signals: List[Dict[str, Any]] | None = None,
) -> Dict[str, object]:
    profile_summary, profile_refs, missing_profile_data = summarise_profile(profile)
    follow_up = detect_follow_up_intent(user_input)
    chain_text = serialise_chain_for_prompt(chain_outputs)
    supporting_signals = supporting_signals or []
    signals_block = summarise_supporting_signals(supporting_signals)

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

    signal_rules = """
SIGNAL USE RULES
- You MUST use the supporting signals as core evidence, not as decoration
- Prefer synthesis across signals over repeating each signal
- Use source freshness, confidence, and lifecycle when judging certainty
- If there are too few signals, say that evidence depth is limited
- Do not invent evidence that is not present in the signal set
""".strip()

    follow_up_rules = (
        """
FOLLOW-UP RULE
- Do not restart the analysis
- Extend the previous output
- Add deeper layers
- Prefer causal chains, second-order effects, timing implications, and decision consequences
- Avoid repeating the same points unless refining them
""".strip()
        if follow_up
        else "FOLLOW-UP RULE\n- This is not a follow-up request."
    )

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
  "urgency": "optional string",
  "missing_profile_data": ["string"],
  "profile_references": ["string"],
  "based_on_stages": ["string"],
  "based_on_signals": ["string"],
  "reasoning_notes": ["string"],
  "explanation_notes": ["string"],

  "decision_context": "optional string",
  "tradeoffs": ["optional string"],
  "dependencies": ["optional string"],
  "milestones": ["optional string"],
  "success_metrics": ["optional string"],
  "review_checkpoints": ["optional string"],

  "delivery_mode": "optional string",
  "recommended_methodology": "optional string",
  "methodology_rationale": "optional string",
  "governance_model": "optional string",
  "cadence_model": "optional string",
  "workstreams": ["optional string"],
  "risks": ["optional string"],
  "next_7_days": ["optional string"],
  "plan_display_mode": "optional string"
}

PLANNER-SPECIFIC QUALITY FLOOR
- For PLAN stage, headline must read like a professional delivery objective
- For PLAN stage, recommended_actions must contain concrete actions, not vague advice
- For PLAN stage, dependencies must be meaningful and operational
- For PLAN stage, milestones must feel like real stage gates or sprint outcomes
- For PLAN stage, success_metrics must be measurable
- For PLAN stage, review_checkpoints must describe governance or iteration review moments
- For PLAN stage, reasoning_notes should explain methodology fit, delivery logic, or sequencing rationale
- For PLAN stage, explanation_notes should state any delivery assumptions or evidence limits
- For PLAN stage, delivery_mode must be one of: prince2, agile, hybrid

GENERAL QUALITY FLOOR
- headline must never be empty
- key_insight must never be empty
- return at least 2 items in drivers when evidence allows
- return at least 2 items in implications when evidence allows
- return at least 2 items in recommended_actions for advise and plan when evidence allows
- do not use placeholders like "Not available", "None noted", or "Unknown" unless absolutely unavoidable
- if evidence is limited, say so in explanation_notes rather than leaving core fields blank

Do not include markdown.
Do not include prose outside JSON.
""".strip()

    stage_rules = build_stage_rules(stage)

    prompt = f"""
You are GeoPulse AI.
Your role is to produce structured executive intelligence for an executive dashboard.

CURRENT STAGE
{stage.upper()}

{stage_rules}

{strict_profile_rules}

{signal_rules}

{follow_up_rules}

{profile_summary}

SUPPORTING SIGNAL EVIDENCE
{signals_block}

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
- Use the supporting signals as evidence
- Produce decision-useful output
- Write for an executive dashboard
- Prefer concise, specific statements over broad abstractions
- For planning outputs, optimise for professional execution quality

{output_contract}
""".strip()

    return {
        "prompt": prompt,
        "follow_up": follow_up,
        "missing_profile_data": missing_profile_data,
        "profile_references": profile_refs,
        "supporting_signals_used": [signal.get("id", "") for signal in supporting_signals],
        "supporting_signal_count": len(supporting_signals),
    }