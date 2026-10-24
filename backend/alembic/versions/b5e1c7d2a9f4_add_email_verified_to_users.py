"""add email_verified to users

Revision ID: b5e1c7d2a9f4
Revises: a278bd119ccb
Create Date: 2026-10-24 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b5e1c7d2a9f4'
down_revision: Union[str, Sequence[str], None] = 'a278bd119ccb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('email_verified', sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        'users',
        sa.Column('email_verification_sent_at', sa.DateTime(), nullable=True),
    )
    # Everyone who signed up before confirmation existed keeps logging in
    # as normal — treat them all as already verified.
    op.execute("UPDATE users SET email_verified = true")


def downgrade() -> None:
    op.drop_column('users', 'email_verification_sent_at')
    op.drop_column('users', 'email_verified')
