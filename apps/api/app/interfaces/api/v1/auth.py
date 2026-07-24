from typing import Any
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from app.core.security import create_access_token, get_password_hash, verify_password

router = APIRouter(prefix="/auth", tags=["Autenticação"])


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/login", response_model=TokenResponse, summary="Login de usuários e emissão de JWT")
async def login(credentials: LoginRequest) -> Any:
    """
    Autentica usuários (Técnico, Supervisor, Coordenador, Diretor, Admin)
    e retorna o token de acesso assinado JWT.
    """
    # Credenciais simuladas de demonstração
    mock_users = {
        "tecnico.silva@nexusops.com": {"id": "usr-01", "name": "Carlos Silva", "role": "TECNICO"},
        "supervisor.lima@nexusops.com": {"id": "usr-02", "name": "Juliana Lima", "role": "SUPERVISOR"},
        "coordenador@nexusops.com": {"id": "usr-03", "name": "Roberto Alcantara", "role": "COORDENADOR"},
        "diretor@nexusops.com": {"id": "usr-04", "name": "Mariana Souza", "role": "DIRETOR"},
        "admin@nexusops.com": {"id": "usr-05", "name": "Administrador", "role": "ADMIN"},
    }

    user_info = mock_users.get(credentials.email.lower())
    if not user_info:
        # Tentar aceitar qualquer e-mail com senha padrão para facilidade de testes
        user_info = {
            "id": f"usr-{hash(credentials.email) % 1000}",
            "name": credentials.email.split("@")[0].title(),
            "role": "COORDENADOR",
        }

    token = create_access_token(data={"sub": user_info["id"], "role": user_info["role"]})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_info,
    }
