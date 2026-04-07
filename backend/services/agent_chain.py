from typing import Any, Dict

from services.llm_client import call_llm_json


ANALYST_SYSTEM_PROMPT = """
You are GeoPulse Analyst Agent.

Your job is diagnosis and causality.

Focus on:
- what is happening
- why it matters
- what is driving it
- second-order effects

Rules:
- be concise
- be structured
- do not return paragraphs
- return valid JSON only
""".strip()


ADVISOR_SYSTEM_PROMPT = """
You are GeoPulse Advisor Agent.

Your job is strategic decision support.

Use the Analyst output to create decision-grade recommendations.

Focus on:
- strategic recommendations
- risk mitigation actions
- opportunity positioning

Rules:
- be concise
- be structured
- do not return paragraphs
- return valid JSON only
""".strip()


PLANNER_SYSTEM_PROMPT = """
You are GeoPulse Planner Agent.

Your job is execution planning.

Use the Advisor output to create a practical action plan.

Focus on:
- step-by-step execution
- prioritised actions
- sequencing
- timeline clarity

Rules:
- be concise
- be structured
- do not return paragraphs
- return valid JSON only
""".strip()


def run_analyst(input_text: str) -> Dict[str, Any]:
    user_prompt = f"""
Analyse the following business, geopolitical, market, or scenario input.

INPUT:
{input_text}

Return this exact JSON shape:

{{
  "key_insight": "string",
  "drivers": ["string", "string", "string"],
  "second_order_effects": ["string", "string", "string"]
}}
""".strip()

    result = call_llm_json(
        system_prompt=ANALYST_SYSTEM_PROMPT,
        user_prompt=user_prompt,
    )

    return {
        "key_insight": result.get("key_insight", ""),
        "drivers": result.get("drivers", []),
        "second_order_effects": result.get("second_order_effects", []),
    }


def run_advisor(analysis: Dict[str, Any]) -> Dict[str, Any]:
    user_prompt = f"""
Use the Analyst output below to produce strategic recommendations.

ANALYST OUTPUT:
{analysis}

Return this exact JSON shape:

{{
  "recommendations": ["string", "string", "string"],
  "risk_actions": ["string", "string", "string"],
  "opportunity_actions": ["string", "string", "string"]
}}
""".strip()

    result = call_llm_json(
        system_prompt=ADVISOR_SYSTEM_PROMPT,
        user_prompt=user_prompt,
    )

    return {
        "recommendations": result.get("recommendations", []),
        "risk_actions": result.get("risk_actions", []),
        "opportunity_actions": result.get("opportunity_actions", []),
    }


def run_planner(advice: Dict[str, Any]) -> Dict[str, Any]:
    user_prompt = f"""
Use the Advisor output below to produce an actionable execution plan.

ADVISOR OUTPUT:
{advice}

Return this exact JSON shape:

{{
  "steps": ["string", "string", "string"],
  "priorities": ["string", "string", "string"],
  "timeline": ["string", "string", "string"]
}}
""".strip()

    result = call_llm_json(
        system_prompt=PLANNER_SYSTEM_PROMPT,
        user_prompt=user_prompt,
    )

    return {
        "steps": result.get("steps", []),
        "priorities": result.get("priorities", []),
        "timeline": result.get("timeline", []),
    }


def run_full_chain(input_text: str) -> Dict[str, Any]:
    analysis = run_analyst(input_text)
    advice = run_advisor(analysis)
    plan = run_planner(advice)

    return {
        "analysis": analysis,
        "advice": advice,
        "plan": plan,
    }