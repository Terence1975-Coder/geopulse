import re
from typing import Dict, List


EMAIL_PATTERN = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
PHONE_PATTERN = r"\b(?:\+44|0)\d[\d\s]{8,}\b"


def anonymize_text(text: str) -> Dict:
    replacements: List[Dict] = []
    anonymized = text

    email_matches = re.findall(EMAIL_PATTERN, anonymized)
    for idx, match in enumerate(email_matches, start=1):
        placeholder = f"[EMAIL_{idx}]"
        anonymized = anonymized.replace(match, placeholder)
        replacements.append(
            {"type": "email", "original": match, "placeholder": placeholder}
        )

    phone_matches = re.findall(PHONE_PATTERN, anonymized)
    for idx, match in enumerate(phone_matches, start=1):
        placeholder = f"[PHONE_{idx}]"
        anonymized = anonymized.replace(match, placeholder)
        replacements.append(
            {"type": "phone", "original": match, "placeholder": placeholder}
        )

    risk_level = "low"
    if len(replacements) >= 3:
        risk_level = "high"
    elif len(replacements) >= 1:
        risk_level = "medium"

    return {
        "raw_input": text,
        "anonymized_input": anonymized,
        "risk_level": risk_level,
        "replacements": replacements,
    }