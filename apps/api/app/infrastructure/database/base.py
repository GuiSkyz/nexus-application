from datetime import datetime
from typing import Any
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, String
from app.domain.base import generate_uuid, get_current_utc_timestamp


class Base(DeclarativeBase):
    """
    Base declarativa oficial do SQLAlchemy 2.0 para todas as entidades persistidas no PostgreSQL.
    Inclui convenção de nomes explícita e colunas de controle padrão (id, created_at, updated_at).
    """
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
        index=True,
        comment="Chave primária no padrão UUIDv4 string"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=get_current_utc_timestamp,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=get_current_utc_timestamp,
        onupdate=get_current_utc_timestamp,
        nullable=False
    )
