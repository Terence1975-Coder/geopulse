from __future__ import annotations

from typing import Dict, List, Optional
from models.events import EventItem, EventCluster
from models.signals import Signal
from models.dashboard import RiskSnapshot


class AppState:
    def __init__(self) -> None:
        self.events: Dict[str, EventItem] = {}
        self.signals: Dict[str, Signal] = {}
        self.clusters: Dict[str, EventCluster] = {}
        self.risk_history: List[RiskSnapshot] = []
        self.company_profile: Dict[str, object] = {
            "company_name": "My Company",
            "sector": "General Business",
            "sub_sector": "SME",
            "supply_chain_exposure_regions": [],
            "energy_dependency_level": 50,
            "import_export_exposure": 50,
            "consumer_sensitivity_level": 50,
            "financial_leverage_sensitivity": 50,
            "strategic_priorities": ["resilience"],
        }


STATE = AppState()