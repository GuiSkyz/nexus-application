"""link action plans to their responsible technician

Revision ID: n4o5p6q7r8s9
Revises: m3n4o5p6q7r8
Create Date: 2026-08-05 16:20:00
"""

from alembic import op
import sqlalchemy as sa


revision = "n4o5p6q7r8s9"
down_revision = "m3n4o5p6q7r8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("action_plans", sa.Column("assigned_technician_id", sa.String(length=36), nullable=True))
    op.create_foreign_key(
        "fk_action_plans_assigned_technician_id_users",
        "action_plans",
        "users",
        ["assigned_technician_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_action_plans_assigned_technician_id", "action_plans", ["assigned_technician_id"])
    op.execute(
        """
        UPDATE action_plans AS plan
        SET assigned_technician_id = incident.technician_id,
            assigned_to = incident.technician_name
        FROM incidents AS incident
        WHERE plan.incident_id = incident.id
        """
    )


def downgrade() -> None:
    op.drop_index("ix_action_plans_assigned_technician_id", table_name="action_plans")
    op.drop_constraint("fk_action_plans_assigned_technician_id_users", "action_plans", type_="foreignkey")
    op.drop_column("action_plans", "assigned_technician_id")
