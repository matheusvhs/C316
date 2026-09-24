# C316 - Makefile
# Atalhos para as tarefas mais comuns do projeto.

BACKEND := backend
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
.PHONY: help install run test test-v test-k lint format check clean \
        up down logs ps build shell db-shell

help: ## Lista os comandos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

install: ## Instala as dependências (incluindo as de desenvolvimento)
	$(POETRY) install

run: ## Sobe a API em modo de desenvolvimento (reload automático)
	$(RUN) uvicorn $(APP) --reload --host $(HOST) --port $(PORT)

test: ## Executa a suíte de testes
	$(RUN) pytest $(PYTEST_ARGS)

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
