"""operational_modules

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-07-23 20:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def audit_columns() -> list[sa.Column]:
    return [
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    ]


def upgrade() -> None:
    op.create_table(
        "users",
        *audit_columns(),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "checklist_templates",
        *audit_columns(),
        sa.Column("template_family_id", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("is_latest_version", sa.Boolean(), nullable=False),
        sa.Column("created_by", sa.String(length=255), nullable=False),
        sa.Column("usage_count", sa.Integer(), nullable=False),
    )
    op.create_index("ix_checklist_templates_id", "checklist_templates", ["id"])
    op.create_index(
        "ix_checklist_templates_template_family_id",
        "checklist_templates",
        ["template_family_id"],
    )

    op.create_table(
        "vehicles",
        *audit_columns(),
        sa.Column("model", sa.String(length=255), nullable=False),
        sa.Column("plate", sa.String(length=10), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("current_km", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("assigned_technician_id", sa.String(length=36), nullable=True),
        sa.Column("assigned_checklist_template_id", sa.String(length=36), nullable=True),
        sa.ForeignKeyConstraint(
            ["assigned_technician_id"], ["users.id"], ondelete="SET NULL"
        ),
        sa.UniqueConstraint("plate"),
    )
    op.create_index("ix_vehicles_id", "vehicles", ["id"])
    op.create_index("ix_vehicles_plate", "vehicles", ["plate"], unique=True)

    op.create_table(
        "checklist_sections",
        *audit_columns(),
        sa.Column("template_id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("order", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["template_id"], ["checklist_templates.id"], ondelete="CASCADE"
        ),
    )
    op.create_index("ix_checklist_sections_id", "checklist_sections", ["id"])

    op.create_table(
        "checklist_questions",
        *audit_columns(),
        sa.Column("section_id", sa.String(length=36), nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("is_required", sa.Boolean(), nullable=False),
        sa.Column("require_photo", sa.Boolean(), nullable=False),
        sa.Column("require_justification", sa.Boolean(), nullable=False),
        sa.Column("order", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["section_id"], ["checklist_sections.id"], ondelete="CASCADE"
        ),
    )
    op.create_index("ix_checklist_questions_id", "checklist_questions", ["id"])

    op.create_table(
        "inspections",
        *audit_columns(),
        sa.Column("client_generated_id", sa.String(length=36), nullable=False),
        sa.Column("template_id", sa.String(length=36), nullable=False),
        sa.Column("template_version", sa.String(length=10), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("vehicle_plate", sa.String(length=10), nullable=True),
        sa.Column("vehicle_model", sa.String(length=255), nullable=True),
        sa.Column("technician_name", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.UniqueConstraint("client_generated_id"),
    )
    op.create_index("ix_inspections_id", "inspections", ["id"])
    op.create_index(
        "ix_inspections_client_generated_id",
        "inspections",
        ["client_generated_id"],
        unique=True,
    )

    op.create_table(
        "inspection_answers",
        *audit_columns(),
        sa.Column("inspection_id", sa.String(length=36), nullable=False),
        sa.Column("question_id", sa.String(length=36), nullable=False),
        sa.Column("answer_value", sa.String(length=100), nullable=False),
        sa.ForeignKeyConstraint(
            ["inspection_id"], ["inspections.id"], ondelete="CASCADE"
        ),
    )
    op.create_index("ix_inspection_answers_id", "inspection_answers", ["id"])

    op.create_table(
        "evidences",
        *audit_columns(),
        sa.Column("inspection_id", sa.String(length=36), nullable=False),
        sa.Column("photo_url", sa.Text(), nullable=False),
        sa.Column("captured_at", sa.String(length=50), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(
            ["inspection_id"], ["inspections.id"], ondelete="CASCADE"
        ),
    )
    op.create_index("ix_evidences_id", "evidences", ["id"])

    op.create_table(
        "incidents",
        *audit_columns(),
        sa.Column("code", sa.String(length=20), nullable=False),
        sa.Column("inspection_id", sa.String(length=36), nullable=True),
        sa.Column("inspection_title", sa.String(length=255), nullable=False),
        sa.Column("context_type", sa.String(length=50), nullable=False),
        sa.Column("vehicle_plate", sa.String(length=10), nullable=True),
        sa.Column("vehicle_model", sa.String(length=255), nullable=True),
        sa.Column("technician_name", sa.String(length=255), nullable=False),
        sa.Column("team_name", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_incidents_id", "incidents", ["id"])
    op.create_index("ix_incidents_code", "incidents", ["code"], unique=True)

    op.create_table(
        "action_plans",
        *audit_columns(),
        sa.Column("incident_id", sa.String(length=36), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("assigned_to", sa.String(length=255), nullable=False),
        sa.Column("due_date", sa.String(length=50), nullable=False),
        sa.Column("created_by", sa.String(length=255), nullable=False),
        sa.Column("resolved_at", sa.String(length=50), nullable=True),
        sa.Column("resolution_notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ["incident_id"], ["incidents.id"], ondelete="CASCADE"
        ),
    )
    op.create_index("ix_action_plans_id", "action_plans", ["id"])

    op.create_table(
        "inspection_reports",
        *audit_columns(),
        sa.Column("inspection_id", sa.String(length=36), nullable=False),
        sa.Column("object_key", sa.Text(), nullable=False),
        sa.Column("sha256", sa.String(length=64), nullable=False),
        sa.Column("generated_by", sa.String(length=255), nullable=False),
        sa.Column("signature_object_key", sa.Text(), nullable=True),
        sa.UniqueConstraint("object_key"),
    )
    op.create_index("ix_inspection_reports_id", "inspection_reports", ["id"])
    op.create_index(
        "ix_inspection_reports_inspection_id",
        "inspection_reports",
        ["inspection_id"],
    )

    op.create_table(
        "apr_assessments",
        *audit_columns(),
        sa.Column("client_generated_id", sa.String(length=36), nullable=False),
        sa.Column("service_order_number", sa.String(length=50), nullable=False),
        sa.Column("activity_id", sa.String(length=36), nullable=False),
        sa.Column("activity_type", sa.String(length=50), nullable=False),
        sa.Column("location", sa.Text(), nullable=False),
        sa.Column("technician_id", sa.String(length=36), nullable=False),
        sa.Column("technician_name", sa.String(length=255), nullable=False),
        sa.Column("team_name", sa.String(length=255), nullable=False),
        sa.Column("planned_start", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("maximum_risk_level", sa.String(length=20), nullable=False),
        sa.Column("maximum_residual_risk_level", sa.String(length=20), nullable=False),
        sa.Column("hazards_json", sa.Text(), nullable=False),
        sa.Column("required_ppe_json", sa.Text(), nullable=False),
        sa.Column("technician_signature_json", sa.Text(), nullable=True),
        sa.Column("supervisor_signature_json", sa.Text(), nullable=True),
        sa.Column("authorization_notes", sa.Text(), nullable=True),
        sa.Column("authorized_by", sa.String(length=255), nullable=True),
        sa.Column("authorized_at", sa.String(length=50), nullable=True),
        sa.Column("can_start_activity", sa.Boolean(), nullable=False),
        sa.UniqueConstraint("client_generated_id"),
    )
    op.create_index("ix_apr_assessments_id", "apr_assessments", ["id"])
    op.create_index(
        "ix_apr_assessments_client_generated_id",
        "apr_assessments",
        ["client_generated_id"],
        unique=True,
    )
    op.create_index(
        "ix_apr_assessments_service_order_number",
        "apr_assessments",
        ["service_order_number"],
    )
    op.create_index(
        "ix_apr_assessments_activity_id", "apr_assessments", ["activity_id"]
    )
    op.create_index("ix_apr_assessments_status", "apr_assessments", ["status"])

    op.create_table(
        "apr_risks",
        *audit_columns(),
        sa.Column("apr_id", sa.String(length=36), nullable=False),
        sa.Column("hazard", sa.Text(), nullable=False),
        sa.Column("probability", sa.Integer(), nullable=False),
        sa.Column("severity", sa.Integer(), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("level", sa.String(length=20), nullable=False),
        sa.Column("controls", sa.Text(), nullable=False),
        sa.Column("residual_probability", sa.Integer(), nullable=False),
        sa.Column("residual_severity", sa.Integer(), nullable=False),
        sa.Column("residual_score", sa.Integer(), nullable=False),
        sa.Column("residual_level", sa.String(length=20), nullable=False),
    )
    op.create_index("ix_apr_risks_id", "apr_risks", ["id"])
    op.create_index("ix_apr_risks_apr_id", "apr_risks", ["apr_id"])


def downgrade() -> None:
    for table_name in [
        "apr_risks",
        "apr_assessments",
        "inspection_reports",
        "action_plans",
        "incidents",
        "evidences",
        "inspection_answers",
        "inspections",
        "checklist_questions",
        "checklist_sections",
        "vehicles",
        "checklist_templates",
        "users",
    ]:
        op.drop_table(table_name)
