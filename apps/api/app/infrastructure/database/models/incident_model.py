from typing import Optional, List
from sqlalchemy import String, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.infrastructure.database.base import Base


class IncidentModel(Base):
    __tablename__ = "incidents"

    code: Mapped[str] = mapped_column(
        String(20), unique=True, index=True, nullable=False, comment="Código amigável da NC (ex: NC-2026-089)"
    )
    inspection_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    question_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)
    inspection_title: Mapped[str] = mapped_column(String(255), nullable=False)
    context_type: Mapped[str] = mapped_column(String(50), nullable=False, default="VEHICLE")
    vehicle_plate: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    vehicle_model: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    technician_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    technician_name: Mapped[str] = mapped_column(String(255), nullable=False)
    team_name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False, default="MEDIA")
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="ABERTA")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    action_plans: Mapped[List["ActionPlanModel"]] = relationship(
        "ActionPlanModel", back_populates="incident", cascade="all, delete-orphan"
    )


class ActionPlanModel(Base):
    __tablename__ = "action_plans"

    incident_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    assigned_to: Mapped[str] = mapped_column(String(255), nullable=False)
    due_date: Mapped[str] = mapped_column(String(50), nullable=False)
    created_by: Mapped[str] = mapped_column(String(255), nullable=False)
    resolved_at: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    evidence_photo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    incident: Mapped["IncidentModel"] = relationship("IncidentModel", back_populates="action_plans")
