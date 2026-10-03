# Backend — C316

API em FastAPI, gerenciada com Poetry.

## Estrutura

```
backend/
├── src/backend/app/
│   ├── main.py               # só cria o app e registra os routers
│   ├── routers/
│   │   ├── home.py           # GET /
│   │   └── tarefas.py        # CRUD de /tarefas
│   ├── schemas/tarefa.py     # modelos Pydantic
│   └── repositories/tarefa.py  # armazenamento em memória
├── tests/
│   ├── conftest.py           # marca cada teste pela pasta (unit/integration)
│   ├── unit/                 # sem HTTP: schemas e repositório
│   │   ├── test_tarefa_schemas.py
│   │   └── test_tarefa_repository.py
│   └── integration/          # API via TestClient
│       ├── conftest.py       # fixture `client`
│       ├── test_home.py
│       └── test_tarefas.py
└── pyproject.toml
```

## Endpoints

O recurso `tarefas` fica guardado em memória (é zerado quando a API reinicia).
A documentação interativa fica em http://127.0.0.1:8000/docs.

| Método | Rota | Descrição | Respostas |
| --- | --- | --- | --- |
| `GET` | `/tarefas` | Lista tarefas | 200, 422 |
| `GET` | `/tarefas/{tarefa_id}` | Busca uma tarefa | 200, 404, 422 |
| `POST` | `/tarefas` | Cria uma tarefa | 201, 422 |
| `PUT` | `/tarefas/{tarefa_id}` | Substitui a tarefa inteira | 200, 404, 422 |
| `PATCH` | `/tarefas/{tarefa_id}` | Altera só os campos enviados | 200, 404, 422 |
| `DELETE` | `/tarefas/{tarefa_id}` | Remove a tarefa | 204, 404, 422 |

- **Path parameter:** `tarefa_id` (inteiro ≥ 1).
- **Query parameters** em `GET /tarefas`: `concluida` (bool), `prioridade`
  (`baixa`, `media`, `alta`), `offset` (≥ 0, padrão 0) e `limit` (1–100, padrão 10).
- **Modelos Pydantic** (`schemas/tarefa.py`): `TarefaCreate` (POST),
  `TarefaUpdate` (PUT), `TarefaPatch` (PATCH, todos os campos opcionais) e
  `Tarefa` (resposta, com `id`, `criada_em` e `atualizada_em`).

Exemplo:

```bash
curl -X POST localhost:8000/tarefas -H 'Content-Type: application/json' \
     -d '{"titulo": "Estudar FastAPI", "prioridade": "alta"}'
curl 'localhost:8000/tarefas?concluida=false&limit=5'
curl -X PATCH localhost:8000/tarefas/1 -H 'Content-Type: application/json' \
     -d '{"concluida": true}'
curl -X DELETE localhost:8000/tarefas/1
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
| `make test-unit` | Roda só os testes unitários |
| `make test-integration` | Roda só os testes de integração |
| `make test-v` | Roda mostrando cada caso individualmente |
| `make test-k K=404` | Roda só os testes cujo nome casa com `K` |
| `make test PYTEST_ARGS="-x -q"` | Repassa flags arbitrárias ao pytest |

Saída esperada de `make test`:

```
collected 64 items

tests/integration/test_home.py ............                              [ 18%]
tests/integration/test_tarefas.py ...........................            [ 60%]
tests/unit/test_tarefa_repository.py ...........                         [ 78%]
tests/unit/test_tarefa_schemas.py ..............                         [100%]

============================== 64 passed in 0.18s ==============================
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

São 64 casos no total, por causa da parametrização, divididos em duas suítes.

### Unitários — `tests/unit/` (25 casos)

Testam as peças isoladas, sem subir a aplicação nem fazer requisição HTTP.

| Arquivo | Verifica |
| --- | --- |
| `test_tarefa_schemas.py` | valores padrão, conversão do enum, limites de tamanho, PATCH guardando só os campos enviados, `null` rejeitado em campo obrigatório, campo desconhecido rejeitado |
| `test_tarefa_repository.py` | ids sequenciais e não reaproveitados, datas preenchidas, filtros e paginação de `listar`, PUT substituindo tudo e PATCH preservando o resto, retorno `None`/`False` para id inexistente |

### Integração — `tests/integration/` (39 casos)

Passam pela aplicação inteira (roteamento, validação, dependências,
serialização) usando o `TestClient`. **Todos os endpoints são exercitados aqui.**

| Arquivo | Verifica |
| --- | --- |
| `test_home.py` | `GET /`: status, corpo, content-type, 404 em rotas desconhecidas, 405 em outros métodos, presença no OpenAPI |
| `test_tarefas.py` | GET (lista e por id), POST, PUT, PATCH e DELETE de `/tarefas`: caminho feliz, corpo inválido (422), query e path parameters inválidos (422), tarefa inexistente (404), presença no OpenAPI |

A fixture `client`, em `tests/integration/conftest.py`, entrega um
`TestClient` do FastAPI como context manager — assim o ciclo de vida da
aplicação roda de verdade a cada teste. Ela também troca o repositório de
tarefas por um vazio via `app.dependency_overrides`, então nenhum teste
enxerga dados de outro.

### Como a separação funciona

O `tests/conftest.py` aplica o marker `unit` ou `integration` de acordo com a
pasta do teste, então `pytest -m unit` e `pytest -m integration` funcionam sem
decorar teste por teste. Se alguém criar um teste fora dessas duas pastas, a
coleta falha com erro — assim nenhum teste fica de fora do CI sem ninguém
perceber. Os markers estão registrados no `pyproject.toml` com
`--strict-markers`.

## Testes no CI

O workflow `.github/workflows/ci-backend.yml` roda a cada `push` e a cada
`pull_request` que toque em `backend/**`, com três jobs em paralelo:

| Job | Comando |
| --- | --- |
| `Lint (Ruff)` | `ruff check .` e `ruff format --check .` |
| `Testes (unit)` | `pytest -v -m unit` |
| `Testes (integration)` | `pytest -v -m integration` |

Como todo teste precisa estar em uma das duas pastas, os dois jobs de teste
juntos cobrem a suíte inteira.

Para acompanhar as execuções:

```bash
gh run list --workflow=ci-backend.yml
gh run watch
```
