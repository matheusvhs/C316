import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.repositories.tarefa import TarefaRepository, get_tarefa_repository


@pytest.fixture
def client() -> TestClient:
    """Cliente HTTP de teste, reaproveitado por todos os testes da API.

    Cada teste recebe um repositório de tarefas vazio, para não haver
    vazamento de estado entre os casos.
    """
    repo = TarefaRepository()
    app.dependency_overrides[get_tarefa_repository] = lambda: repo
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
