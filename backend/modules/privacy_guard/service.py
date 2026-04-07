from .detector import detect_entities
from .mapper import apply_anonymization, infer_privacy_risk
from .schemas import PrivacyPreviewResponse


class PrivacyGuardService:
    def preview(self, raw_input: str) -> PrivacyPreviewResponse:
        entities = detect_entities(raw_input)
        anonymized = apply_anonymization(raw_input, entities)
        risk = infer_privacy_risk(entities)
        return PrivacyPreviewResponse(
            raw_input=raw_input,
            anonymized_input=anonymized,
            detected_entities=entities,
            privacy_risk_level=risk,
        )