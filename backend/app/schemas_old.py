from pydantic import BaseModel
from typing import Any, Dict

class AnalysisResponse(BaseModel):
    analysis_id: str
    status: str
    analysis: Dict[str, Any]