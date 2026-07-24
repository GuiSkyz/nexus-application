from typing import Optional
from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.infrastructure.database.base import Base


class VehicleModel(Base):
    __tablename__ = "vehicles"

    model: Mapped[str] = mapped_column(
        String(255), nullable=False, comment="Modelo do veículo (ex: Fiat Strada Endurance 1.4)"
    )
    plate: Mapped[str] = mapped_column(
        String(10), unique=True, index=True, nullable=False, comment="Placa do veículo (ex: ABC-1234)"
    )
    year: Mapped[int] = mapped_column(
        Integer, nullable=False, default=2024, comment="Ano de fabricação"
    )
    current_km: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="Quilometragem atual do odômetro"
    )
    category: Mapped[str] = mapped_column(
        String(50), nullable=False, default="INSTALACAO", comment="Categoria: INSTALACAO, MANUTENCAO_FIBRA, INFRAESTRUTURA, SUPERVISAO"
    )
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="DISPONIVEL", comment="Status: DISPONIVEL, EM_VISTORIA, MANUTENCAO, INDISPONIVEL"
    )
    assigned_technician_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, comment="ID do técnico responsável atribuído"
    )
    assigned_checklist_template_id: Mapped[Optional[str]] = mapped_column(
        String(36), nullable=True, comment="ID do template de checklist padrão vinculado"
    )
