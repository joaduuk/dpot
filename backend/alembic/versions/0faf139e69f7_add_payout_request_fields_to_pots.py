"""add payout request fields to pots

Revision ID: 0faf139e69f7
Revises: 4c20d7299509
Create Date: 2026-08-09 06:12:17.686095

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0faf139e69f7'
down_revision: Union[str, Sequence[str], None] = '4c20d7299509'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('pots', sa.Column('requested_payout_date', sa.Date(), nullable=True))
    op.add_column('pots', sa.Column('payout_account_details', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('pots', 'payout_account_details')
    op.drop_column('pots', 'requested_payout_date')