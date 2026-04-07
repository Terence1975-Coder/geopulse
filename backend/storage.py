from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

DATA_DIR = Path(__file__).resolve().parent / "data"
PROFILE_FILE = DATA_DIR / "company_profile.json"
EVENTS_FILE = DATA_DIR / "events.json"


def _ensure() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not PROFILE_FILE.exists():
        PROFILE_FILE.write_text("{}", encoding="utf-8")
    if not EVENTS_FILE.exists():
        EVENTS_FILE.write_text("{}", encoding="utf-8")


def load_json(path: Path) -> Dict[str, Any]:
    _ensure()
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def save_json(path: Path, data: Dict[str, Any]) -> None:
    _ensure()
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
