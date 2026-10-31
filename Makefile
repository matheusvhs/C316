# C316 - Makefile
# Atalhos para as tarefas mais comuns do projeto.

BACKEND  := backend
FRONTEND := frontend
POETRY  := poetry -C $(BACKEND)
RUN     := $(POETRY) run

APP     := backend.app.main:app
HOST    ?= 127.0.0.1
PORT    ?= 8000

COMPOSE := docker compose
API_SVC := backend
DB_SVC  := db
SVC     ?=

TESTS       := tests
PYTEST_ARGS ?=
K           ?=

.DEFAULT_GOAL := help
.PHONY: help install run test test-unit test-integration test-v test-k lint format check clean \
        up down restart logs ps build shell db-shell \
        migrate migration db-upgrade db-downgrade db-current db-history \
        frontend-install frontend-dev frontend-lint frontend-format frontend-check \
        frontend-test frontend-test-e2e frontend-build check-all

help: ## Lista os comandos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

install: ## Instala as dependências (incluindo as de desenvolvimento)
	$(POETRY) install

run: ## Sobe a API em modo de desenvolvimento (reload automático)
	$(RUN) uvicorn $(APP) --reload --host $(HOST) --port $(PORT)

test: ## Executa a suíte de testes
	$(RUN) pytest $(PYTEST_ARGS)

test-unit: ## Executa só os testes unitários (tests/unit/)
	$(RUN) pytest -m unit $(PYTEST_ARGS)

test-integration: ## Executa só os testes de integração via TestClient (tests/integration/)
	$(RUN) pytest -m integration $(PYTEST_ARGS)

test-v: ## Executa os testes mostrando cada caso individualmente
	$(RUN) pytest -v $(PYTEST_ARGS)

test-k: ## Executa só os testes cujo nome casa com K (ex.: make test-k K=404)
	@test -n "$(K)" || { echo "informe K, ex.: make test-k K=404"; exit 1; }
	$(RUN) pytest -v -k "$(K)" $(PYTEST_ARGS)

lint: ## Verifica o código com o Ruff
	$(RUN) ruff check .
	$(RUN) ruff format --check .

format: ## Formata o código e corrige o que for automático
	$(RUN) ruff check --fix .
	$(RUN) ruff format .

check: lint test ## Roda lint e testes (usado no CI)

clean: ## Remove caches e artefatos de build
	find . -type d -name '__pycache__' -prune -exec rm -rf {} +
	rm -rf $(BACKEND)/.pytest_cache $(BACKEND)/.ruff_cache $(BACKEND)/dist

up: ## Sobe a stack (API + Postgres) em background
	$(COMPOSE) up -d --build

down: ## Derruba a stack (o volume do banco é preservado)
	$(COMPOSE) down

restart: ## Reinicia só a API (os dados continuam no volume do Postgres)
	$(COMPOSE) restart $(API_SVC)

logs: ## Acompanha os logs; use SVC=backend para filtrar um serviço
	$(COMPOSE) logs -f --tail=100 $(SVC)

ps: ## Mostra o estado dos containers
	$(COMPOSE) ps

build: ## Reconstrói a imagem do backend sem usar cache
	$(COMPOSE) build --no-cache $(API_SVC)

shell: ## Abre um shell dentro do container do backend
	$(COMPOSE) exec $(API_SVC) bash

db-shell: ## Abre o psql no container do banco
	$(COMPOSE) exec $(DB_SVC) sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

# --- Migrations (Alembic) ---------------------------------------------------
# db-*: rodam dentro do container, contra o Postgres do Compose.
# migrate/migration: rodam no host, usando DATABASE_URL (padrão: localhost).

ALEMBIC := $(POETRY) run alembic -c alembic.ini
MSG     ?=

db-upgrade: ## Aplica as migrations pendentes no banco do Compose
	$(COMPOSE) run --rm $(API_SVC) alembic upgrade head

db-downgrade: ## Desfaz a última migration no banco do Compose
	$(COMPOSE) run --rm $(API_SVC) alembic downgrade -1

db-current: ## Mostra a revisão aplicada no banco do Compose
	$(COMPOSE) run --rm $(API_SVC) alembic current

db-history: ## Lista as migrations existentes
	$(ALEMBIC) history

migrate: ## Aplica as migrations no banco de DATABASE_URL (fora do Compose)
	$(ALEMBIC) upgrade head

migration: ## Gera uma migration a partir dos modelos (ex.: make migration MSG="adiciona prazo")
	@test -n "$(MSG)" || { echo 'informe MSG, ex.: make migration MSG="adiciona prazo"'; exit 1; }
	$(ALEMBIC) revision --autogenerate -m "$(MSG)"

# --- Frontend (React + Vite) -------------------------------------------------

frontend-install: ## Instala as dependências do frontend pelo lockfile
	npm ci --prefix $(FRONTEND)

frontend-dev: ## Sobe o Vite em http://localhost:5173
	npm run dev --prefix $(FRONTEND)

frontend-lint: ## Verifica o lint do frontend com Biome
	npm run lint --prefix $(FRONTEND)

frontend-format: ## Formata o frontend com Biome
	npm run format --prefix $(FRONTEND)

frontend-check: ## Verifica lint, formatação e imports do frontend
	npm run check --prefix $(FRONTEND)

frontend-test: ## Executa o Vitest (unitários e de integração)
	npm run test --prefix $(FRONTEND)

frontend-test-e2e: ## Executa o Playwright (inicia o Vite automaticamente)
	npm run test:e2e --prefix $(FRONTEND)

frontend-build: ## Gera o build de produção do frontend
	npm run build --prefix $(FRONTEND)

check-all: lint test frontend-check frontend-test frontend-build frontend-test-e2e ## Valida backend e frontend
