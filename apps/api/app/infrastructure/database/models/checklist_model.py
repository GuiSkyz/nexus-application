from typing import Optional, List
from sqlalchemy import String, Integer, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.infrastructure.database.base import Base


class ChecklistTemplateModel(Base):
    __tablename__ = "checklist_templates"

    template_family_id: Mapped[str] = mapped_column(
        String(50), index=True, nullable=False, comment="ID fixo da família do template (ex: tpl-101)"
    )
    title: Mapped[str] = mapped_column(
        String(255), nullable=False, comment="Título do checklist"
    )
    category: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="Categoria operacional"
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="Descrição / Instruções do checklist"
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="draft", comment="Estado: draft, published, archived"
    )
    version: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1, comment="Número de versão sequencial"
    )
    is_latest_version: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, comment="Se é a última versão produzida"
    )
    created_by: Mapped[str] = mapped_column(
        String(255), nullable=False, comment="Usuário criador"
    )
    usage_count: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False, comment="Número de inspeções executadas com este template"
    )

    sections: Mapped[List["ChecklistSectionModel"]] = relationship(
        "ChecklistSectionModel", back_populates="template", cascade="all, delete-orphan", order_by="ChecklistSectionModel.order"
    )


class ChecklistSectionModel(Base):
    __tablename__ = "checklist_sections"

    template_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("checklist_templates.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    template: Mapped["ChecklistTemplateModel"] = relationship("ChecklistTemplateModel", back_populates="sections")
    questions: Mapped[List["ChecklistQuestionModel"]] = relationship(
        "ChecklistQuestionModel", back_populates="section", cascade="all, delete-orphan", order_by="ChecklistQuestionModel.order"
    )


class ChecklistQuestionModel(Base):
    __tablename__ = "checklist_questions"

    section_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("checklist_sections.id", ondelete="CASCADE"), nullable=False
    )
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False, default="yes_no")
    is_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    require_photo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    require_justification: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    options: Mapped[list[dict[str, str]]] = mapped_column(JSON, default=list, nullable=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    section: Mapped["ChecklistSectionModel"] = relationship("ChecklistSectionModel", back_populates="questions")
