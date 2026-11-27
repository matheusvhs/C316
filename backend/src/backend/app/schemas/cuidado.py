from datetime import date
from decimal import Decimal
from enum import StrEnum
from typing import Annotated

from pydantic import (
    BaseModel,
    BeforeValidator,
    ConfigDict,
    Field,
    StringConstraints,
    ValidationInfo,
    field_validator,
)

from backend.app.models import TipoCuidado
from backend.app.schemas.comum import DataPassada, limpar_texto

Custo = Annotated[Decimal, Field(ge=0, max_digits=10, decimal_places=2)]

Descricao = Annotated[
    Annotated[str, StringConstraints(max_length=255)] | None,
    BeforeValidator(limpar_texto),
]


class CuidadoDados(BaseModel):
    tipo: TipoCuidado
    data: DataPassada
    custo: Custo
    descricao: Descricao = None
    proxima_data: date | None = None

    @field_validator("proxima_data")
    @classmethod
    def validar_proxima_data(
        cls, proxima_data: date | None, info: ValidationInfo
    ) -> date | None:
        data = info.data.get("data")
        if proxima_data is not None and data is not None and proxima_data <= data:
            raise ValueError("A próxima data deve ser depois da data do cuidado")
        return proxima_data


class CuidadoCreate(CuidadoDados):
    pass


class CuidadoUpdate(CuidadoDados):
    pass


class CuidadoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    pet_id: int
    tipo: TipoCuidado
    data: date
    custo: Decimal
    descricao: str | None
    proxima_data: date | None


class StatusAlerta(StrEnum):
    VENCIDO = "vencido"
    PROXIMO = "proximo"
    EM_DIA = "em_dia"


class Alerta(BaseModel):
    cuidado_id: int
    tipo: TipoCuidado
    descricao: str | None
    proxima_data: date
    dias_restantes: int
    status: StatusAlerta
