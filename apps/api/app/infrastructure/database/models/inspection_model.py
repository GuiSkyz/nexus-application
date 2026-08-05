from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base


class InspectionModel(Base):
    __tablename__ = "inspections"

    client_generated_id: Mapped[str] = mapped_column(
        String(36),
        unique=True,
        index=True,
        nullable=False,
        comment="UUIDv4 gerado no mobile para sincronização offline idempotente",
    )
    template_id: Mapped[str] = mapped_column(
        String(36), nullable=False, comment="ID do template de checklist utilizado"
    )
    template_version: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="1",
        comment="Versão congelada do template no momento da vistoria",
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    vehicle_plate: Mapped[str | None] = mapped_column(String(10), nullable=True)
    vehicle_model: Mapped[str | None] = mapped_column(String(255), nullable=True)
    technician_name: Mapped[str] = mapped_column(String(255), nullable=False)
    technician_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    vehicle_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True, index=True
    )
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="COMPLETED")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    answers: Mapped[list["InspectionAnswerModel"]] = relationship(
        "InspectionAnswerModel", back_populates="inspection", cascade="all, delete-orphan"
    )
    evidences: Mapped[list["EvidenceModel"]] = relationship(
        "EvidenceModel", back_populates="inspection", cascade="all, delete-orphan"
    )


class InspectionAnswerModel(Base):
    __tablename__ = "inspection_answers"

    inspection_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False
    )
    question_id: Mapped[str] = mapped_column(String(36), nullable=False)
    answer_value: Mapped[str] = mapped_column(String(100), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    inspection: Mapped["InspectionModel"] = relationship(
        "InspectionModel", back_populates="answers"
    )


class EvidenceModel(Base):
    __tablename__ = "evidences"

    inspection_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False
    )
    photo_url: Mapped[str] = mapped_column(Text, nullable=False)
    captured_at: Mapped[str] = mapped_column(String(50), nullable=False)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    content_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)

    inspection: Mapped["InspectionModel"] = relationship(
        "InspectionModel", back_populates="evidences"
    )
