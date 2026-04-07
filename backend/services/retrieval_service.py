from typing import List, Dict
from sqlalchemy.orm import Session

from backend.models import ResourceBankItem
from backend.services.trust_service import normalize_tags, score_resource_relevance


def retrieve_evidence(db: Session, query: str, limit: int = 5) -> List[Dict]:
    items = db.query(ResourceBankItem).all()
    ranked = []

    for item in items:
        tags = normalize_tags(item.tags)
        relevance_score = score_resource_relevance(query, item.content, tags)
        final_score = relevance_score + (item.trust_score * 0.35)

        ranked.append(
            {
                "id": item.id,
                "title": item.title,
                "source_type": item.source_type,
                "trust_score": item.trust_score,
                "tags": tags,
                "content": item.content,
                "final_score": final_score,
                "excerpt": item.content[:280],
            }
        )

    ranked.sort(key=lambda x: x["final_score"], reverse=True)
    return ranked[:limit]