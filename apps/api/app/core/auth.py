from typing import Annotated

import jwt
from fastapi import Cookie, Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.infrastructure.database.models.user_model import UserModel
from app.infrastructure.database.session import get_db

SESSION_COOKIE_NAME = "nexusops_session"


async def get_current_user(
    session: Annotated[AsyncSession, Depends(get_db)],
    authorization: Annotated[str | None, Header()] = None,
    session_cookie: Annotated[
        str | None, Cookie(alias=SESSION_COOKIE_NAME)
    ] = None,
) -> UserModel:
    token = session_cookie
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticação necessária.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not isinstance(user_id, str) or not user_id:
            raise ValueError("Token sem usuário")
    except (jwt.PyJWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessão inválida ou expirada.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    user = await session.get(UserModel, user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário inativo ou não encontrado.",
        )
    return user


async def enforce_rbac(
    request: Request,
    user: Annotated[UserModel, Depends(get_current_user)],
) -> UserModel:
    """Aplica a matriz de autorização às rotas operacionais."""
    role = user.role
    method = request.method.upper()
    path = request.url.path

    if role in {"MASTER", "ADMIN", "DIRETOR"}:
        return user

    if role == "TECNICO":
        can_view_vehicles = method == "GET" and path.startswith(
            "/api/v1/vehicles"
        )
        can_use_mobile_context = (
            method == "GET" and path == "/api/v1/inspections/mobile-context"
        )
        can_sync_field_work = (
            method == "POST" and path == "/api/v1/inspections/sync"
        )
        if can_view_vehicles or can_use_mobile_context or can_sync_field_work:
            return user
        _forbid()

    if role == "SUPERVISOR":
        if method == "GET":
            return user
        can_decide_apr = method == "POST" and (
            path.endswith("/authorize") or path.endswith("/reject")
        )
        can_manage_incident = method == "POST" and (
            path.endswith("/action-plan") or path.endswith("/resolve")
        )
        can_sync_field_work = (
            method == "POST" and path == "/api/v1/inspections/sync"
        )
        if can_decide_apr or can_manage_incident or can_sync_field_work:
            return user
        _forbid()

    if role == "COORDENADOR":
        if method != "DELETE":
            return user
        _forbid()

    _forbid()


def _forbid() -> None:
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Seu cargo não possui permissão para esta operação.",
    )
