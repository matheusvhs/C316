from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response, status

from backend.app.repositories.tarefa import TarefaRepository, get_tarefa_repository
from backend.app.schemas.tarefa import (
    Prioridade,
    Tarefa,
    TarefaCreate,
    TarefaPatch,
    TarefaUpdate,
)

router = APIRouter(prefix="/tarefas", tags=["tarefas"])

Repo = Annotated[TarefaRepository, Depends(get_tarefa_repository)]
TarefaId = Annotated[int, Path(ge=1, description="Identificador da tarefa")]


def _nao_encontrada(tarefa_id: int) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Tarefa {tarefa_id} não encontrada",
    )


@router.get("", response_model=list[Tarefa])
def listar_tarefas(
    repo: Repo,
    concluida: Annotated[bool | None, Query(description="Filtra pelo status")] = None,
    prioridade: Annotated[Prioridade | None, Query()] = None,
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
):
    return repo.listar(
        concluida=concluida, prioridade=prioridade, offset=offset, limit=limit
    )


@router.get("/{tarefa_id}", response_model=Tarefa)
def obter_tarefa(tarefa_id: TarefaId, repo: Repo):
    tarefa = repo.obter(tarefa_id)
    if tarefa is None:
        raise _nao_encontrada(tarefa_id)
    return tarefa


@router.post("", response_model=Tarefa, status_code=status.HTTP_201_CREATED)
def criar_tarefa(dados: TarefaCreate, repo: Repo):
    return repo.criar(dados)


@router.put("/{tarefa_id}", response_model=Tarefa)
def substituir_tarefa(tarefa_id: TarefaId, dados: TarefaUpdate, repo: Repo):
    tarefa = repo.substituir(tarefa_id, dados)
    if tarefa is None:
        raise _nao_encontrada(tarefa_id)
    return tarefa


@router.patch("/{tarefa_id}", response_model=Tarefa)
def atualizar_tarefa(tarefa_id: TarefaId, dados: TarefaPatch, repo: Repo):
    tarefa = repo.atualizar_parcial(tarefa_id, dados)
    if tarefa is None:
        raise _nao_encontrada(tarefa_id)
    return tarefa


@router.delete("/{tarefa_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_tarefa(tarefa_id: TarefaId, repo: Repo):
    if not repo.remover(tarefa_id):
        raise _nao_encontrada(tarefa_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
