from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, JSON, String, Text

try:
    from backend.db import Base
except ImportError:
    from db import Base


class Signal(Base):
    __tablename__ = "signals"

    id = Column(String, primary_key=True, index=True)
    headline = Column(String, nullable=False, index=True)
    summary = Column(Text, nullable=False, default="")
    region = Column(String, nullable=False, default="Global", index=True)
    cluster_tag = Column(String, nullable=False, default="General", index=True)
    kind = Column(String, nullable=False, default="risk", index=True)
    severity = Column(String, nullable=False, default="medium", index=True)

    source = Column(String, nullable=False, default="Unknown", index=True)
    source_type = Column(String, nullable=False, default="manual", index=True)

    confidence_score = Column(Float, nullable=False, default=0.0)
    freshness_minutes = Column(Integer, nullable=False, default=0)
    signal_strength = Column(Float, nullable=False, default=0.0)

    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    supporting_facts = Column(JSON, nullable=True, default=dict)
    metadata_json = Column(JSON, nullable=True, default=dict)