import os
from collections.abc import Iterator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from backend.app.db.session import get_db
from backend.app.main import app
from backend.app.services import CuidadoService, PetService

ALEMBIC_INI = Path(__file__).resolve().parents[1] / "alembic.ini"


@pytest.fixture
def database_url(tmp_path: Path) -> str:
    # Com TEST_DATABASE_URL, as tabelas são apagadas ao fim de cada teste: use um
    # banco exclusivo para testes.
    return os.getenv("TEST_DATABASE_URL") or f"sqlite:///{tmp_path / 'teste.db'}"


@pytest.fixture
def alembic_config(database_url: str) -> Config:
    config = Config(str(ALEMBIC_INI))
    config.set_main_option("sqlalchemy.url", database_url)
    return config


@pytest.fixture
def engine(database_url: str, alembic_config: Config) -> Iterator[Engine]:
    command.upgrade(alembic_config, "head")
    engine = create_engine(database_url)
    yield engine
    engine.dispose()
    command.downgrade(alembic_config, "base")


@pytest.fixture
def fabrica_de_sessoes(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


@pytest.fixture
def sessao(fabrica_de_sessoes: sessionmaker[Session]) -> Iterator[Session]:
    with fabrica_de_sessoes() as sessao:
        yield sessao


@pytest.fixture
def pet_service(sessao: Session) -> PetService:
    return PetService(sessao)


@pytest.fixture
def cuidado_service(sessao: Session) -> CuidadoService:
    return CuidadoService(sessao)


@pytest.fixture
def client(fabrica_de_sessoes: sessionmaker[Session]) -> Iterator[TestClient]:
    def get_db_de_teste() -> Iterator[Session]:
        with fabrica_de_sessoes() as sessao:
            yield sessao

    app.dependency_overrides[get_db] = get_db_de_teste
    try:
        with TestClient(app) as cliente:
            yield cliente
    finally:
        app.dependency_overrides.clear()
