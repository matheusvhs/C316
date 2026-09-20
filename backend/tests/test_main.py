import pytest


def test_home_retorna_200(client):
    response = client.get("/")

    assert response.status_code == 200


def test_home_retorna_mensagem_esperada(client):
    response = client.get("/")

    assert response.json() == {"message": "Hello, World!"}


def test_home_responde_em_json(client):
    response = client.get("/")

    assert response.headers["content-type"] == "application/json"


@pytest.mark.parametrize(
    "path",
    ["/inexistente", "/home", "/api/v1/usuarios", "/favicon.ico"],
)
def test_rotas_inexistentes_retornam_404(client, path):
    """Caso de erro: qualquer rota não registrada deve responder 404."""
    response = client.get(path)

    assert response.status_code == 404


@pytest.mark.parametrize("method", ["post", "put", "patch", "delete"])
def test_metodos_nao_permitidos_na_home_retornam_405(client, method):
    """Caso de erro: a home só aceita GET."""
    response = getattr(client, method)("/")

    assert response.status_code == 405


def test_openapi_documenta_a_rota_home(client):
    schema = client.get("/openapi.json").json()

    assert "/" in schema["paths"]
    assert "get" in schema["paths"]["/"]
