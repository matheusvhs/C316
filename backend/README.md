# Backend — C316

API em FastAPI, gerenciada com Poetry.

## Estrutura

```
backend/
├── src/backend/app/main.py   # aplicação FastAPI
├── tests/
│   ├── conftest.py           # fixtures compartilhadas
│   └── test_main.py          # testes da API
└── pyproject.toml
```

## Executando os testes

### Pré-requisito

Instale as dependências uma vez (inclui as de desenvolvimento, como o pytest):

```bash
make install
```

### Comandos

| Comando | O que faz |
| --- | --- |
| `make test` | Roda a suíte inteira |
| `make test-v` | Roda mostrando cada caso individualmente |
| `make test-k K=404` | Roda só os testes cujo nome casa com `K` |
| `make test PYTEST_ARGS="-x -q"` | Repassa flags arbitrárias ao pytest |

Saída esperada de `make test`:

```
collected 12 items

tests/test_main.py ............                                          [100%]

============================== 12 passed in 0.02s ==============================
```

### Sem o Makefile

Os alvos acima são atalhos para o Poetry. O equivalente direto é:

```bash
poetry -C backend install
poetry -C backend run pytest
```

Ou, de dentro de `backend/`:

```bash
poetry install
poetry run pytest
```

## O que é testado

São 6 funções de teste que geram 12 casos, por causa da parametrização:

| Teste | Verifica |
| --- | --- |
| `test_home_retorna_200` | `GET /` responde 200 |
| `test_home_retorna_mensagem_esperada` | corpo é `{"message": "Hello, World!"}` |
| `test_home_responde_em_json` | header `content-type` |
| `test_rotas_inexistentes_retornam_404` | 4 rotas desconhecidas retornam 404 |
| `test_metodos_nao_permitidos_na_home_retornam_405` | POST/PUT/PATCH/DELETE em `/` retornam 405 |
| `test_openapi_documenta_a_rota_home` | a rota aparece no schema OpenAPI |

A fixture `client`, em `tests/conftest.py`, entrega um `TestClient` do FastAPI
como context manager — assim o ciclo de vida da aplicação roda de verdade a
cada teste.

## Testes no CI

O workflow `.github/workflows/ci-backend.yml` roda a mesma suíte a cada `push`
e a cada `pull_request` que toque em `backend/**`. Ele configura o Python 3.14,
instala o Poetry e executa `poetry run pytest -v`.

Para acompanhar as execuções:

```bash
gh run list --workflow=ci-backend.yml
gh run watch
```
