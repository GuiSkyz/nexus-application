from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database.base import Base


class InspectionReportModel(Base):
    __tablename__ = "inspection_reports"

    inspection_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    object_key: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    generated_by: Mapped[str] = mapped_column(String(255), nullable=False)
    signature_object_key: Mapped[str | None] = mapped_column(Text, nullable=True)
