from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database.base import Base


class AprAssessmentModel(Base):
    __tablename__ = "apr_assessments"

    client_generated_id: Mapped[str] = mapped_column(
        String(36), unique=True, index=True, nullable=False
    )
    service_order_number: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    activity_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    activity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    location: Mapped[str] = mapped_column(Text, nullable=False)
    technician_id: Mapped[str] = mapped_column(String(36), nullable=False)
    technician_name: Mapped[str] = mapped_column(String(255), nullable=False)
    team_name: Mapped[str] = mapped_column(String(255), nullable=False)
    planned_start: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(
        String(30), index=True, nullable=False, default="DRAFT"
    )
    maximum_risk_level: Mapped[str] = mapped_column(String(20), nullable=False)
    maximum_residual_risk_level: Mapped[str] = mapped_column(String(20), nullable=False)
    hazards_json: Mapped[str] = mapped_column(Text, nullable=False)
    required_ppe_json: Mapped[str] = mapped_column(Text, nullable=False)
    technician_signature_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    supervisor_signature_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    authorization_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    authorized_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    authorized_at: Mapped[str | None] = mapped_column(String(50), nullable=True)
    can_start_activity: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class AprRiskModel(Base):
    __tablename__ = "apr_risks"

    apr_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    hazard: Mapped[str] = mapped_column(Text, nullable=False)
    probability: Mapped[int] = mapped_column(Integer, nullable=False)
    severity: Mapped[int] = mapped_column(Integer, nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    level: Mapped[str] = mapped_column(String(20), nullable=False)
    controls: Mapped[str] = mapped_column(Text, nullable=False)
    residual_probability: Mapped[int] = mapped_column(Integer, nullable=False)
    residual_severity: Mapped[int] = mapped_column(Integer, nullable=False)
    residual_score: Mapped[int] = mapped_column(Integer, nullable=False)
    residual_level: Mapped[str] = mapped_column(String(20), nullable=False)
