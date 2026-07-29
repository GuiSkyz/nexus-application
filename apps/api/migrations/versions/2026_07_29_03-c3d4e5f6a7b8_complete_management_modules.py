"""complete_management_modules

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-07-29 15:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("employee_code", sa.String(50), nullable=True))
    op.add_column("users", sa.Column("phone", sa.String(30), nullable=True))
    op.add_column("users", sa.Column("team_name", sa.String(120), nullable=True))
    op.add_column("users", sa.Column("specialty", sa.String(120), nullable=True))
    op.create_index("ix_users_employee_code", "users", ["employee_code"], unique=True)

    op.add_column(
        "apr_assessments",
        sa.Column("weather_conditions", sa.Text(), nullable=False, server_default=""),
    )
    op.add_column(
        "apr_assessments",
        sa.Column("emergency_contact", sa.String(255), nullable=False, server_default=""),
    )
    op.add_column(
        "apr_assessments",
        sa.Column("audit_trail_json", sa.Text(), nullable=False, server_default="[]"),
    )

    op.create_table(
        "operational_settings",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("organization_name", sa.String(255), nullable=False),
        sa.Column(
            "timezone",
            sa.String(80),
            nullable=False,
            server_default="America/Sao_Paulo",
        ),
        sa.Column(
            "apr_approval_required", sa.Boolean(), nullable=False, server_default=sa.true()
        ),
        sa.Column(
            "critical_incident_notifications",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
        sa.Column(
            "checklist_reminder_hour", sa.Integer(), nullable=False, server_default="7"
        ),
        sa.Column(
            "evidence_retention_days",
            sa.Integer(),
            nullable=False,
            server_default="365",
        ),
        sa.Column("support_email", sa.String(255), nullable=True),
        sa.Column("report_footer", sa.Text(), nullable=True),
    )
    op.create_index(
        "ix_operational_settings_id", "operational_settings", ["id"], unique=False
    )


def downgrade() -> None:
    op.drop_table("operational_settings")
    op.drop_column("apr_assessments", "audit_trail_json")
    op.drop_column("apr_assessments", "emergency_contact")
    op.drop_column("apr_assessments", "weather_conditions")
    op.drop_index("ix_users_employee_code", table_name="users")
    op.drop_column("users", "specialty")
    op.drop_column("users", "team_name")
    op.drop_column("users", "phone")
    op.drop_column("users", "employee_code")
