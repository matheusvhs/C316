import pytest

from backend.app.repositories.tarefa import TarefaRepository
from backend.app.schemas.tarefa import (
    Prioridade,
    TarefaCreate,
    TarefaPatch,
    TarefaUpdate,
)


@pytest.fixture
def repo() -> TarefaRepository:
    return TarefaRepository()


def criar(repo: TarefaRepository, titulo: str = "t", **campos):
    return repo.criar(TarefaCreate(titulo=titulo, **campos))


def test_criar_gera_ids_sequenciais(repo):
    assert [criar(repo).id for _ in range(3)] == [1, 2, 3]


def test_criar_preenche_as_datas(repo):
    tarefa = criar(repo)

    assert tarefa.criada_em == tarefa.atualizada_em
    assert tarefa.criada_em.tzinfo is not None


def test_obter_inexistente_retorna_none(repo):
    assert repo.obter(1) is None


def test_listar_filtra_por_status_e_prioridade(repo):
    criar(repo, "a", concluida=True, prioridade=Prioridade.ALTA)
    criar(repo, "b", concluida=True)
    criar(repo, "c", prioridade=Prioridade.ALTA)

    def titulos(**filtros):
        return [t.titulo for t in repo.listar(**filtros)]

    assert titulos(concluida=True) == ["a", "b"]
    assert titulos(concluida=False) == ["c"]
    assert titulos(prioridade=Prioridade.ALTA) == ["a", "c"]
    assert titulos(concluida=True, prioridade=Prioridade.ALTA) == ["a"]


def test_listar_pagina_com_offset_e_limit(repo):
    for i in range(5):
        criar(repo, f"t{i}")

    assert [t.titulo for t in repo.listar(offset=3, limit=10)] == ["t3", "t4"]
    assert [t.titulo for t in repo.listar(offset=0, limit=2)] == ["t0", "t1"]


def test_substituir_troca_todos_os_campos(repo):
    original = criar(repo, "a", descricao="d", prioridade=Prioridade.ALTA)

    tarefa = repo.substituir(original.id, TarefaUpdate(titulo="b"))

    assert tarefa.titulo == "b"
    assert tarefa.descricao is None
    assert tarefa.prioridade is Prioridade.MEDIA
    assert tarefa.criada_em == original.criada_em
    assert tarefa.atualizada_em >= original.atualizada_em


def test_atualizar_parcial_preserva_os_demais_campos(repo):
    original = criar(repo, "a", descricao="d", prioridade=Prioridade.ALTA)

    tarefa = repo.atualizar_parcial(original.id, TarefaPatch(concluida=True))

    assert tarefa.concluida is True
    assert (tarefa.titulo, tarefa.descricao, tarefa.prioridade) == (
        "a",
        "d",
        Prioridade.ALTA,
    )
    assert repo.obter(original.id) == tarefa


@pytest.mark.parametrize(
    ("metodo", "dados"),
    [
        ("substituir", TarefaUpdate(titulo="x")),
        ("atualizar_parcial", TarefaPatch(concluida=True)),
    ],
)
def test_atualizar_inexistente_retorna_none(repo, metodo, dados):
    assert getattr(repo, metodo)(99, dados) is None


def test_remover(repo):
    tarefa = criar(repo)

    assert repo.remover(tarefa.id) is True
    assert repo.obter(tarefa.id) is None
    assert repo.remover(tarefa.id) is False


def test_ids_nao_sao_reaproveitados_apos_remocao(repo):
    repo.remover(criar(repo).id)

    assert criar(repo).id == 2
