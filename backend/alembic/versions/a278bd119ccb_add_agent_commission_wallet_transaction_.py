"""add agent_commission wallet transaction reason

Revision ID: a278bd119ccb
Revises: aa1ad06c955a
Create Date: 2026-09-01 23:58:29.107903

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a278bd119ccb'
down_revision: Union[str, Sequence[str], None] = 'aa1ad06c955a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # NOTE: verify this is the actual Postgres enum type name for your
    # WalletTransactionReason column (SQLAlchemy's default is the class
    # name lowercased) — same caveat as the earlier awaiting_agent migration.
    op.execute("ALTER TYPE wallettransactionreason ADD VALUE IF NOT EXISTS 'agent_commission'")


def downgrade() -> None:
    pass  # Postgres doesn't support removing enum values cleanly
