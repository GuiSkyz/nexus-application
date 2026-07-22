"""initial_sys_metadata

Revision ID: a1b2c3d4e5f6
Revises: 
Create Date: 2026-07-22 16:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'sys_metadata',
        sa.Column('id', sa.String(length=36), nullable=False, comment='Chave primária no padrão UUIDv4 string'),
        sa.Column('key', sa.String(length=100), nullable=False, comment='Chave de identificação do metadado do sistema'),
        sa.Column('value', sa.Text(), nullable=False, comment='Valor em texto ou JSON estruturado do metadado'),
        sa.Column('description', sa.String(length=255), nullable=True, comment='Descrição opcional para auditoria ou documentação do metadado'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sys_metadata_id'), 'sys_metadata', ['id'], unique=False)
    op.create_index(op.f('ix_sys_metadata_key'), 'sys_metadata', ['key'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_sys_metadata_key'), table_name='sys_metadata')
    op.drop_index(op.f('ix_sys_metadata_id'), table_name='sys_metadata')
    op.drop_table('sys_metadata')
