import asyncio
import logging
import os

from sqlalchemy import select

from app.core.security import get_password_hash
from app.infrastructure.database.models.user_model import UserModel
from app.infrastructure.database.session import AsyncSessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed_database() -> None:
    """Cria somente o administrador inicial quando o banco ainda não possui usuários."""
    email = os.getenv("INITIAL_ADMIN_EMAIL")
    password = os.getenv("INITIAL_ADMIN_PASSWORD")
    name = os.getenv("INITIAL_ADMIN_NAME", "Administrador NexusOps")
    if not email or not password:
        logger.info(
            "Seed ignorado: defina INITIAL_ADMIN_EMAIL e INITIAL_ADMIN_PASSWORD."
        )
        return
    async with AsyncSessionLocal() as session:
        existing = await session.scalar(select(UserModel).limit(1))
        if existing:
            logger.info("Banco já possui usuários; nenhuma credencial foi criada.")
            return
        session.add(
            UserModel(
                full_name=name,
                email=email.lower(),
                hashed_password=get_password_hash(password),
                role="ADMIN",
                is_active=True,
            )
        )
        await session.commit()
        logger.info("Administrador inicial criado.")


if __name__ == "__main__":
    asyncio.run(seed_database())
