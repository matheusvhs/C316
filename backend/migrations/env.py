from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool

from backend.app.core.config import DATABASE_URL
from backend.app.database import Base
from backend.app.models import TarefaModel  # noqa: F401  (registra a tabela)

config = context.config

# Os testes passam a URL do banco deles por aqui; no resto, vale DATABASE_URL.
url = config.attributes.get("url", DATABASE_URL)

# Quando chamado pelos testes, não mexe na configuração de logs do pytest.
if config.config_file_name and config.attributes.get("configure_logger", True):
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Gera o SQL sem conectar (`alembic upgrade head --sql`)."""
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    engine = create_engine(url, poolclass=pool.NullPool)
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
    engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
