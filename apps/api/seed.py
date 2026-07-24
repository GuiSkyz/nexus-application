import asyncio
import logging
from sqlalchemy import text
from app.infrastructure.database.session import AsyncSessionLocal
from app.infrastructure.database.models.user_model import UserModel
from app.infrastructure.database.models.vehicle_model import VehicleModel
from app.infrastructure.database.models.checklist_model import ChecklistTemplateModel, ChecklistSectionModel, ChecklistQuestionModel
from passlib.context import CryptContext

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_database():
    logger.info("Iniciando Seed do Banco de Dados...")
    
    async with AsyncSessionLocal() as session:
        # Check if users already exist
        result = await session.execute(text("SELECT count(*) FROM users"))
        count = result.scalar()
        if count and count > 0:
            logger.info("Banco de dados já contém usuários. Pulando seed.")
            return

        logger.info("Criando usuário administrador...")
        admin = UserModel(
            name="Administrador",
            email="admin@nexusops.com",
            hashed_password=pwd_context.hash("senha123"),
            role="admin",
            is_active=True
        )
        session.add(admin)

        logger.info("Criando usuário técnico...")
        tecnico = UserModel(
            name="Técnico João",
            email="tecnico@nexusops.com",
            hashed_password=pwd_context.hash("senha123"),
            role="operator",
            is_active=True
        )
        session.add(tecnico)

        logger.info("Criando veículos de teste...")
        vehicle1 = VehicleModel(
            plate="ABC-1234",
            model="Fiat Uno Mille",
            year=2012,
            status="AVAILABLE",
            mileage=150000.5
        )
        vehicle2 = VehicleModel(
            plate="XYZ-9876",
            model="Volkswagen Gol",
            year=2018,
            status="AVAILABLE",
            mileage=85000.0
        )
        session.add_all([vehicle1, vehicle2])

        logger.info("Criando Checklist de Saída de Veículo...")
        template = ChecklistTemplateModel(
            name="Checklist de Saída de Veículo",
            description="Inspeção diária obrigatória antes de sair com o veículo da frota",
            version=1,
            is_active=True
        )
        session.add(template)
        await session.flush() # Para pegar o template.id

        section1 = ChecklistSectionModel(
            template_id=template.id,
            title="Itens Externos e Pneus",
            order=1
        )
        section2 = ChecklistSectionModel(
            template_id=template.id,
            title="Itens Internos e Segurança",
            order=2
        )
        session.add_all([section1, section2])
        await session.flush()

        q1 = ChecklistQuestionModel(
            section_id=section1.id,
            question_text="Pneus estão em bom estado e calibrados?",
            question_type="BOOLEAN",
            is_required=True,
            order=1
        )
        q2 = ChecklistQuestionModel(
            section_id=section1.id,
            question_text="Lataria possui algum amassado novo? (Tire foto se sim)",
            question_type="BOOLEAN",
            is_required=True,
            order=2,
            requires_photo_if="NO" # Se responder "NO" (não está ok), tira foto
        )
        q3 = ChecklistQuestionModel(
            section_id=section2.id,
            question_text="Extintor de incêndio no prazo de validade?",
            question_type="BOOLEAN",
            is_required=True,
            order=1
        )
        session.add_all([q1, q2, q3])

        await session.commit()
        logger.info("Seed finalizado com sucesso!")

if __name__ == "__main__":
    asyncio.run(seed_database())
