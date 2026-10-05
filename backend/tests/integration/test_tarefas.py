import pytest

NOVA_TAREFA = {"titulo": "Estudar FastAPI", "prioridade": "alta"}


@pytest.fixture
def tarefa(client) -> dict:
    """Uma tarefa já criada, para os testes que precisam de um id válido."""
    return client.post("/tarefas", json=NOVA_TAREFA).json()


# POST


def test_criar_tarefa_retorna_201_com_defaults(client):
    response = client.post("/tarefas", json=NOVA_TAREFA)

    assert response.status_code == 201
    body = response.json()
    assert body["id"] == 1
    assert body["titulo"] == "Estudar FastAPI"
    assert body["prioridade"] == "alta"
    assert body["concluida"] is False
    assert body["descricao"] is None


@pytest.mark.parametrize(
    "payload",
    [{}, {"titulo": ""}, {"titulo": "x", "prioridade": "urgente"}],
)
def test_criar_tarefa_invalida_retorna_422(client, payload):
    assert client.post("/tarefas", json=payload).status_code == 422


# GET


def test_listar_tarefas_vazia(client):
    response = client.get("/tarefas")

    assert response.status_code == 200
    assert response.json() == []


def test_obter_tarefa(client, tarefa):
    response = client.get(f"/tarefas/{tarefa['id']}")

    assert response.status_code == 200
    assert response.json() == tarefa


def test_listar_filtra_por_query_params(client):
    client.post("/tarefas", json={"titulo": "a", "concluida": True})
    client.post("/tarefas", json={"titulo": "b", "prioridade": "baixa"})
    client.post("/tarefas", json={"titulo": "c", "prioridade": "baixa"})

    concluidas = client.get("/tarefas", params={"concluida": True}).json()
    baixas = client.get("/tarefas", params={"prioridade": "baixa"}).json()

    assert [t["titulo"] for t in concluidas] == ["a"]
    assert [t["titulo"] for t in baixas] == ["b", "c"]


def test_listar_pagina_com_offset_e_limit(client):
    for i in range(5):
        client.post("/tarefas", json={"titulo": f"t{i}"})

    pagina = client.get("/tarefas", params={"offset": 1, "limit": 2}).json()

    assert [t["titulo"] for t in pagina] == ["t1", "t2"]


@pytest.mark.parametrize("params", [{"limit": 0}, {"limit": 101}, {"offset": -1}])
def test_listar_com_query_invalida_retorna_422(client, params):
    assert client.get("/tarefas", params=params).status_code == 422


# PUT


def test_substituir_tarefa(client, tarefa):
    response = client.put(
        f"/tarefas/{tarefa['id']}",
        json={"titulo": "Novo título", "concluida": True},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["titulo"] == "Novo título"
    assert body["concluida"] is True
    # PUT substitui tudo: campos omitidos voltam ao padrão.
    assert body["prioridade"] == "media"
    assert body["criada_em"] == tarefa["criada_em"]


def test_substituir_sem_titulo_retorna_422(client, tarefa):
    response = client.put(f"/tarefas/{tarefa['id']}", json={"concluida": True})

    assert response.status_code == 422


# PATCH


def test_atualizar_parcialmente_preserva_os_demais_campos(client, tarefa):
    response = client.patch(f"/tarefas/{tarefa['id']}", json={"concluida": True})

    assert response.status_code == 200
    body = response.json()
    assert body["concluida"] is True
    assert body["titulo"] == tarefa["titulo"]
    assert body["prioridade"] == tarefa["prioridade"]


def test_patch_aceita_descricao_nula(client):
    criada = client.post("/tarefas", json={"titulo": "x", "descricao": "y"}).json()

    response = client.patch(f"/tarefas/{criada['id']}", json={"descricao": None})

    assert response.status_code == 200
    assert response.json()["descricao"] is None


@pytest.mark.parametrize(
    "payload",
    [{"titulo": None}, {"concluida": None}, {"campo_inexistente": 1}],
)
def test_patch_invalido_retorna_422(client, tarefa, payload):
    assert client.patch(f"/tarefas/{tarefa['id']}", json=payload).status_code == 422


# DELETE


def test_remover_tarefa(client, tarefa):
    response = client.delete(f"/tarefas/{tarefa['id']}")

    assert response.status_code == 204
    assert response.content == b""
    assert client.get(f"/tarefas/{tarefa['id']}").status_code == 404


# Path parameter


@pytest.mark.parametrize(
    ("method", "kwargs"),
    [
        ("get", {}),
        ("put", {"json": NOVA_TAREFA}),
        ("patch", {"json": {"concluida": True}}),
        ("delete", {}),
    ],
)
def test_tarefa_inexistente_retorna_404(client, method, kwargs):
    response = getattr(client, method)("/tarefas/999", **kwargs)

    assert response.status_code == 404
    assert response.json() == {"detail": "Tarefa 999 não encontrada"}


@pytest.mark.parametrize("tarefa_id", ["0", "-1", "abc"])
def test_id_invalido_retorna_422(client, tarefa_id):
    assert client.get(f"/tarefas/{tarefa_id}").status_code == 422


def test_openapi_documenta_todos_os_metodos(client):
    paths = client.get("/openapi.json").json()["paths"]

    assert set(paths["/tarefas"]) == {"get", "post"}
    assert set(paths["/tarefas/{tarefa_id}"]) == {"get", "put", "patch", "delete"}
