from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, model_validator


class Prioridade(StrEnum):
    BAIXA = "baixa"
    MEDIA = "media"
    ALTA = "alta"


class TarefaBase(BaseModel):
    titulo: str = Field(min_length=1, max_length=120, examples=["Estudar FastAPI"])
    descricao: str | None = Field(default=None, max_length=500)
    prioridade: Prioridade = Prioridade.MEDIA
    concluida: bool = False


class TarefaCreate(TarefaBase):
    """Corpo do POST: cria uma tarefa nova."""


class TarefaUpdate(TarefaBase):
    """Corpo do PUT: substitui a tarefa inteira."""


class TarefaPatch(BaseModel):
    """Corpo do PATCH: só os campos enviados são alterados."""

    model_config = ConfigDict(extra="forbid")

    titulo: str | None = Field(default=None, min_length=1, max_length=120)
    descricao: str | None = Field(default=None, max_length=500)
    prioridade: Prioridade | None = None
    concluida: bool | None = None

    @model_validator(mode="after")
    def rejeitar_nulos_obrigatorios(self):
        # Só `descricao` aceita null; nos demais, null apagaria um campo obrigatório.
        for campo in ("titulo", "prioridade", "concluida"):
            if campo in self.model_fields_set and getattr(self, campo) is None:
                raise ValueError(f"{campo} não pode ser null")
        return self


class Tarefa(TarefaBase):
    """Representação devolvida pela API."""

    id: int
    criada_em: datetime
    atualizada_em: datetime
