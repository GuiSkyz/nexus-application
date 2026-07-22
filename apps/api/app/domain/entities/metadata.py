from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Text
from app.infrastructure.database.base import Base


class SystemMetadata(Base):
    """
    Entidade técnica inicial utilizada exclusivamente na fundação do ecossistema para
    validação do mecanismo de migrations (Alembic) e persistência no PostgreSQL.
    """
    __tablename__ = "sys_metadata"

    key: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
        comment="Chave de identificação do metadado do sistema"
    )
    value: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Valor em texto ou JSON estruturado do metadado"
    )
    description: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        comment="Descrição opcional para auditoria ou documentação do metadado"
    )
