from datetime import datetime

from fastapi.testclient import TestClient
from sqlalchemy import text

from backend.app.main import app


def test_tarefa_sobrevive_a_reinicio_da_api(client, engine):
    """Simula reiniciar a API: fecha todas as conexões e abre um cliente novo."""
    criada = client.post("/tarefas", json={"titulo": "Persistente"}).json()

    engine.dispose()
    with TestClient(app) as novo_client:
        response = novo_client.get(f"/tarefas/{criada['id']}")

    assert response.status_code == 200
    assert response.json() == criada


def test_tarefa_fica_gravada_na_tabela(client, engine):
    criada = client.post(
        "/tarefas", json={"titulo": "No banco", "prioridade": "baixa"}
    ).json()

    with engine.connect() as conexao:
        linha = conexao.execute(
            text("SELECT titulo, prioridade, concluida FROM tarefas WHERE id = :id"),
            {"id": criada["id"]},
        ).one()

    assert tuple(linha) == ("No banco", "baixa", False)


def test_alteracoes_e_remocao_sao_persistidas(client, engine):
    tarefa = client.post("/tarefas", json={"titulo": "a"}).json()
    outra = client.post("/tarefas", json={"titulo": "b"}).json()

    client.patch(f"/tarefas/{tarefa['id']}", json={"concluida": True})
    client.delete(f"/tarefas/{outra['id']}")

    with engine.connect() as conexao:
        linhas = conexao.execute(
            text("SELECT id, concluida FROM tarefas ORDER BY id")
        ).all()

    assert [tuple(linha) for linha in linhas] == [(tarefa["id"], True)]


def test_datas_saem_em_utc(client):
    tarefa = client.post("/tarefas", json={"titulo": "x"}).json()

    criada_em = datetime.fromisoformat(tarefa["criada_em"])

    assert criada_em.utcoffset().total_seconds() == 0
