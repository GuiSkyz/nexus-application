from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database.base import Base


class OperationalSettingsModel(Base):
    __tablename__ = "operational_settings"

    organization_name: Mapped[str] = mapped_column(String(255), nullable=False)
    timezone: Mapped[str] = mapped_column(
        String(80), nullable=False, default="America/Sao_Paulo"
    )
    apr_approval_required: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    critical_incident_notifications: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    checklist_reminder_hour: Mapped[int] = mapped_column(
        Integer, nullable=False, default=7
    )
    evidence_retention_days: Mapped[int] = mapped_column(
        Integer, nullable=False, default=365
    )
    support_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    report_footer: Mapped[str | None] = mapped_column(Text, nullable=True)
