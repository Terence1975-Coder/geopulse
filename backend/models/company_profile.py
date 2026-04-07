from sqlalchemy import Column, String, Float, JSON, DateTime
from datetime import datetime
from backend.db import Base


class CompanyProfileModel(Base):
    __tablename__ = "company_profiles"

    id = Column(String, primary_key=True, index=True)
    company_name = Column(String)

    sector = Column(String)
    sub_sector = Column(String)

    regions = Column(JSON)
    products_services = Column(JSON)
    customer_segments = Column(JSON)

    supplier_dependencies = Column(JSON)
    logistics_dependencies = Column(JSON)

    energy_dependency = Column(Float, default=0)
    import_export_exposure = Column(Float, default=0)
    consumer_sensitivity = Column(Float, default=0)
    regulatory_exposure = Column(Float, default=0)
    financial_sensitivity = Column(Float, default=0)

    margin_pressure_points = Column(JSON)
    strategic_priorities = Column(JSON)
    growth_objectives = Column(JSON)

    risk_tolerance = Column(String)
    recommendation_style = Column(String)

    competitor_context = Column(JSON)

    known_risk_areas = Column(JSON)
    known_opportunity_areas = Column(JSON)

    notes = Column(String)

    calibration_summary = Column(JSON)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)