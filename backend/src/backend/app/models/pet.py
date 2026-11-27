from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, Enum, Index, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.models.base import Base

if TYPE_CHECKING:
    from backend.app.models.cuidado import Cuidado


class Especie(StrEnum):
    CACHORRO = "cachorro"
    GATO = "gato"
    OUTRO = "outro"


class Pet(Base):
    __tablename__ = "pets"
    __table_args__ = (CheckConstraint("peso_kg > 0 AND peso_kg <= 150", name="peso"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(60))
    especie: Mapped[Especie] = mapped_column(
        Enum(
            Especie,
            name="especie",
            native_enum=False,
            create_constraint=True,
            values_callable=lambda enum: [membro.value for membro in enum],
        )
    )
    raca: Mapped[str | None] = mapped_column(String(60))
    data_nascimento: Mapped[date]
    peso_kg: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    cuidados: Mapped[list[Cuidado]] = relationship(back_populates="pet")


Index("uq_pets_nome_sem_caixa", func.lower(Pet.nome), unique=True)
