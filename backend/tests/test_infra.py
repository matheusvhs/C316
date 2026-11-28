from collections.abc import Iterator

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.db.session import get_db
from backend.app.main import app

ORIGEM = settings.cors_origins[0]


def test_health_200(client: TestClient):
    resposta = client.get("/health")

    assert resposta.status_code == 200
    assert resposta.json() == {"status": "ok"}


def test_health_503_sem_banco(client: TestClient):
    banco_fora_do_ar = create_engine("postgresql+psycopg://x:x@127.0.0.1:1/x")

    def get_db_fora_do_ar() -> Iterator[Session]:
        with Session(banco_fora_do_ar) as sessao:
            yield sessao

    app.dependency_overrides[get_db] = get_db_fora_do_ar

    resposta = client.get("/health")

    assert resposta.status_code == 503
    assert resposta.json() == {"detail": "Banco de dados indisponível"}


@pytest.mark.parametrize("metodo", ["GET", "POST", "PUT", "DELETE"])
def test_cors_libera_os_metodos_usados(client: TestClient, metodo: str):
    resposta = client.options(
        "/pets/1",
        headers={
            "Origin": ORIGEM,
            "Access-Control-Request-Method": metodo,
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert resposta.status_code == 200
    assert resposta.headers["access-control-allow-origin"] == ORIGEM


def test_cors_recusa_origem_desconhecida(client: TestClient):
    resposta = client.options(
        "/pets",
        headers={
            "Origin": "http://desconhecida.example",
            "Access-Control-Request-Method": "DELETE",
        },
    )

    assert resposta.status_code == 400
    assert "access-control-allow-origin" not in resposta.headers


# O SQLite não reflete índices de expressão como lower(nome); no Postgres eles
# também são comparados.
@pytest.mark.filterwarnings("ignore:.*expression-based index")
def test_migracoes_refletem_os_models(engine: Engine, alembic_config: Config):
    command.check(alembic_config)
