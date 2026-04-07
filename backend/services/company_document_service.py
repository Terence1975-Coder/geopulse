import uuid


def extract_insights_from_text(text: str):
    # Light V1 extraction (safe, expandable later)
    return {
        "products_services": [],
        "strategic_priorities": [],
        "regions": [],
        "customer_segments": [],
        "operating_dependencies": [],
        "risk_clues": [],
        "opportunity_clues": [],
        "financial_signals": [],
        "important_notes": [text[:300]]
    }


def process_document(text: str, name: str, doc_type: str):
    return {
        "document_id": str(uuid.uuid4()),
        "document_name": name,
        "document_type": doc_type,
        "parsed_text": text,
        "extracted_insights": extract_insights_from_text(text)
    }