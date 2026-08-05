"""checklist technician assignments

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-08-05 10:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "f6a7b8c9d0e1"
down_revision: str | None = "e5f6a7b8c9d0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "checklist_technician_assignments",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("template_id", sa.String(length=36), nullable=False),
        sa.Column("technician_id", sa.String(length=36), nullable=False),
        sa.Column("frequency", sa.String(length=20), nullable=False, server_default="DAILY"),
        sa.ForeignKeyConstraint(["template_id"], ["checklist_templates.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["technician_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("template_id", "technician_id", name="uq_checklist_technician_assignment"),
    )
    op.alter_column("checklist_technician_assignments", "frequency", server_default=None)
    op.create_index(op.f("ix_checklist_technician_assignments_id"), "checklist_technician_assignments", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_checklist_technician_assignments_id"), table_name="checklist_technician_assignments")
    op.drop_table("checklist_technician_assignments")
