import json
from typing import Dict, List
from sqlalchemy.orm import Session

from backend.models import AgentChainRun
from backend.services.anonymizer import anonymize_text
from backend.services.llm_service import run_llm
from backend.services.memory_service import get_company_memory
from backend.services.retrieval_service import retrieve_evidence


STAGE_ORDER = ["analyse", "advise", "plan", "profile"]


def build_context_block(memory, evidence: List[Dict]) -> str:
    memory_lines = []
    if memory:
        memory_lines.append(f"Company name: {memory.company_name}")
        if memory.market_focus:
            memory_lines.append(f"Market focus: {memory.market_focus}")
        if memory.strategic_priorities:
            memory_lines.append(f"Strategic priorities: {memory.strategic_priorities}")
        if memory.recommendation_posture:
            memory_lines.append(
                f"Recommendation posture: {memory.recommendation_posture}"
            )

    evidence_lines = []
    for item in evidence:
        evidence_lines.append(
            f"- {item['title']} ({item['source_type']}, trust {item['trust_score']}): {item['excerpt']}"
        )

    return (
        "COMPANY MEMORY\n"
        + ("\n".join(memory_lines) if memory_lines else "None")
        + "\n\nEVIDENCE\n"
        + ("\n".join(evidence_lines) if evidence_lines else "None")
    )


def build_prompt(stage: str, anonymized_input: str, context_block: str) -> str:
    role_map = {
        "analyse": "You are the GeoPulse Analyst Agent. Produce a structured market/risk/opportunity analysis.",
        "advise": "You are the GeoPulse Advisor Agent. Produce clear executive advice based on the analysis and evidence.",
        "plan": "You are the GeoPulse Planning Agent. Produce a concise action plan with priorities and sequencing.",
        "profile": "You are the GeoPulse Company Profile Agent. Extract and refine company intelligence that improves future recommendations.",
    }

    return f"""
{role_map[stage]}

Use the following input:
{anonymized_input}

Use the following context:
{context_block}

Rules:
- Be grounded in the evidence supplied
- Be concise but executive-grade
- Do not invent sources
- Make the output commercially useful
"""


def execute_chain(
    db: Session,
    input_text: str,
    requested_stage: str,
    company_name: str | None = None,
    previous_chain_state: Dict | None = None,
):
    privacy = anonymize_text(input_text)
    anonymized_input = privacy["anonymized_input"]

    evidence = retrieve_evidence(db, anonymized_input, limit=5)
    memory = get_company_memory(db, company_name)
    context_block = build_context_block(memory, evidence)

    requested_index = STAGE_ORDER.index(requested_stage)
    required_stages = STAGE_ORDER[: requested_index + 1]

    outputs = {
        "analyse": None,
        "advise": None,
        "plan": None,
        "profile": None,
    }

    auto_ran = []
    for stage in required_stages:
        prompt = build_prompt(stage, anonymized_input, context_block)
        outputs[stage] = run_llm(prompt)
        if stage != requested_stage:
            auto_ran.append(stage)

    explanation = {
        "model": "gpt-4.1-mini",
        "route": requested_stage,
        "reasoning_summary": f"GeoPulse executed the chain through {requested_stage} using anonymized input, evidence retrieval, and company memory.",
        "evidence_used": [item["title"] for item in evidence],
        "memory_used": [memory.company_name] if memory else [],
    }

    run = AgentChainRun(
        company_name=company_name,
        input_text=input_text,
        anonymized_input=anonymized_input,
        requested_stage=requested_stage,
        completed_steps=json.dumps(required_stages),
        output_analyse=outputs["analyse"],
        output_advise=outputs["advise"],
        output_plan=outputs["plan"],
        output_profile=outputs["profile"],
        evidence_json=json.dumps(evidence),
        explanation_json=json.dumps(explanation),
        privacy_json=json.dumps(privacy),
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    return {
        "input": input_text,
        "anonymized_input": anonymized_input,
        "privacy": privacy,
        "chain_state": {"completed_steps": required_stages},
        "outputs": outputs,
        "auto_ran": auto_ran,
        "evidence": [
            {
                "title": item["title"],
                "source_type": item["source_type"],
                "trust_score": item["trust_score"],
                "excerpt": item["excerpt"],
            }
            for item in evidence
        ],
        "explanation": explanation,
    }