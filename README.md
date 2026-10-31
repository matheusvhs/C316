# C316

Projeto da disciplina C316, com backend em FastAPI, PostgreSQL e Docker, e
frontend em React, Vite e Tailwind.

## Começando

```bash
make install   # instala as dependências
make run       # sobe a API em http://127.0.0.1:8000
make test      # roda os testes
make help      # lista todos os comandos
```

Para subir tudo em containers (API + PostgreSQL):

```bash
make up          # aplica as migrations e sobe a API
make restart     # reinicia a API; as tarefas continuam no banco
make db-current  # revisão do Alembic aplicada
make down
```

As tarefas ficam no PostgreSQL e a tabela é criada pelas migrations do
Alembic. Detalhes em
[`backend/README.md`](backend/README.md#persistência).

## Testes

```bash
make test        # suíte completa
make test-unit   # só os unitários
make test-integration  # só os de integração (TestClient)
make test-v      # detalhando cada caso
make test-k K=404  # filtrando por nome
```

Os detalhes de como os testes são organizados estão em
[`backend/README.md`](backend/README.md#executando-os-testes).

O CI roda lint, testes unitários e testes de integração em jobs separados a
cada `push` e `pull_request`
([`.github/workflows/ci-backend.yml`](.github/workflows/ci-backend.yml)).

## Frontend

```bash
make frontend-install  # instala as dependências pelo lockfile
make frontend-dev      # sobe o Vite em http://localhost:5173
make frontend-test     # Vitest (unitários e de integração)
make frontend-test-e2e # Playwright (inicia o Vite sozinho)
```

O frontend é uma aplicação independente que mantém os itens em memória —
sem API nem persistência. Detalhes em
[`docs/pratica-6.md`](docs/pratica-6.md). O CI dele roda em
[`.github/workflows/ci-frontend.yml`](.github/workflows/ci-frontend.yml).

## Documentação

- [`backend/README.md`](backend/README.md) — estrutura do backend,
  persistência, migrations e testes
- [`docs/pratica-6.md`](docs/pratica-6.md) — frontend, testes e CI
