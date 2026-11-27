from __future__ import annotations

from datetime import date
from decimal import Decimal
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Enum, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.models.base import Base

if TYPE_CHECKING:
    from backend.app.models.pet import Pet


class TipoCuidado(StrEnum):
    VACINA = "vacina"
    VERMIFUGO = "vermifugo"
    ANTIPULGAS = "antipulgas"
    BANHO = "banho"
    CONSULTA = "consulta"
    OUTRO = "outro"


class Cuidado(Base):
    __tablename__ = "cuidados"
    __table_args__ = (
        CheckConstraint("custo >= 0", name="custo"),
        CheckConstraint(
            "proxima_data IS NULL OR proxima_data > data", name="proxima_data"
        ),
        CheckConstraint(
            "tipo <> 'vacina' OR descricao IS NOT NULL", name="vacina_descricao"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    pet_id: Mapped[int] = mapped_column(
        ForeignKey("pets.id", ondelete="RESTRICT"), index=True
    )
    tipo: Mapped[TipoCuidado] = mapped_column(
        Enum(
            TipoCuidado,
            name="tipo_cuidado",
            native_enum=False,
            create_constraint=True,
            values_callable=lambda enum: [membro.value for membro in enum],
        )
    )
    data: Mapped[date]
    custo: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    descricao: Mapped[str | None] = mapped_column(String(255))
    proxima_data: Mapped[date | None]

    pet: Mapped[Pet] = relationship(back_populates="cuidados")
