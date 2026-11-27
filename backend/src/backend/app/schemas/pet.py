from datetime import date, datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field, StringConstraints

from backend.app.models import Especie
from backend.app.schemas.comum import DataPassada, limpar_texto

NomePet = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=2, max_length=60)
]
Peso = Annotated[Decimal, Field(gt=0, le=150, max_digits=5, decimal_places=2)]

Raca = Annotated[
    Annotated[str, StringConstraints(max_length=60)] | None,
    BeforeValidator(limpar_texto),
]


class PetDados(BaseModel):
    nome: NomePet
    especie: Especie
    raca: Raca = None
    data_nascimento: DataPassada
    peso_kg: Peso


class PetCreate(PetDados):
    pass


class PetUpdate(PetDados):
    pass


class PetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    especie: Especie
    raca: str | None
    data_nascimento: date
    peso_kg: Decimal
    criado_em: datetime


class Idade(BaseModel):
    anos: int
    meses: int


class PetResumo(BaseModel):
    idade: Idade
    total_gasto: Decimal
    quantidade_cuidados: int
    ultimo_cuidado: date | None
