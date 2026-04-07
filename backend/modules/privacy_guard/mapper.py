from .schemas import DetectedEntity


def apply_anonymization(text: str, entities: list[DetectedEntity]) -> str:
    anonymized = text
    # replace longest first to reduce overlap issues
    for entity in sorted(entities, key=lambda e: len(e.original), reverse=True):
        anonymized = anonymized.replace(entity.original, entity.placeholder)
    return anonymized


def infer_privacy_risk(entities: list[DetectedEntity]) -> str:
    if len(entities) >= 4:
        return "high"
    if len(entities) >= 2:
        return "medium"
    return "low"