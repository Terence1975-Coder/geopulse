import re
from collections import defaultdict
from .schemas import DetectedEntity


EMAIL_RE = re.compile(r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}\b")
PHONE_RE = re.compile(r"\b(?:\+44\s?7\d{3}|07\d{3})\s?\d{3}\s?\d{3}\b")
URL_RE = re.compile(r"\bhttps?://[^\s]+\b")


def detect_entities(text: str) -> list[DetectedEntity]:
    entities: list[DetectedEntity] = []
    counters = defaultdict(int)

    for match in EMAIL_RE.finditer(text):
        counters["EMAIL"] += 1
        entities.append(
            DetectedEntity(
                type="EMAIL",
                original=match.group(0),
                placeholder=f"[EMAIL_{counters['EMAIL']}]",
            )
        )

    for match in PHONE_RE.finditer(text):
        counters["PHONE"] += 1
        entities.append(
            DetectedEntity(
                type="PHONE",
                original=match.group(0),
                placeholder=f"[PHONE_{counters['PHONE']}]",
            )
        )

    for match in URL_RE.finditer(text):
        counters["URL"] += 1
        entities.append(
            DetectedEntity(
                type="URL",
                original=match.group(0),
                placeholder=f"[URL_{counters['URL']}]",
            )
        )

    return entities