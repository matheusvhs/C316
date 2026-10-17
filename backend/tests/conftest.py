import os
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

TESTS_DIR = Path(__file__).parent
BACKEND_DIR = TESTS_DIR.parent
SUITES = ("unit", "integration")


def pytest_collection_modifyitems(config, items):
    """Marca cada teste com a suíte da pasta onde ele está.

    Assim `pytest -m unit` e `pytest -m integration` funcionam sem marcar
    teste por teste. Um teste fora de `unit/` ou `integration/` ficaria de
    fora das duas execuções do CI, então a coleta falha nesse caso.
    """
    for item in items:
        suite = item.path.relative_to(TESTS_DIR).parts[0]
        if suite not in SUITES:
            raise pytest.UsageError(
                f"{item.nodeid}: todo teste deve ficar em tests/unit/ ou "
                "tests/integration/"
            )
        item.add_marker(getattr(pytest.mark, suite))


@pytest.fixture
def database_url(tmp_path) -> str:
    """Banco usado pelo teste.

    Por padrão é um SQLite novo em uma pasta temporária. Com
    TEST_DATABASE_URL, a suíte roda num Postgres; ele deve ser um banco só de
    testes, porque as tabelas são apagadas ao fim de cada teste.
    """
    return os.getenv("TEST_DATABASE_URL") or f"sqlite:///{tmp_path / 'test.db'}"


@pytest.fixture
def alembic_config(database_url) -> Config:
    config = Config(BACKEND_DIR / "alembic.ini")
    config.attributes["url"] = database_url
    config.attributes["configure_logger"] = False
    return config


@pytest.fixture
def engine(alembic_config, database_url):
    """Cria as tabelas com as migrations reais e as remove no fim do teste."""
    command.upgrade(alembic_config, "head")
    engine = create_engine(database_url)
    yield engine
    engine.dispose()
    command.downgrade(alembic_config, "base")


@pytest.fixture
def session_factory(engine) -> sessionmaker:
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


@pytest.fixture
def session(session_factory):
    with session_factory() as session:
        yield session
