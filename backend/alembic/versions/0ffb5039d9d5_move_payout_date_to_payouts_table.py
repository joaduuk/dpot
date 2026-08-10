"""move payout date to payouts table

Revision ID: 0ffb5039d9d5
Revises: 0faf139e69f7
Create Date: 2026-08-09 14:45:12.954812

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0ffb5039d9d5'
down_revision: Union[str, Sequence[str], None] = '0faf139e69f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('pots', 'payout_account_details')
    op.drop_column('pots', 'requested_payout_date')
    op.add_column('payouts', sa.Column('requested_payout_date', sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column('payouts', 'requested_payout_date')
    op.add_column('pots', sa.Column('requested_payout_date', sa.Date(), nullable=True))
    op.add_column('pots', sa.Column('payout_account_details', sa.String(), nullable=True))
