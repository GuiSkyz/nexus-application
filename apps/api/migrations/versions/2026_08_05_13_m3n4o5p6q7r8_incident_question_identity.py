"""identify non-conformities by checklist question

Revision ID: m3n4o5p6q7r8
Revises: l2m3n4o5p6q7
Create Date: 2026-08-05 15:30:00
"""

from alembic import op
import sqlalchemy as sa


revision = "m3n4o5p6q7r8"
down_revision = "l2m3n4o5p6q7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("incidents", sa.Column("question_id", sa.String(length=36), nullable=True))
    op.create_index("ix_incidents_question_id", "incidents", ["question_id"])
    op.create_index(
        "uq_incidents_inspection_question_open",
        "incidents",
        ["inspection_id", "question_id"],
        unique=True,
        postgresql_where=sa.text("question_id IS NOT NULL AND status <> 'CANCELADA'"),
    )


def downgrade() -> None:
    op.drop_index("uq_incidents_inspection_question_open", table_name="incidents")
    op.drop_index("ix_incidents_question_id", table_name="incidents")
    op.drop_column("incidents", "question_id")
