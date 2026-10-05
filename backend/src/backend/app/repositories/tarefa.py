from datetime import UTC, datetime
from itertools import count

from backend.app.schemas.tarefa import (
    Prioridade,
    Tarefa,
    TarefaCreate,
    TarefaPatch,
    TarefaUpdate,
)


class TarefaRepository:
    """Armazena as tarefas em memória."""

    def __init__(self) -> None:
        self._tarefas: dict[int, Tarefa] = {}
        self._ids = count(1)

    def listar(
        self,
        concluida: bool | None = None,
        prioridade: Prioridade | None = None,
        offset: int = 0,
        limit: int = 10,
    ) -> list[Tarefa]:
        tarefas = [
            t
            for t in self._tarefas.values()
            if (concluida is None or t.concluida == concluida)
            and (prioridade is None or t.prioridade == prioridade)
        ]
        return tarefas[offset : offset + limit]

    def obter(self, tarefa_id: int) -> Tarefa | None:
        return self._tarefas.get(tarefa_id)

    def criar(self, dados: TarefaCreate) -> Tarefa:
        agora = datetime.now(UTC)
        tarefa = Tarefa(
            id=next(self._ids),
            criada_em=agora,
            atualizada_em=agora,
            **dados.model_dump(),
        )
        self._tarefas[tarefa.id] = tarefa
        return tarefa

    def substituir(self, tarefa_id: int, dados: TarefaUpdate) -> Tarefa | None:
        return self._atualizar(tarefa_id, dados.model_dump())

    def atualizar_parcial(self, tarefa_id: int, dados: TarefaPatch) -> Tarefa | None:
        return self._atualizar(tarefa_id, dados.model_dump(exclude_unset=True))

    def remover(self, tarefa_id: int) -> bool:
        return self._tarefas.pop(tarefa_id, None) is not None

    def _atualizar(self, tarefa_id: int, campos: dict) -> Tarefa | None:
        atual = self._tarefas.get(tarefa_id)
        if atual is None:
            return None
        tarefa = atual.model_copy(update={**campos, "atualizada_em": datetime.now(UTC)})
        self._tarefas[tarefa_id] = tarefa
        return tarefa


_repository = TarefaRepository()


def get_tarefa_repository() -> TarefaRepository:
    """Dependência do FastAPI; os testes a sobrescrevem com um repositório novo."""
    return _repository
