import pytest
from fastapi.testclient import TestClient

from backend.app.main import app


@pytest.fixture
def client() -> TestClient:
    """Cliente HTTP de teste, reaproveitado por todos os testes da API."""
    with TestClient(app) as test_client:
        yield test_client
