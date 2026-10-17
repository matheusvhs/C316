from datetime import UTC, datetime
from typing import Annotated

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.tarefa import TarefaModel
from backend.app.schemas.tarefa import (
    Prioridade,
    Tarefa,
    TarefaCreate,
    TarefaPatch,
    TarefaUpdate,
)


class TarefaRepository:
    """Guarda as tarefas no banco, usando a sessão da requisição."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def listar(
        self,
        concluida: bool | None = None,
        prioridade: Prioridade | None = None,
        offset: int = 0,
        limit: int = 10,
    ) -> list[Tarefa]:
        consulta = select(TarefaModel).order_by(TarefaModel.id)
        if concluida is not None:
            consulta = consulta.where(TarefaModel.concluida == concluida)
        if prioridade is not None:
            consulta = consulta.where(TarefaModel.prioridade == prioridade)
        modelos = self._session.scalars(consulta.offset(offset).limit(limit))
        return [Tarefa.model_validate(m) for m in modelos]

    def obter(self, tarefa_id: int) -> Tarefa | None:
        modelo = self._session.get(TarefaModel, tarefa_id)
        return None if modelo is None else Tarefa.model_validate(modelo)

    def criar(self, dados: TarefaCreate) -> Tarefa:
        agora = datetime.now(UTC)
        modelo = TarefaModel(**dados.model_dump(), criada_em=agora, atualizada_em=agora)
        self._session.add(modelo)
        self._session.commit()
        return Tarefa.model_validate(modelo)

    def substituir(self, tarefa_id: int, dados: TarefaUpdate) -> Tarefa | None:
        return self._atualizar(tarefa_id, dados.model_dump())

    def atualizar_parcial(self, tarefa_id: int, dados: TarefaPatch) -> Tarefa | None:
        return self._atualizar(tarefa_id, dados.model_dump(exclude_unset=True))

    def remover(self, tarefa_id: int) -> bool:
        modelo = self._session.get(TarefaModel, tarefa_id)
        if modelo is None:
            return False
        self._session.delete(modelo)
        self._session.commit()
        return True

    def _atualizar(self, tarefa_id: int, campos: dict) -> Tarefa | None:
        modelo = self._session.get(TarefaModel, tarefa_id)
        if modelo is None:
            return None
        for campo, valor in {**campos, "atualizada_em": datetime.now(UTC)}.items():
            setattr(modelo, campo, valor)
        self._session.commit()
        return Tarefa.model_validate(modelo)


def get_tarefa_repository(
    session: Annotated[Session, Depends(get_db)],
) -> TarefaRepository:
    """Dependência do FastAPI: um repositório ligado à sessão da requisição."""
    return TarefaRepository(session)
