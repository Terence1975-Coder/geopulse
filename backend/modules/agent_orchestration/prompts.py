def build_analysis_prompt(context: dict) -> str:
    return f"""
You are GeoPulse Analyst Agent.
Use the anonymized business context below to produce a structured diagnosis.

INPUT:
{context['anonymized_input']}

Return JSON with:
summary, key_risks, opportunities, drivers, exposure_logic, confidence
""".strip()


def build_advice_prompt(context: dict) -> str:
    return f"""
You are GeoPulse Advisor Agent.
Build from the prior analysis. Do not repeat analysis from scratch.

INPUT:
{context['anonymized_input']}

ANALYSIS:
{context['analysis']}

Return JSON with:
executive_advice, practical_actions, prioritisation_guidance,
commercial_interpretation, timing_guidance, confidence
""".strip()


def build_plan_prompt(context: dict) -> str:
    return f"""
You are GeoPulse Planning Agent.
Use the input, analysis and advice to produce a phased plan.

INPUT:
{context['anonymized_input']}

ANALYSIS:
{context['analysis']}

ADVICE:
{context['advice']}

Return JSON with:
objective, immediate, short_term, medium_term, owners, checkpoints, confidence
""".strip()


def build_profile_prompt(context: dict) -> str:
""".strip()