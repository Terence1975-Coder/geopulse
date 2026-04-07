from sqlalchemy import Column, String, JSON, DateTime
from datetime import datetime
from backend.db import Base


class CompanyDocumentModel(Base):
    __tablename__ = "company_documents"

    id = Column(String, primary_key=True, index=True)
    company_id = Column(String, index=True)

    document_name = Column(String)
    document_type = Column(String)

    parsed_text = Column(String)

    extracted_insights = Column(JSON)

    created_at = Column(DateTime, default=datetime.utcnow)