# ruff: noqa: N815

from typing import Annotated, Literal, cast

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.operational_categories import OPERATIONAL_CATEGORIES
from app.core.security import get_password_hash
from app.infrastructure.database.models.user_model import UserModel
from app.infrastructure.database.session import get_db

router = APIRouter(prefix="/users", tags=["Usuários e acessos"])

UserRole = Literal[
    "TECNICO",
    "SUPERVISOR",
    "COORDENADOR",
    "DIRETOR",
    "ADMIN",
    "MASTER",
]
MANAGER_ROLES = {"MASTER", "DIRETOR"}
DIRECTOR_ALLOWED_ROLES = {"TECNICO", "SUPERVISOR", "COORDENADOR", "DIRETOR"}


class UserCreatePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    fullName: str = Field(min_length=3, max_length=255)
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    role: UserRole
    temporaryPassword: str = Field(min_length=10, max_length=128)
    isActive: bool = True
    operationalCategory: str = "INSTALACAO_MANUTENCAO"


class UserUpdatePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    fullName: str = Field(min_length=3, max_length=255)
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    role: UserRole
    temporaryPassword: str | None = Field(default=None, min_length=10, max_length=128)
    isActive: bool = True
    operationalCategory: str = "INSTALACAO_MANUTENCAO"


class UserResponse(BaseModel):
    id: str
    fullName: str
    email: str
    role: UserRole
    isActive: bool
    createdAt: str
    updatedAt: str
    operationalCategory: str


def _ensure_manager(user: UserModel) -> None:
    if user.role not in MANAGER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas Master e Diretor podem gerenciar usuários.",
        )


def _ensure_role_assignment(manager: UserModel, role: str) -> None:
    if manager.role == "DIRETOR" and role not in DIRECTOR_ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Diretores não podem atribuir os cargos Master ou Administrador.",
        )


def _ensure_target_access(manager: UserModel, target: UserModel) -> None:
    if manager.role == "DIRETOR" and target.role in {"MASTER", "ADMIN"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Diretores não podem alterar contas Master ou Administrador.",
        )


def _response(user: UserModel) -> UserResponse:
    return UserResponse(
        id=user.id,
        fullName=user.full_name,
        email=user.email,
        role=cast(UserRole, user.role),
        isActive=user.is_active,
        createdAt=user.created_at.isoformat(),
        updatedAt=user.updated_at.isoformat(),
        operationalCategory=user.operational_category,
    )


@router.get("", response_model=list[UserResponse])
async def list_users(
    manager: Annotated[UserModel, Depends(get_current_user)],
    session: AsyncSession = Depends(get_db),
) -> list[UserResponse]:
    _ensure_manager(manager)
    result = await session.execute(select(UserModel).order_by(UserModel.full_name))
    users = result.scalars().all()
    if manager.role == "DIRETOR":
        users = [
            user for user in users if user.role not in {"MASTER", "ADMIN"}
        ]
    return [_response(user) for user in users]


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreatePayload,
    manager: Annotated[UserModel, Depends(get_current_user)],
    session: AsyncSession = Depends(get_db),
) -> UserResponse:
    _ensure_manager(manager)
    _ensure_role_assignment(manager, payload.role)
    if payload.role == "TECNICO" and payload.operationalCategory not in OPERATIONAL_CATEGORIES:
        raise HTTPException(status_code=422, detail="Categoria operacional inválida.")
    email = payload.email.lower().strip()
    if await session.scalar(select(UserModel).where(UserModel.email == email)):
        raise HTTPException(status_code=409, detail="E-mail já está em uso.")
    user = UserModel(
        full_name=payload.fullName.strip(),
        email=email,
        role=payload.role,
        hashed_password=get_password_hash(payload.temporaryPassword),
        is_active=payload.isActive,
        operational_category=payload.operationalCategory,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return _response(user)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    payload: UserUpdatePayload,
    manager: Annotated[UserModel, Depends(get_current_user)],
    session: AsyncSession = Depends(get_db),
) -> UserResponse:
    _ensure_manager(manager)
    user = await session.get(UserModel, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    _ensure_target_access(manager, user)
    _ensure_role_assignment(manager, payload.role)
    if payload.role == "TECNICO" and payload.operationalCategory not in OPERATIONAL_CATEGORIES:
        raise HTTPException(status_code=422, detail="Categoria operacional inválida.")
    email = payload.email.lower().strip()
    duplicate = await session.scalar(
        select(UserModel).where(UserModel.email == email, UserModel.id != user_id)
    )
    if duplicate:
        raise HTTPException(status_code=409, detail="E-mail já está em uso.")
    if user.id == manager.id and not payload.isActive:
        raise HTTPException(
            status_code=400, detail="Você não pode desativar a própria conta."
        )
    user.full_name = payload.fullName.strip()
    user.email = email
    user.role = payload.role
    user.is_active = payload.isActive
    user.operational_category = payload.operationalCategory
    if payload.temporaryPassword:
        user.hashed_password = get_password_hash(payload.temporaryPassword)
    await session.commit()
    await session.refresh(user)
    return _response(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    manager: Annotated[UserModel, Depends(get_current_user)],
    session: AsyncSession = Depends(get_db),
) -> None:
    _ensure_manager(manager)
    user = await session.get(UserModel, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    _ensure_target_access(manager, user)
    if user.id == manager.id:
        raise HTTPException(
            status_code=400, detail="Você não pode excluir a própria conta."
        )
    await session.delete(user)
    await session.commit()
