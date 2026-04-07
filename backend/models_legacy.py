from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship

from backend.db import Base


class ResourceBankItem(Base):
    __tablename__ = "resource_bank_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    source_type = Column(String, nullable=False, default="document")
    content = Column(Text, nullable=False)
    tags = Column(String, nullable=True)
    trust_score = Column(Float, nullable=False, default=75.0)
    created_at = Column(DateTime, default=datetime.utcnow)


class CompanyMemory(Base):
    __tablename__ = "company_memory"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, nullable=False, index=True)
    company_id = Column(String, nullable=True, index=True)
    market_focus = Column(Text, nullable=True)
    strategic_priorities = Column(Text, nullable=True)
    recommendation_posture = Column(String, nullable=True)
    profile_json = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AgentChainRun(Base):
    __tablename__ = "agent_chain_runs"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, nullable=True, index=True)
    input_text = Column(Text, nullable=False)
    anonymized_input = Column(Text, nullable=True)
    requested_stage = Column(String, nullable=False)
    completed_steps = Column(String, nullable=True)
    output_analyse = Column(Text, nullable=True)
    output_advise = Column(Text, nullable=True)
    output_plan = Column(Text, nullable=True)
    output_profile = Column(Text, nullable=True)
    evidence_json = Column(Text, nullable=True)
    explanation_json = Column(Text, nullable=True)
    privacy_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)