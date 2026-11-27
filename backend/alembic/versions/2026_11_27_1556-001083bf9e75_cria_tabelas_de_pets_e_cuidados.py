"""cria tabelas de pets e cuidados

Revision ID: 001083bf9e75
Revises:
Create Date: 2026-11-27 15:56:29.454807

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001083bf9e75"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "pets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=60), nullable=False),
        sa.Column(
            "especie",
            sa.Enum(
                "cachorro",
                "gato",
                "outro",
                name="especie",
                native_enum=False,
                create_constraint=True,
            ),
            nullable=False,
        ),
        sa.Column("raca", sa.String(length=60), nullable=True),
        sa.Column("data_nascimento", sa.Date(), nullable=False),
        sa.Column("peso_kg", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column(
            "criado_em",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.CheckConstraint("peso_kg > 0 AND peso_kg <= 150", name=op.f("ck_pets_peso")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_pets")),
    )
    op.create_index(
        "uq_pets_nome_sem_caixa",
        "pets",
        [sa.literal_column("lower(nome)")],
        unique=True,
    )
    op.create_table(
        "cuidados",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("pet_id", sa.Integer(), nullable=False),
        sa.Column(
            "tipo",
            sa.Enum(
                "vacina",
                "vermifugo",
                "antipulgas",
                "banho",
                "consulta",
                "outro",
                name="tipo_cuidado",
                native_enum=False,
                create_constraint=True,
            ),
            nullable=False,
        ),
        sa.Column("data", sa.Date(), nullable=False),
        sa.Column("custo", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("descricao", sa.String(length=255), nullable=True),
        sa.Column("proxima_data", sa.Date(), nullable=True),
        sa.CheckConstraint(
            "tipo <> 'vacina' OR descricao IS NOT NULL",
            name=op.f("ck_cuidados_vacina_descricao"),
        ),
        sa.CheckConstraint("custo >= 0", name=op.f("ck_cuidados_custo")),
        sa.CheckConstraint(
            "proxima_data IS NULL OR proxima_data > data",
            name=op.f("ck_cuidados_proxima_data"),
        ),
        sa.ForeignKeyConstraint(
            ["pet_id"],
            ["pets.id"],
            name=op.f("fk_cuidados_pet_id_pets"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_cuidados")),
    )
    op.create_index(op.f("ix_cuidados_pet_id"), "cuidados", ["pet_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_cuidados_pet_id"), table_name="cuidados")
    op.drop_table("cuidados")
    op.drop_index("uq_pets_nome_sem_caixa", table_name="pets")
    op.drop_table("pets")
