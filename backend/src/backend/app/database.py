from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from backend.app.core.config import DATABASE_URL


class Base(DeclarativeBase):
    """Base de todos os modelos; o Alembic compara as migrations com ela."""


# A conexão só é aberta na primeira consulta, não no import.
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """Dependência do FastAPI: uma sessão por requisição.

    A sessão é sempre fechada no fim; se a requisição falhar, o que não foi
    confirmado é desfeito.
    """
    with SessionLocal() as session:
        try:
            yield session
        except Exception:
            session.rollback()
            raise
