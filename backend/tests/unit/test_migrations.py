from alembic import command
from sqlalchemy import create_engine, inspect


def tabelas(database_url) -> set[str]:
    engine = create_engine(database_url)
    try:
        return set(inspect(engine).get_table_names()) - {"alembic_version"}
    finally:
        engine.dispose()


def test_upgrade_cria_e_downgrade_remove_a_tabela(alembic_config, database_url):
    command.upgrade(alembic_config, "head")
    assert tabelas(database_url) == {"tarefas"}

    command.downgrade(alembic_config, "base")
    assert tabelas(database_url) == set()


def test_migrations_batem_com_os_modelos(alembic_config):
    """Falha se algum modelo mudou sem uma migration correspondente."""
    command.upgrade(alembic_config, "head")
    try:
        command.check(alembic_config)
    finally:
        command.downgrade(alembic_config, "base")
