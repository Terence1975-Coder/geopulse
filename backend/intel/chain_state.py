from __future__ import annotations

from typing import Any

from backend.intel.schemas import ChainOutputs


def _read_field(value: Any, field: str, default: Any = None) -> Any:
    if value is None:
        return default

    if isinstance(value, dict):
        return value.get(field, default)

    return getattr(value, field, default)


def _as_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, str) and item.strip()]


def update_chain_outputs(
    chain_outputs: ChainOutputs | None,
    stage: str,
    output: Any,
) -> ChainOutputs:
    current = chain_outputs or ChainOutputs()

    if stage == "analyse":
        current.analyse = output
    elif stage == "advise":
        current.advise = output
    elif stage == "plan":
        current.plan = output
    elif stage == "profile":
        current.profile = output

    return current


def serialise_chain_for_prompt(chain_outputs: ChainOutputs | None) -> str:
    if not chain_outputs:
        return "No previous chain outputs."

    sections: list[str] = []

    for stage in ["analyse", "advise", "plan", "profile"]:
        output = getattr(chain_outputs, stage, None)

        if not output:
            continue

        headline = _read_field(output, "headline", "None")
        key_insight = _read_field(output, "key_insight", "None")
        drivers = _as_list(_read_field(output, "drivers", []))
        second_order_effects = _as_list(
            _read_field(output, "second_order_effects", [])
        )
        implications = _as_list(_read_field(output, "implications", []))
        recommended_actions = _as_list(
            _read_field(output, "recommended_actions", [])
        )
        based_on_stages = _as_list(_read_field(output, "based_on_stages", []))

        block = f"""
STAGE: {stage.upper()}
Headline: {headline}
Key Insight: {key_insight}
Drivers: {", ".join(drivers) if drivers else "None"}
Second Order Effects: {", ".join(second_order_effects) if second_order_effects else "None"}
Implications: {", ".join(implications) if implications else "None"}
Recommended Actions: {", ".join(recommended_actions) if recommended_actions else "None"}
Based On Stages: {", ".join(based_on_stages) if based_on_stages else "None"}
""".strip()

        sections.append(block)

    return "\n\n".join(sections) if sections else "No previous chain outputs."