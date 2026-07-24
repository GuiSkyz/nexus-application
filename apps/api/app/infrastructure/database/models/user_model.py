from typing import Optional
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.infrastructure.database.base import Base


class UserModel(Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False, comment="E-mail corporativo do usuário"
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255), nullable=False, comment="Hash seguro Argon2/Bcrypt da senha"
    )
    full_name: Mapped[str] = mapped_column(
        String(255), nullable=False, comment="Nome completo do colaborador"
    )
    role: Mapped[str] = mapped_column(
        String(50), nullable=False, default="TECNICO", comment="Papel RBAC: TECNICO, SUPERVISOR, COORDENADOR, DIRETOR, ADMIN"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, comment="Flag de conta ativa/suspensa"
    )
