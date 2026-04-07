import json
import os
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List

from app.models import EventCreate, CompanyProfile

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DATA_FILE = os.path.join(DATA_DIR, "geopulse_store.json")


class GeoPulseStore:
    def __init__(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        self.data = {
            "events": {},
            "analyses": {},
            "signals": {},
            "company_profile": None,
            "memory": {
                "last_discussed_event_id": None,
                "last_question": None,
                "recent_risk_concern": None,
                "last_scenario": None,
            },
        }
        self._load()
        self._ensure_seed_signals()

    def _load(self):
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                self.data = json.load(f)

    def _save(self):
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(self.data, f, indent=2)

    def _ensure_seed_signals(self):
        if self.data["signals"]:
            return

        signals = [
            {
                "id": "sig-1",
                "title": "Shipping corridor pressure",
                "category": "Supply Chain Risk",
                "score": 72,
                "momentum": 68,
                "credibility": 0.87,
                "region": "Middle East",
            },
            {
                "id": "sig-2",
                "title": "Energy price sensitivity elevated",
                "category": "Energy Risk",
                "score": 76,
                "momentum": 71,
                "credibility": 0.89,
                "region": "Global",
            },
            {
                "id": "sig-3",
                "title": "Sticky inflation transmission risk",
                "category": "Inflation Risk",
                "score": 63,
                "momentum": 57,
                "credibility": 0.81,
                "region": "Europe",
            },
            {
                "id": "sig-4",
                "title": "Market volatility watch",
                "category": "Market Volatility",
                "score": 66,
                "momentum": 62,
                "credibility": 0.84,
                "region": "Global",
            },
        ]
        self.data["signals"] = {s["id"]: s for s in signals}
        self._save()

    def create_event(self, event: EventCreate):
        event_id = str(uuid.uuid4())
        event_record = {
            "id": event_id,
            "headline": event.headline,
            "body": event.body,
            "region": event.region or "Global",
            "source": event.source or "Manual",
            "credibility": event.credibility or 0.8,
            "created_at": datetime.utcnow().isoformat(),
        }
        self.data["events"][event_id] = event_record
        self._save()
        return event_record

    def get_events(self) -> List[Dict[str, Any]]:
        values = list(self.data["events"].values())
        return sorted(values, key=lambda x: x["created_at"], reverse=True)

    def get_event(self, event_id: str) -> Optional[Dict[str, Any]]:
        return self.data["events"].get(event_id)

    def save_analysis(self, event_id: str, analysis):
        self.data["analyses"][event_id] = analysis.model_dump()
        self._save()

    def get_analysis(self, event_id: str):
        return self.data["analyses"].get(event_id)

    def get_analyses(self) -> List[Dict[str, Any]]:
        return list(self.data["analyses"].values())

    def get_signals(self) -> List[Dict[str, Any]]:
        return list(self.data["signals"].values())

    def set_company_profile(self, profile: CompanyProfile):
        self.data["company_profile"] = profile.model_dump()
        self._save()

    def get_company_profile(self):
        return self.data["company_profile"]

    def get_memory(self):
        return self.data["memory"]

    def update_memory(self, patch: Dict[str, Any]):
        self.data["memory"].update({k: v for k, v in patch.items() if v is not None})
        self._save()


store = GeoPulseStore()