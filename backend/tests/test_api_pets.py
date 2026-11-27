from fastapi.testclient import TestClient

from tests.fabricas import dados_cuidado, dados_pet


def criar_pet(client: TestClient, **campos: object) -> dict:
    resposta = client.post("/pets", json=dados_pet(**campos))
    assert resposta.status_code == 201
    return resposta.json()


def test_criar_pet_201(client: TestClient):
    resposta = client.post("/pets", json=dados_pet(nome=" Rex ", raca="SRD"))

    assert resposta.status_code == 201
    corpo = resposta.json()
    assert corpo["id"] > 0
    assert corpo["nome"] == "Rex"
    assert corpo["raca"] == "SRD"
    assert corpo["peso_kg"] == "12.50"
    assert corpo["criado_em"]


def test_obter_pet_200(client: TestClient):
    pet = criar_pet(client)

    resposta = client.get(f"/pets/{pet['id']}")

    assert resposta.status_code == 200
    assert resposta.json() == pet


def test_obter_pet_inexistente_404(client: TestClient):
    resposta = client.get("/pets/999")

    assert resposta.status_code == 404
    assert resposta.json() == {"detail": "Pet não encontrado"}


def test_listar_com_busca_e_filtro(client: TestClient):
    criar_pet(client, nome="Rex")
    criar_pet(client, nome="Rexona", especie="gato")
    criar_pet(client, nome="Bob")

    todos = client.get("/pets").json()
    busca = client.get("/pets", params={"busca": "rex"}).json()
    gatos = client.get("/pets", params={"especie": "gato"}).json()
    combinado = client.get("/pets", params={"busca": "re", "especie": "cachorro"})

    assert [p["nome"] for p in todos] == ["Bob", "Rex", "Rexona"]
    assert [p["nome"] for p in busca] == ["Rex", "Rexona"]
    assert [p["nome"] for p in gatos] == ["Rexona"]
    assert [p["nome"] for p in combinado.json()] == ["Rex"]


def test_filtro_com_especie_invalida_422(client: TestClient):
    resposta = client.get("/pets", params={"especie": "peixe"})

    assert resposta.status_code == 422
    assert resposta.json()["erros"] == [
        {"campo": "especie", "mensagem": "Escolha uma opção válida"}
    ]


def test_atualizar_pet_200(client: TestClient):
    pet = criar_pet(client)

    resposta = client.put(
        f"/pets/{pet['id']}", json=dados_pet(peso_kg="14.25", raca="Labrador")
    )

    assert resposta.status_code == 200
    assert resposta.json()["peso_kg"] == "14.25"
    assert resposta.json()["raca"] == "Labrador"
    assert client.get(f"/pets/{pet['id']}").json()["peso_kg"] == "14.25"


def test_atualizar_pet_inexistente_404(client: TestClient):
    assert client.put("/pets/999", json=dados_pet()).status_code == 404


def test_nome_repetido_409(client: TestClient):
    criar_pet(client, nome="Rex")
    mia = criar_pet(client, nome="Mia", especie="gato")

    ao_criar = client.post("/pets", json=dados_pet(nome="REX"))
    ao_editar = client.put(f"/pets/{mia['id']}", json=dados_pet(nome="rex"))

    for resposta in (ao_criar, ao_editar):
        assert resposta.status_code == 409
        assert resposta.json() == {"detail": "Já existe um pet com este nome"}


def test_validacao_422_em_portugues(client: TestClient):
    resposta = client.post(
        "/pets", json=dados_pet(nome="R", especie="peixe", peso_kg="0")
    )

    assert resposta.status_code == 422
    corpo = resposta.json()
    assert corpo["erros"] == [
        {"campo": "nome", "mensagem": "Deve ter pelo menos 2 caracteres"},
        {"campo": "especie", "mensagem": "Escolha uma opção válida"},
        {"campo": "peso_kg", "mensagem": "Deve ser maior que 0"},
    ]
    assert corpo["detail"].startswith("Nome: Deve ter pelo menos 2 caracteres")


def test_campos_obrigatorios_422(client: TestClient):
    resposta = client.post("/pets", json={})

    assert resposta.status_code == 422
    assert {e["campo"] for e in resposta.json()["erros"]} == {
        "nome",
        "especie",
        "data_nascimento",
        "peso_kg",
    }


def test_json_invalido_422(client: TestClient):
    resposta = client.post(
        "/pets", content="{", headers={"Content-Type": "application/json"}
    )

    assert resposta.status_code == 422
    assert resposta.json()["erros"] == [{"campo": "corpo", "mensagem": "JSON inválido"}]


def test_id_nao_numerico_422(client: TestClient):
    resposta = client.get("/pets/abc")

    assert resposta.status_code == 422
    assert resposta.json()["erros"][0]["campo"] == "pet_id"


def test_remover_pet_204(client: TestClient):
    pet = criar_pet(client)

    resposta = client.delete(f"/pets/{pet['id']}")

    assert resposta.status_code == 204
    assert resposta.content == b""
    assert client.get(f"/pets/{pet['id']}").status_code == 404


def test_remover_pet_com_cuidados_409(client: TestClient):
    pet = criar_pet(client)
    client.post(f"/pets/{pet['id']}/cuidados", json=dados_cuidado())

    resposta = client.delete(f"/pets/{pet['id']}")

    assert resposta.status_code == 409
    assert resposta.json() == {"detail": "Exclua os cuidados antes de remover o pet"}


def test_remover_pet_inexistente_404(client: TestClient):
    assert client.delete("/pets/999").status_code == 404


def test_editar_nascimento_depois_de_cuidado_422(client: TestClient):
    pet = criar_pet(client, data_nascimento="2020-01-15")
    client.post(f"/pets/{pet['id']}/cuidados", json=dados_cuidado(data="2020-03-01"))

    resposta = client.put(
        f"/pets/{pet['id']}", json=dados_pet(data_nascimento="2020-04-01")
    )

    assert resposta.status_code == 422
    assert resposta.json() == {
        "detail": "O cuidado não pode ser anterior ao nascimento do pet"
    }


def test_resumo_200(client: TestClient):
    pet = criar_pet(client)
    client.post(
        f"/pets/{pet['id']}/cuidados", json=dados_cuidado(data="2024-01-10", custo="30")
    )
    client.post(
        f"/pets/{pet['id']}/cuidados",
        json=dados_cuidado(data="2024-02-10", custo="12.40"),
    )

    resposta = client.get(f"/pets/{pet['id']}/resumo")

    assert resposta.status_code == 200
    corpo = resposta.json()
    assert set(corpo["idade"]) == {"anos", "meses"}
    assert corpo["total_gasto"] == "42.40"
    assert corpo["quantidade_cuidados"] == 2
    assert corpo["ultimo_cuidado"] == "2024-02-10"


def test_resumo_pet_inexistente_404(client: TestClient):
    assert client.get("/pets/999/resumo").status_code == 404
