from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from openai import OpenAI
from pydantic import ValidationError

from backend.intel.schemas import MultiPathOutput

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key) if api_key else None

USER_PROMPT_TEMPLATE = """
Execute the GeoPulse Multi-Path Intelligence Chain.

Input signal:
{input_text}

Company context:
{company_context}

Rules:
1. Generate 3 distinct analytical perspectives:
   - A1: Systemic Risk Lens — assume downside risk is underestimated
   - A2: Commercial Opportunity Lens — assume upside is underexploited
   - A3: Operational Reality Lens — assume execution constraints will break strategy

2. Compare the analysts and select one perspective.
3. Generate exactly 2 strategic paths using only the selected analyst.
4. Choose one primary path. Do not remain neutral.
5. Convert the selected path into an execution plan with:
   - Immediate (0-7 days)
   - Short-term (1-4 weeks)
   - Mid-term (1-3 months)

6. Assume reasonable defaults when data is missing.
7. Avoid generic consulting language.
8. Return valid JSON only.
9. Do not include markdown fences.

10. Keep each list concise:
   - exactly 3 drivers maximum
   - exactly 3 second_order_effects maximum
   - exactly 3 risks maximum
   - exactly 3 requirements maximum
   - exactly 2-3 actions per phase maximum

11. Keep text tight:
   - headline max 12 words
   - key_insight max 1 sentence
   - where_it_wins max 1 sentence
   - commercial_impact max 1 sentence
   - strategy_decision.reason max 1 sentence
   - execution_plan.objective max 1 sentence

Return JSON using exactly this structure:
{{
  "analyst_views": [
    {{
      "id": "A1",
      "lens": "string",
      "headline": "string",
      "key_insight": "string",
      "drivers": ["string"],
      "second_order_effects": ["string"],
      "opportunity_signal": "string",
      "risk_signal": "string",
      "confidence": 0.0
    }}
  ],
  "analysis_selection": {{
    "recommended_analyst_id": "A1",
    "reason": "string",
    "tradeoffs": ["string"]
  }},
  "strategic_paths": [
    {{
      "id": "S1",
      "name": "string",
      "approach": "string",
      "where_it_wins": "string",
      "risks": ["string"],
      "requirements": ["string"],
      "time_horizon": "short",
      "confidence": 0.0,
      "commercial_impact": "string"
    }}
  ],
  "strategy_decision": {{
    "selected_path_id": "S1",
    "reason": "string",
    "why_not_others": ["string"],
    "scoring_summary": {{}}
  }},
  "execution_plan": {{
    "objective": "string",
    "phases": [
      {{
        "phase": "Immediate (0-7 days)",
        "actions": ["string"],
        "owner": "string"
      }}
    ]
  }},
  "interaction_hooks": {{
    "primary_recommendation": "S1",
    "alternatives_available": true,
    "feedback_required": true
  }}
}}
""".strip()


def run_llm(prompt: str, model: str = "gpt-4.1") -> str:
    if not api_key or client is None:
        return "OPENAI_API_KEY is not set. LLM response could not be generated."

    try:
        response = client.chat.completions.create(
            model=model,
            temperature=0.3,
            max_tokens=4000,
            messages=[
                {
                    "role": "system",
                    "content": "You are GeoPulse AI, an executive-grade intelligence system producing grounded, commercially useful outputs.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
        )

        content = response.choices[0].message.content
        return content.strip() if content else ""

    except Exception as exc:
        return f"LLM generation failed: {str(exc)}"


FALLBACK_OUTPUT: Dict[str, Any] = {
    "analyst_views": [
        {
            "id": "A1",
            "lens": "Systemic Risk Lens",
            "headline": "Risk picture needs tighter monitoring",
            "key_insight": "External pressure may be stronger than initial signals suggest.",
            "drivers": [
                "Signal intensity may be underweighted",
                "Downside exposure could widen quickly",
                "Management attention may need tightening",
            ],
            "second_order_effects": [
                "Cost pressure could rise",
                "Decision windows may shorten",
                "Stakeholder sensitivity may increase",
            ],
            "opportunity_signal": "Pressure can create demand for resilience-led offers.",
            "risk_signal": "Slow response may increase downside exposure.",
            "confidence": 0.62,
        },
        {
            "id": "A2",
            "lens": "Commercial Opportunity Lens",
            "headline": "Commercial upside may be underused",
            "key_insight": "The signal may open near-term demand for practical support offers.",
            "drivers": [
                "Client uncertainty can unlock advisory demand",
                "Speed-to-offer can create differentiation",
                "Simple packaging can improve conversion",
            ],
            "second_order_effects": [
                "Early pilots can create proof points",
                "Fast wins can support pricing power",
                "Demand may cluster in pressured segments",
            ],
            "opportunity_signal": "A focused offer can convert uncertainty into revenue.",
            "risk_signal": "Generic positioning may weaken monetisation.",
            "confidence": 0.68,
        },
        {
            "id": "A3",
            "lens": "Operational Reality Lens",
            "headline": "Execution readiness will shape outcomes",
            "key_insight": "Commercial logic will fail if delivery readiness is weak.",
            "drivers": [
                "Capability gaps can delay action",
                "Delivery design may be incomplete",
                "Ownership may be unclear",
            ],
            "second_order_effects": [
                "Execution slippage can damage trust",
                "Internal friction can slow pilots",
                "Poor sequencing can waste demand",
            ],
            "opportunity_signal": "Tighter operational design can make the offer repeatable.",
            "risk_signal": "Overcommitting too early can damage credibility.",
            "confidence": 0.64,
        },
    ],
    "analysis_selection": {
        "recommended_analyst_id": "A2",
        "reason": "This lens best balances commercial relevance and near-term action.",
        "tradeoffs": [
            "A1 is stronger for downside framing.",
            "A3 is stronger for delivery discipline.",
        ],
    },
    "strategic_paths": [
        {
            "id": "S1",
            "name": "Rapid Pilot Launch",
            "approach": "Launch a narrow offer quickly with a small target set to validate demand.",
            "where_it_wins": "Best when speed of learning matters more than perfect design.",
            "risks": [
                "Weak segment choice can reduce traction",
                "Offer may be too narrow",
                "Early delivery gaps may show",
            ],
            "requirements": [
                "Clear pilot offer",
                "Named executive owner",
                "Basic delivery readiness",
            ],
            "time_horizon": "short",
            "confidence": 0.69,
            "commercial_impact": "Fast validation can create early revenue and proof points.",
        },
        {
            "id": "S2",
            "name": "Capability-First Positioning",
            "approach": "Tighten offer design and delivery readiness before a broader market push.",
            "where_it_wins": "Best when execution risk is high and credibility matters most.",
            "risks": [
                "Slower market entry",
                "Momentum may fade",
                "Competitors may move first",
            ],
            "requirements": [
                "Service architecture",
                "Delivery ownership",
                "Commercial messaging",
            ],
            "time_horizon": "medium",
            "confidence": 0.64,
            "commercial_impact": "Better delivery quality can support stronger long-term conversion.",
        },
    ],
    "strategy_decision": {
        "selected_path_id": "S1",
        "reason": "Rapid Pilot Launch is the strongest first move because it creates real market learning with limited downside.",
        "why_not_others": [
            "S2 improves readiness but slows proof.",
        ],
        "scoring_summary": {
            "speed": 8,
            "commercial_upside": 8,
            "execution_risk": 6,
            "overall": 7.3,
        },
    },
    "execution_plan": {
        "objective": "Validate demand quickly while keeping execution disciplined and commercially credible.",
        "phases": [
            {
                "phase": "Immediate (0-7 days)",
                "actions": [
                    "Name the executive owner and define the pilot offer.",
                    "Select the first target clients and value proposition.",
                ],
                "owner": "Executive / Strategy Lead",
            },
            {
                "phase": "Short-term (1-4 weeks)",
                "actions": [
                    "Run targeted outreach and gather objections.",
                    "Refine offer packaging using early client feedback.",
                ],
                "owner": "Commercial / Client Team",
            },
            {
                "phase": "Mid-term (1-3 months)",
                "actions": [
                    "Turn pilot learning into a repeatable motion.",
                    "Decide whether to scale, narrow, or reposition.",
                ],
                "owner": "Leadership / Delivery Team",
            },
        ],
    },
    "interaction_hooks": {
        "primary_recommendation": "S1",
        "alternatives_available": True,
        "feedback_required": True,
    },
}


def _safe_json_dumps(value: Any) -> str:
    try:
        return json.dumps(value, ensure_ascii=False, indent=2, default=str)
    except Exception:
        return "{}"


def _coerce_text_list(value: Any, max_items: int) -> List[str]:
    if value is None:
        return []

    if isinstance(value, str):
        value = [value]

    if not isinstance(value, list):
        value = [str(value)]

    cleaned: List[str] = []
    for item in value:
        if item is None:
            continue
        text = str(item).strip()
        if text:
            cleaned.append(text)
        if len(cleaned) >= max_items:
            break
    return cleaned


def _coerce_confidence(value: Any, default: float = 0.65) -> float:
    try:
        val = float(value)
        return max(0.0, min(1.0, val))
    except Exception:
        return default


def _first_sentence(value: Any, fallback: str) -> str:
    text = str(value).strip() if value is not None else ""
    if not text:
        return fallback
    parts = re.split(r"(?<=[.!?])\s+", text)
    return parts[0].strip() if parts else text


def _extract_json_object(raw_text: str) -> Optional[str]:
    if not raw_text:
        return None

    text = raw_text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)

    start = text.find("{")
    if start == -1:
        return None

    depth = 0
    in_string = False
    escape = False

    for i in range(start, len(text)):
        ch = text[i]

        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
            continue

        if ch == '"':
            in_string = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]

    return None


def _parse_json(raw_text: str) -> Optional[Dict[str, Any]]:
    json_block = _extract_json_object(raw_text)
    if not json_block:
        return None

    try:
        parsed = json.loads(json_block)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        return None


def _build_prompt(input_text: str, company_context: Dict[str, Any]) -> str:
    return USER_PROMPT_TEMPLATE.format(
        input_text=input_text.strip(),
        company_context=_safe_json_dumps(company_context or {}),
    )


def _build_repair_prompt(original_prompt: str, bad_response: str) -> str:
    return f"""
The previous response was invalid, malformed, or truncated.

Return corrected JSON only.
Do not include markdown.
Do not include commentary.

Original task:
{original_prompt}

Broken response:
{bad_response}
""".strip()


def _normalise_output(payload: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    payload = payload or {}
    fallback = FALLBACK_OUTPUT

    raw_analyst_views = payload.get("analyst_views")
    if not isinstance(raw_analyst_views, list):
        raw_analyst_views = []

    analyst_views: List[Dict[str, Any]] = []
    for idx in range(3):
        fb = fallback["analyst_views"][idx]
        src = raw_analyst_views[idx] if idx < len(raw_analyst_views) and isinstance(raw_analyst_views[idx], dict) else {}

        analyst_views.append(
            {
                "id": fb["id"],
                "lens": str(src.get("lens") or fb["lens"]).strip(),
                "headline": str(src.get("headline") or fb["headline"]).strip(),
                "key_insight": _first_sentence(src.get("key_insight"), fb["key_insight"]),
                "drivers": _coerce_text_list(src.get("drivers"), 3) or fb["drivers"],
                "second_order_effects": _coerce_text_list(src.get("second_order_effects"), 3) or fb["second_order_effects"],
                "opportunity_signal": str(src.get("opportunity_signal") or fb["opportunity_signal"]).strip(),
                "risk_signal": str(src.get("risk_signal") or fb["risk_signal"]).strip(),
                "confidence": _coerce_confidence(src.get("confidence"), fb["confidence"]),
            }
        )

    raw_selection = payload.get("analysis_selection")
    if not isinstance(raw_selection, dict):
        raw_selection = {}

    recommended_analyst_id = str(raw_selection.get("recommended_analyst_id") or "A2").strip()
    if recommended_analyst_id not in {"A1", "A2", "A3"}:
        recommended_analyst_id = "A2"

    analysis_selection = {
        "recommended_analyst_id": recommended_analyst_id,
        "reason": _first_sentence(raw_selection.get("reason"), fallback["analysis_selection"]["reason"]),
        "tradeoffs": _coerce_text_list(raw_selection.get("tradeoffs"), 3) or fallback["analysis_selection"]["tradeoffs"],
    }

    raw_paths = payload.get("strategic_paths")
    if not isinstance(raw_paths, list):
        raw_paths = []

    strategic_paths: List[Dict[str, Any]] = []
    for idx in range(2):
        fb = fallback["strategic_paths"][idx]
        src = raw_paths[idx] if idx < len(raw_paths) and isinstance(raw_paths[idx], dict) else {}

        strategic_paths.append(
            {
                "id": str(src.get("id") or fb["id"]).strip(),
                "name": str(src.get("name") or fb["name"]).strip(),
                "approach": str(src.get("approach") or fb["approach"]).strip(),
                "where_it_wins": _first_sentence(src.get("where_it_wins"), fb["where_it_wins"]),
                "risks": _coerce_text_list(src.get("risks"), 3) or fb["risks"],
                "requirements": _coerce_text_list(src.get("requirements"), 3) or fb["requirements"],
                "time_horizon": str(src.get("time_horizon") or fb["time_horizon"]).strip() or fb["time_horizon"],
                "confidence": _coerce_confidence(src.get("confidence"), fb["confidence"]),
                "commercial_impact": _first_sentence(src.get("commercial_impact"), fb["commercial_impact"]),
            }
        )

    raw_decision = payload.get("strategy_decision")
    if not isinstance(raw_decision, dict):
        raw_decision = {}

    valid_path_ids = {p["id"] for p in strategic_paths}
    selected_path_id = str(raw_decision.get("selected_path_id") or strategic_paths[0]["id"]).strip()
    if selected_path_id not in valid_path_ids:
        selected_path_id = strategic_paths[0]["id"]

    scoring_summary = raw_decision.get("scoring_summary")
    if not isinstance(scoring_summary, dict):
        scoring_summary = fallback["strategy_decision"]["scoring_summary"]

    strategy_decision = {
        "selected_path_id": selected_path_id,
        "reason": _first_sentence(raw_decision.get("reason"), fallback["strategy_decision"]["reason"]),
        "why_not_others": _coerce_text_list(raw_decision.get("why_not_others"), 3) or fallback["strategy_decision"]["why_not_others"],
        "scoring_summary": scoring_summary,
    }

    raw_execution = payload.get("execution_plan")
    if not isinstance(raw_execution, dict):
        raw_execution = {}

    raw_phases = raw_execution.get("phases")
    if not isinstance(raw_phases, list):
        raw_phases = []

    phase_names = [
        "Immediate (0-7 days)",
        "Short-term (1-4 weeks)",
        "Mid-term (1-3 months)",
    ]

    execution_phases: List[Dict[str, Any]] = []
    for idx in range(3):
        fb = fallback["execution_plan"]["phases"][idx]
        src = raw_phases[idx] if idx < len(raw_phases) and isinstance(raw_phases[idx], dict) else {}

        execution_phases.append(
            {
                "phase": phase_names[idx],
                "actions": _coerce_text_list(src.get("actions"), 3) or fb["actions"],
                "owner": str(src.get("owner") or fb["owner"]).strip(),
            }
        )

    execution_plan = {
        "objective": _first_sentence(raw_execution.get("objective"), fallback["execution_plan"]["objective"]),
        "phases": execution_phases,
    }

    raw_hooks = payload.get("interaction_hooks")
    if not isinstance(raw_hooks, dict):
        raw_hooks = {}

    interaction_hooks = {
        "primary_recommendation": str(raw_hooks.get("primary_recommendation") or selected_path_id).strip() or selected_path_id,
        "alternatives_available": bool(raw_hooks.get("alternatives_available", True)),
        "feedback_required": bool(raw_hooks.get("feedback_required", True)),
    }

    return {
        "analyst_views": analyst_views,
        "analysis_selection": analysis_selection,
        "strategic_paths": strategic_paths,
        "strategy_decision": strategy_decision,
        "execution_plan": execution_plan,
        "interaction_hooks": interaction_hooks,
    }


async def run_multi_path_chain(
    input_text: str,
    company_context: Optional[Dict[str, Any]] = None,
    model: str = "gpt-4.1",
    max_attempts: int = 3,
) -> MultiPathOutput:
    company_context = company_context or {}
    original_prompt = _build_prompt(input_text=input_text, company_context=company_context)
    current_prompt = original_prompt

    for attempt in range(max_attempts):
        raw_response = run_llm(prompt=current_prompt, model=model)
        parsed = _parse_json(raw_response or "")

        if parsed is not None:
            try:
                return MultiPathOutput.model_validate(_normalise_output(parsed))
            except ValidationError:
                pass

        if attempt < max_attempts - 1:
            current_prompt = _build_repair_prompt(original_prompt, raw_response or "")

    return MultiPathOutput.model_validate(_normalise_output(FALLBACK_OUTPUT))