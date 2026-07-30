from datetime import timedelta
from typing import Annotated, Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import SESSION_COOKIE_NAME, get_current_user
from app.core.config import get_settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.infrastructure.database.models.user_model import UserModel
from app.infrastructure.database.session import get_db

router = APIRouter(prefix="/auth", tags=["Autenticação"])


class LoginRequest(BaseModel):
    email: str
    password: str
    client: Literal["web", "mobile"] = "web"


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=10, max_length=128)


def _user_response(user: UserModel) -> UserResponse:
    return UserResponse(
        id=user.id,
        name=user.full_name,
        email=user.email,
        role=user.role,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: LoginRequest,
    response: Response,
    session: AsyncSession = Depends(get_db),
) -> Any:
    user = await session.scalar(
        select(UserModel).where(UserModel.email == credentials.email.lower().strip())
    )
    if (
        not user
        or not user.is_active
        or not verify_password(credentials.password, user.hashed_password)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos.",
        )

    settings = get_settings()
    expire_minutes = (
        settings.MOBILE_ACCESS_TOKEN_EXPIRE_MINUTES
        if credentials.client == "mobile"
        else settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    token = create_access_token(
        data={"sub": user.id, "role": user.role},
        expires_delta=timedelta(minutes=expire_minutes),
    )
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=expire_minutes * 60,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        path="/",
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": _user_response(user),
    }


@router.get("/me", response_model=UserResponse)
async def me(
    user: Annotated[UserModel, Depends(get_current_user)],
) -> UserResponse:
    return _user_response(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response) -> None:
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        httponly=True,
        secure=get_settings().ENVIRONMENT == "production",
        samesite="lax",
        path="/",
    )


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    payload: ChangePasswordRequest,
    user: Annotated[UserModel, Depends(get_current_user)],
    session: AsyncSession = Depends(get_db),
) -> None:
    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A senha atual não confere.",
        )
    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A nova senha deve ser diferente da senha atual.",
        )
    user.hashed_password = get_password_hash(payload.new_password)
    await session.commit()
