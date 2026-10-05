from pathlib import Path

import pytest

TESTS_DIR = Path(__file__).parent
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
