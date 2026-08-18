"""add agent_code and awaiting_agent pot status

Revision ID: aa1ad06c955a
Revises: 0ffb5039d9d5
Create Date: 2026-08-10 03:59:08.913663

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'aa1ad06c955a'
down_revision: Union[str, Sequence[str], None] = '0ffb5039d9d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('agents', sa.Column('agent_code', sa.String(), nullable=True))
    op.create_unique_constraint('uq_agents_agent_code', 'agents', ['agent_code'])
    # NOTE: 'potstatus' is the default Postgres enum type name SQLAlchemy
    # generates for PotStatus (lowercased class name). If your enum was
    # given an explicit name elsewhere, swap it in below.
    op.execute("ALTER TYPE potstatus ADD VALUE IF NOT EXISTS 'awaiting_agent'")


def downgrade() -> None:
    # Postgres doesn't support removing enum values cleanly — leaving this
    # as a no-op. Dropping agent_code is safe to reverse though:
    op.drop_constraint('uq_agents_agent_code', 'agents', type_='unique')
    op.drop_column('agents', 'agent_code')