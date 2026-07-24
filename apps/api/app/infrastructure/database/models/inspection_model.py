from typing import Optional, List
from sqlalchemy import String, ForeignKey, Text, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.infrastructure.database.base import Base


class InspectionModel(Base):
    __tablename__ = "inspections"

    client_generated_id: Mapped[str] = mapped_column(
        String(36), unique=True, index=True, nullable=False, comment="UUIDv4 gerado no mobile para sincronização offline idempotente"
    )
    template_id: Mapped[str] = mapped_column(
        String(36), nullable=False, comment="ID do template de checklist utilizado"
    )
    template_version: Mapped[int] = mapped_column(
        String(10), nullable=False, default="1", comment="Versão congelada do template no momento da vistoria"
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    vehicle_plate: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    vehicle_model: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    technician_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="COMPLETED")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    answers: Mapped[List["InspectionAnswerModel"]] = relationship(
        "InspectionAnswerModel", back_populates="inspection", cascade="all, delete-orphan"
    )
    evidences: Mapped[List["EvidenceModel"]] = relationship(
        "EvidenceModel", back_populates="inspection", cascade="all, delete-orphan"
    )


class InspectionAnswerModel(Base):
    __tablename__ = "inspection_answers"

    inspection_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False
    )
    question_id: Mapped[str] = mapped_column(String(36), nullable=False)
    answer_value: Mapped[str] = mapped_column(String(100), nullable=False)

    inspection: Mapped["InspectionModel"] = relationship("InspectionModel", back_populates="answers")


class EvidenceModel(Base):
    __tablename__ = "evidences"

    inspection_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False
    )
    photo_url: Mapped[str] = mapped_column(Text, nullable=False)
    captured_at: Mapped[str] = mapped_column(String(50), nullable=False)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    inspection: Mapped["InspectionModel"] = relationship("InspectionModel", back_populates="evidences")
