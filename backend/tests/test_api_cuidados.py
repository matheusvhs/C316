from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from tests.fabricas import dados_cuidado, dados_pet

ANTES_DO_NASCIMENTO = "O cuidado não pode ser anterior ao nascimento do pet"


@pytest.fixture
def pet_id(client: TestClient) -> int:
    return client.post("/pets", json=dados_pet()).json()["id"]


def criar_cuidado(client: TestClient, pet_id: int, **campos: object) -> dict:
    resposta = client.post(f"/pets/{pet_id}/cuidados", json=dados_cuidado(**campos))
    assert resposta.status_code == 201
    return resposta.json()


def test_criar_cuidado_201(client: TestClient, pet_id: int):
    resposta = client.post(
        f"/pets/{pet_id}/cuidados",
        json=dados_cuidado(tipo="vacina", descricao="V10", custo="120"),
    )

    assert resposta.status_code == 201
    corpo = resposta.json()
    assert corpo["pet_id"] == pet_id
    assert corpo["tipo"] == "vacina"
    assert corpo["custo"] == "120.00"


def test_criar_cuidado_para_pet_inexistente_404(client: TestClient):
    resposta = client.post("/pets/999/cuidados", json=dados_cuidado())

    assert resposta.status_code == 404
    assert resposta.json() == {"detail": "Pet não encontrado"}


@pytest.mark.parametrize(
    ("campos", "mensagem"),
    [
        ({"tipo": "vacina"}, "Informe o nome da vacina"),
        ({"data": "2019-12-31"}, ANTES_DO_NASCIMENTO),
    ],
    ids=["regra_4", "regra_2"],
)
def test_regras_de_negocio_422(
    client: TestClient, pet_id: int, campos: dict, mensagem: str
):
    resposta = client.post(f"/pets/{pet_id}/cuidados", json=dados_cuidado(**campos))

    assert resposta.status_code == 422
    assert resposta.json() == {"detail": mensagem}


def test_regra_3_proxima_data_422(client: TestClient, pet_id: int):
    resposta = client.post(
        f"/pets/{pet_id}/cuidados",
        json=dados_cuidado(data="2024-03-10", proxima_data="2024-03-10"),
    )

    assert resposta.status_code == 422
    assert resposta.json()["erros"] == [
        {
            "campo": "proxima_data",
            "mensagem": "A próxima data deve ser depois da data do cuidado",
        }
    ]


def test_listar_cuidados_com_filtro_por_tipo(client: TestClient, pet_id: int):
    criar_cuidado(client, pet_id, tipo="banho", data="2024-01-10")
    criar_cuidado(client, pet_id, tipo="vacina", descricao="V10", data="2024-02-01")
    criar_cuidado(client, pet_id, tipo="vacina", descricao="Gripe", data="2024-06-01")

    todos = client.get(f"/pets/{pet_id}/cuidados").json()
    vacinas = client.get(f"/pets/{pet_id}/cuidados", params={"tipo": "vacina"}).json()

    assert [c["data"] for c in todos] == ["2024-06-01", "2024-02-01", "2024-01-10"]
    assert [c["descricao"] for c in vacinas] == ["Gripe", "V10"]


def test_listar_cuidados_de_pet_inexistente_404(client: TestClient):
    assert client.get("/pets/999/cuidados").status_code == 404


def test_atualizar_cuidado_200(client: TestClient, pet_id: int):
    cuidado = criar_cuidado(client, pet_id)

    resposta = client.put(
        f"/cuidados/{cuidado['id']}",
        json=dados_cuidado(tipo="consulta", custo="150", descricao="Check-up"),
    )

    assert resposta.status_code == 200
    assert resposta.json()["tipo"] == "consulta"
    assert resposta.json()["descricao"] == "Check-up"


def test_atualizar_cuidado_inexistente_404(client: TestClient):
    resposta = client.put("/cuidados/999", json=dados_cuidado())

    assert resposta.status_code == 404
    assert resposta.json() == {"detail": "Cuidado não encontrado"}


def test_remover_cuidado_204(client: TestClient, pet_id: int):
    cuidado = criar_cuidado(client, pet_id)

    assert client.delete(f"/cuidados/{cuidado['id']}").status_code == 204
    assert client.get(f"/pets/{pet_id}/cuidados").json() == []
    assert client.delete(f"/cuidados/{cuidado['id']}").status_code == 404


def test_alertas_200(client: TestClient, pet_id: int):
    hoje = date.today()
    criar_cuidado(
        client,
        pet_id,
        tipo="vermifugo",
        data=hoje.isoformat(),
        proxima_data=(hoje + timedelta(days=3)).isoformat(),
    )

    resposta = client.get(f"/pets/{pet_id}/alertas")

    assert resposta.status_code == 200
    [alerta] = resposta.json()
    assert alerta["tipo"] == "vermifugo"
    assert alerta["dias_restantes"] == 3
    assert alerta["status"] == "proximo"


def test_alertas_de_pet_inexistente_404(client: TestClient):
    assert client.get("/pets/999/alertas").status_code == 404
