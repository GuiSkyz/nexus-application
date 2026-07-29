# ruff: noqa: N815

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.infrastructure.database.models.user_model import UserModel
from app.infrastructure.database.session import get_db

router = APIRouter(prefix="/technicians", tags=["Técnicos"])


class TechnicianPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")

    fullName: str = Field(min_length=3, max_length=255)
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    employeeCode: str = Field(min_length=2, max_length=50)
    phone: str | None = None
    teamName: str | None = None
    specialty: str | None = None
    isActive: bool = True
    temporaryPassword: str | None = Field(default=None, min_length=8)


class TechnicianResponse(BaseModel):
    id: str
    fullName: str
    email: str
    employeeCode: str | None
    phone: str | None
    teamName: str | None
    specialty: str | None
    isActive: bool
    createdAt: str
    updatedAt: str


def _response(user: UserModel) -> TechnicianResponse:
    return TechnicianResponse(
        id=user.id,
        fullName=user.full_name,
        email=user.email,
        employeeCode=user.employee_code,
        phone=user.phone,
        teamName=user.team_name,
        specialty=user.specialty,
        isActive=user.is_active,
        createdAt=user.created_at.isoformat(),
        updatedAt=user.updated_at.isoformat(),
    )


@router.get("", response_model=list[TechnicianResponse])
async def list_technicians(
    session: AsyncSession = Depends(get_db),
) -> list[TechnicianResponse]:
    result = await session.execute(
        select(UserModel)
        .where(UserModel.role == "TECNICO")
        .order_by(UserModel.full_name)
    )
    return [_response(user) for user in result.scalars().all()]


@router.post(
    "", response_model=TechnicianResponse, status_code=status.HTTP_201_CREATED
)
async def create_technician(
    payload: TechnicianPayload, session: AsyncSession = Depends(get_db)
) -> TechnicianResponse:
    duplicate = await session.scalar(
        select(UserModel).where(
            or_(
                UserModel.email == payload.email.lower(),
                UserModel.employee_code == payload.employeeCode.upper(),
            )
        )
    )
    if duplicate:
        raise HTTPException(
            status_code=409, detail="E-mail ou matrícula já está em uso."
        )
    user = UserModel(
        full_name=payload.fullName.strip(),
        email=payload.email.lower(),
        employee_code=payload.employeeCode.upper(),
        phone=payload.phone,
        team_name=payload.teamName,
        specialty=payload.specialty,
        role="TECNICO",
        is_active=payload.isActive,
        hashed_password=get_password_hash(
            payload.temporaryPassword or "NexusOps@2026"
        ),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return _response(user)


@router.put("/{technician_id}", response_model=TechnicianResponse)
async def update_technician(
    technician_id: str,
    payload: TechnicianPayload,
    session: AsyncSession = Depends(get_db),
) -> TechnicianResponse:
    user = await session.get(UserModel, technician_id)
    if not user or user.role != "TECNICO":
        raise HTTPException(status_code=404, detail="Técnico não encontrado.")
    duplicate = await session.scalar(
        select(UserModel).where(
            UserModel.id != technician_id,
            or_(
                UserModel.email == payload.email.lower(),
                UserModel.employee_code == payload.employeeCode.upper(),
            ),
        )
    )
    if duplicate:
        raise HTTPException(
            status_code=409, detail="E-mail ou matrícula já está em uso."
        )
    user.full_name = payload.fullName.strip()
    user.email = payload.email.lower()
    user.employee_code = payload.employeeCode.upper()
    user.phone = payload.phone
    user.team_name = payload.teamName
    user.specialty = payload.specialty
    user.is_active = payload.isActive
    if payload.temporaryPassword:
        user.hashed_password = get_password_hash(payload.temporaryPassword)
    await session.commit()
    await session.refresh(user)
    return _response(user)


@router.delete("/{technician_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_technician(
    technician_id: str, session: AsyncSession = Depends(get_db)
) -> None:
    user = await session.get(UserModel, technician_id)
    if not user or user.role != "TECNICO":
        raise HTTPException(status_code=404, detail="Técnico não encontrado.")
    await session.delete(user)
    await session.commit()
