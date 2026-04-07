from fastapi import APIRouter
from backend.modules.privacy_guard.schemas import PrivacyPreviewRequest, PrivacyPreviewResponse
from backend.modules.privacy_guard.service import PrivacyGuardService

router = APIRouter(prefix="/intel", tags=["privacy"])
service = PrivacyGuardService()


@router.post("/privacy-preview", response_model=PrivacyPreviewResponse)
def privacy_preview(payload: PrivacyPreviewRequest) -> PrivacyPreviewResponse:
    return service.preview(payload.input)