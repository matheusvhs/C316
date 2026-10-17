# Backend — C316

API em FastAPI, gerenciada com Poetry. As tarefas ficam salvas no PostgreSQL,
acessado com SQLAlchemy; a estrutura do banco é versionada com Alembic.

## Estrutura

```
backend/
├── src/backend/app/
│   ├── main.py               # só cria o app e registra os routers
│   ├── core/config.py        # DATABASE_URL
│   ├── database.py           # engine, sessão por requisição (get_db) e Base
│   ├── routers/
│   │   ├── home.py           # GET /
│   │   └── tarefas.py        # CRUD de /tarefas
│   ├── schemas/tarefa.py     # modelos Pydantic (contrato HTTP)
│   ├── models/tarefa.py      # modelo SQLAlchemy (tabela `tarefas`)
│   └── repositories/tarefa.py  # consultas e gravações no banco
├── migrations/               # Alembic
│   ├── env.py
│   └── versions/0001_cria_tabela_tarefas.py
├── alembic.ini
├── tests/
│   ├── conftest.py           # marca a suíte pela pasta e cria o banco de teste
│   ├── unit/                 # sem HTTP: schemas, repositório e migrations
│   │   ├── test_tarefa_schemas.py
│   │   ├── test_tarefa_repository.py
│   │   └── test_migrations.py
│   └── integration/          # API via TestClient
│       ├── conftest.py       # fixture `client`
│       ├── test_home.py
│       ├── test_tarefas.py
│       └── test_persistencia.py
└── pyproject.toml
```

## Endpoints

O recurso `tarefas` fica salvo no PostgreSQL, então continua lá quando a API
reinicia. A documentação interativa fica em http://127.0.0.1:8000/docs.

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

## Persistência

O caminho de uma requisição é router → repositório → SQLAlchemy → PostgreSQL.

- **`schemas/tarefa.py` × `models/tarefa.py`:** os schemas Pydantic definem o
  que entra e sai pela API; o modelo `TarefaModel` define a tabela. A resposta
  é montada direto do modelo (`from_attributes=True`).
- **Sessão por requisição:** `get_db` (em `database.py`) abre uma sessão para
  cada requisição e a fecha no fim; se algo falhar, o que não foi confirmado é
  desfeito. O repositório recebe essa sessão pela dependência
  `get_tarefa_repository` e faz `commit` a cada escrita.
- **Datas em UTC:** `criada_em` e `atualizada_em` são gravadas com fuso e
  sempre devolvidas em UTC, seja qual for o banco.
- **Ids:** não são reaproveitados depois de uma remoção.
- **Configuração:** a URL vem de `DATABASE_URL`. O padrão aponta para
  `localhost:5432` (o Postgres do Compose); dentro do Compose ela usa o
  serviço `db`. O driver é o `psycopg` 3 (`postgresql+psycopg://`).

A aplicação **não** cria tabelas sozinha: quem cria é o Alembic.

### Rodando

Com Docker, tudo de uma vez (o container do backend roda
`alembic upgrade head` antes de subir o Uvicorn):

```bash
make up
make db-current     # deve mostrar 0001 (head)
```

Fora do Compose, só com o banco em container:

```bash
docker compose up -d db
make migrate        # aplica as migrations em DATABASE_URL
make run
```

> Se já existir um Postgres instalado na máquina usando a porta 5432, suba o
> do Compose em outra porta e aponte a URL para ela:
> `POSTGRES_PORT=5433 make up` e
> `export DATABASE_URL=postgresql+psycopg://c316:c316@localhost:5433/c316`.

### Conferindo que os dados persistem

```bash
curl -X POST localhost:8000/tarefas -H 'Content-Type: application/json' \
     -d '{"titulo": "Prática 5", "descricao": "Persistida no PostgreSQL"}'
make restart        # reinicia só a API
curl localhost:8000/tarefas          # a tarefa continua lá
make db-shell       # no psql: SELECT * FROM tarefas;
```

`make down` também preserva os dados, porque eles ficam no volume
`postgres_data`. Só `docker compose down -v` apaga o banco.

### Migrations

| Comando | O que faz |
| --- | --- |
| `make db-upgrade` | Aplica as migrations pendentes no banco do Compose |
| `make db-downgrade` | Desfaz a última migration no banco do Compose |
| `make db-current` | Mostra a revisão aplicada no banco do Compose |
| `make db-history` | Lista as migrations |
| `make migrate` | Aplica as migrations no banco de `DATABASE_URL` |
| `make migration MSG="..."` | Gera uma migration comparando os modelos com o banco |

Para alterar a tabela: mude `models/tarefa.py`, rode
`make migration MSG="descrição"` com o banco atualizado, revise o arquivo
criado em `migrations/versions/` e aplique com `make migrate` (ou
`make db-upgrade`). O arquivo gerado já sai formatado pelo Ruff.

A migration `0001` cria a tabela a partir de um banco vazio e tem `downgrade`.

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
collected 70 items

tests/integration/test_home.py ............                              [ 17%]
tests/integration/test_persistencia.py ....                              [ 22%]
tests/integration/test_tarefas.py ...........................            [ 61%]
tests/unit/test_migrations.py ..                                         [ 64%]
tests/unit/test_tarefa_repository.py ...........                         [ 80%]
tests/unit/test_tarefa_schemas.py ..............                         [100%]

============================== 70 passed in 2.98s ==============================
```

### Banco usado nos testes

Os testes nunca usam o banco da aplicação. Cada teste que precisa de banco
recebe um SQLite novo numa pasta temporária, cria as tabelas rodando as
**migrations reais** e as desfaz no fim. Para rodar a mesma suíte contra o
PostgreSQL, crie um banco só para testes e passe a URL dele:

```bash
docker compose exec db psql -U c316 -d c316 -c 'CREATE DATABASE c316_test;'
TEST_DATABASE_URL=postgresql+psycopg://c316:c316@localhost:5432/c316_test make test
```

Nunca aponte `TEST_DATABASE_URL` para o banco da aplicação: as tabelas são
apagadas ao fim de cada teste. O CI roda assim, com um Postgres próprio.

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

São 70 casos no total, por causa da parametrização, divididos em duas suítes.

### Unitários — `tests/unit/` (27 casos)

Testam as peças isoladas, sem subir a aplicação nem fazer requisição HTTP.

| Arquivo | Verifica |
| --- | --- |
| `test_tarefa_schemas.py` | valores padrão, conversão do enum, limites de tamanho, PATCH guardando só os campos enviados, `null` rejeitado em campo obrigatório, campo desconhecido rejeitado |
| `test_tarefa_repository.py` | ids sequenciais e não reaproveitados, datas preenchidas, filtros e paginação de `listar`, PUT substituindo tudo e PATCH preservando o resto, retorno `None`/`False` para id inexistente — tudo gravando no banco de teste |
| `test_migrations.py` | `upgrade` cria a tabela e `downgrade` a remove; as migrations batem com os modelos (`alembic check`), então mudar um modelo sem migration quebra o teste |

### Integração — `tests/integration/` (43 casos)

Passam pela aplicação inteira (roteamento, validação, dependências,
serialização) usando o `TestClient`. **Todos os endpoints são exercitados aqui.**

| Arquivo | Verifica |
| --- | --- |
| `test_home.py` | `GET /`: status, corpo, content-type, 404 em rotas desconhecidas, 405 em outros métodos, presença no OpenAPI |
| `test_tarefas.py` | GET (lista e por id), POST, PUT, PATCH e DELETE de `/tarefas`: caminho feliz, corpo inválido (422), query e path parameters inválidos (422), tarefa inexistente (404), presença no OpenAPI |
| `test_persistencia.py` | a tarefa continua acessível depois de fechar todas as conexões e abrir um cliente novo (simula reiniciar a API); POST, PATCH e DELETE aparecem na tabela consultada por SQL; datas saem em UTC |

A fixture `client`, em `tests/integration/conftest.py`, entrega um
`TestClient` do FastAPI como context manager — assim o ciclo de vida da
aplicação roda de verdade a cada teste. Ela também troca a sessão do banco
(`get_db`) por uma ligada ao banco do teste via `app.dependency_overrides`,
então nenhum teste enxerga dados de outro.

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
| `Testes (unit)` | `pytest -v -m unit` contra Postgres |
| `Testes (integration)` | `pytest -v -m integration` contra Postgres |

Como todo teste precisa estar em uma das duas pastas, os dois jobs de teste
juntos cobrem a suíte inteira. Os jobs de teste sobem um `postgres:17-alpine`
como serviço e definem `TEST_DATABASE_URL`, então no CI a suíte roda contra o
mesmo banco usado em produção.

Para acompanhar as execuções:

```bash
gh run list --workflow=ci-backend.yml
gh run watch
```
