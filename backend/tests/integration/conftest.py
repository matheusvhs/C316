import pytest
from fastapi.testclient import TestClient

from backend.app.database import get_db
from backend.app.main import app


@pytest.fixture
def client(session_factory) -> TestClient:
    """Cliente HTTP de teste, reaproveitado por todos os testes da API.

    Troca a sessão da aplicação por uma ligada ao banco do teste, que começa
    vazio a cada caso; assim nenhum teste enxerga dados de outro e o banco da
    aplicação nunca é tocado.
    """

    def get_test_db():
        with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = get_test_db
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()
