from typing import List, Dict


def normalize_tags(tags_raw: str | None) -> List[str]:
    if not tags_raw:
        return []
    return [tag.strip() for tag in tags_raw.split(",") if tag.strip()]


def score_resource_relevance(query: str, content: str, tags: List[str]) -> float:
    query_terms = [term.lower() for term in query.split() if len(term) > 2]
    score = 0.0

    content_lower = content.lower()
    for term in query_terms:
        if term in content_lower:
            score += 8.0

    for tag in tags:
        if tag.lower() in query.lower():
            score += 12.0

    return score