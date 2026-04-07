from typing import Dict, List, Optional
from datetime import datetime


SESSION_STORE: Dict[str, Dict] = {}
COMPANY_STORE: Dict[str, Dict] = {}


def get_or_create_session(session_id: str) -> Dict:
    if session_id not in SESSION_STORE:
        SESSION_STORE[session_id] = {
            "messages": [],
            "chain_outputs": {
                "analyse": [],
                "advise": [],
                "plan": [],
                "profile": [],
            },
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
    return SESSION_STORE[session_id]


def append_message(session_id: str, role: str, stage: str, content: str) -> None:
    session = get_or_create_session(session_id)
    session["messages"].append(
        {
            "role": role,
            "stage": stage,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
        }
    )
    session["updated_at"] = datetime.utcnow().isoformat()


def append_chain_output(session_id: str, stage: str, content: str) -> None:
    session = get_or_create_session(session_id)
    if stage not in session["chain_outputs"]:
        session["chain_outputs"][stage] = []
    session["chain_outputs"][stage].append(
        {
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
        }
    )
    session["updated_at"] = datetime.utcnow().isoformat()


def get_conversation_history(session_id: Optional[str], limit: int = 10) -> str:
    if not session_id or session_id not in SESSION_STORE:
        return ""
    messages = SESSION_STORE[session_id]["messages"][-limit:]
    if not messages:
        return ""
    lines = []
    for m in messages:
        lines.append(f"{m['role'].upper()} [{m['stage']}]: {m['content']}")
    return "\n".join(lines)


def get_chain_state(session_id: Optional[str]) -> str:
    if not session_id or session_id not in SESSION_STORE:
        return ""

    outputs = SESSION_STORE[session_id]["chain_outputs"]
    blocks = []

    for stage in ["analyse", "advise", "plan", "profile"]:
        stage_outputs = outputs.get(stage, [])
        if stage_outputs:
            latest = stage_outputs[-1]["content"]
            blocks.append(f"{stage.upper()} OUTPUT:\n{latest}")

    return "\n\n".join(blocks)


def upsert_company_memory(company_name: str, profile_data: Dict) -> None:
    COMPANY_STORE[company_name] = profile_data


def get_company_memory(company_name: Optional[str]) -> str:
    if not company_name:
        return ""

    company = COMPANY_STORE.get(company_name)
    if not company:
        return ""

    lines = [f"Company Name: {company_name}"]
    for key, value in company.items():
        lines.append(f"{key}: {value}")

    return "\n".join(lines)


def seed_test_company(company_name: str = "TestCo") -> None:
    if company_name not in COMPANY_STORE:
        COMPANY_STORE[company_name] = {
            "sector": "Transport and logistics",
            "priority_markets": "UK, Europe",
            "top_three_priorities": "Reduce cost, protect margin, improve planning confidence",
            "recommendation_style": "Balanced",
            "known_sensitivities": "Fuel costs, supply chain disruption, staffing pressure",
        }