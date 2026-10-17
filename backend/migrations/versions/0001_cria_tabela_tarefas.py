"""Cria a tabela de tarefas.

Revision ID: 0001
Revises:
Create Date: 2026-10-17
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "tarefas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("titulo", sa.String(length=120), nullable=False),
        sa.Column("descricao", sa.String(length=500), nullable=True),
        sa.Column(
            "prioridade",
            sa.Enum(
                "baixa",
                "media",
                "alta",
                name="prioridade",
                native_enum=False,
                create_constraint=True,
                length=5,
            ),
            nullable=False,
        ),
        sa.Column("concluida", sa.Boolean(), nullable=False),
        sa.Column("criada_em", sa.DateTime(timezone=True), nullable=False),
        sa.Column("atualizada_em", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sqlite_autoincrement=True,
    )


def downgrade() -> None:
    op.drop_table("tarefas")
