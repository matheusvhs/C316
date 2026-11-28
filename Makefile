-include .env

COMPOSE := docker compose
POETRY := poetry -C backend
NPM := npm --prefix frontend
LOCAL_DATABASE_URL := postgresql+psycopg://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@localhost:$(POSTGRES_PORT)/$(POSTGRES_DB)

.DEFAULT_GOAL := help

.PHONY: help install up down logs migrate migration reset-db seed lint format \
	test-backend test-frontend test-e2e test tests

help: ## Mostra os comandos disponíveis
	@grep -E '^[a-zA-Z0-9_-]+:.*?## ' $(firstword $(MAKEFILE_LIST)) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

.env:
	cp .env.example .env
	@echo ".env criado a partir do .env.example"

install: .env ## Instala as dependências do backend, do frontend e o navegador do E2E
	$(POETRY) install
	$(NPM) ci
	$(NPM) exec -- playwright install chromium

up: .env ## Sobe a stack em segundo plano e espera os healthchecks
	$(COMPOSE) up -d --build --wait

down: ## Derruba a stack, mantendo os dados do banco
	$(COMPOSE) down

logs: ## Acompanha os logs (ex.: make logs s=api)
	$(COMPOSE) logs -f --tail=100 $(s)

migrate: .env ## Aplica as migrações pendentes no banco do compose
	$(COMPOSE) run --rm api alembic upgrade head

migration: .env ## Gera uma migração a partir dos models (ex.: make migration name="adiciona campo")
	@test -n "$(name)" || { echo 'Informe o nome, ex.: make migration name="adiciona campo"'; exit 1; }
	DATABASE_URL=$(LOCAL_DATABASE_URL) $(POETRY) run alembic revision --autogenerate -m "$(name)"

reset-db: ## Derruba a stack e apaga os dados do banco
	$(COMPOSE) down -v

seed: .env ## Insere 2 pets de exemplo com cuidados (um alerta de cada cor)
	$(COMPOSE) run --rm api python -m backend.seed

lint: ## Verifica lint e formatação do backend (Ruff) e do frontend (Biome)
	$(POETRY) run ruff check .
	$(POETRY) run ruff format --check .
	$(NPM) run ci

format: ## Formata o backend (Ruff) e o frontend (Biome)
	$(POETRY) run ruff check --fix .
	$(POETRY) run ruff format .
	$(NPM) run format

test-backend: ## Roda os testes do backend (Pytest)
	$(POETRY) run pytest

test-frontend: ## Roda os testes do frontend (Vitest)
	$(NPM) test

test-e2e: up ## Sobe a stack e roda os testes E2E (Playwright) contra ela
	$(NPM) exec -- playwright install chromium
	$(NPM) run test:e2e

test: ## Roda todos os testes (backend, frontend e E2E) e mostra um relatório no fim
	@./scripts/relatorio-testes.sh

tests: test ## Atalho para make test
