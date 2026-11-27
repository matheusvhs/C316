-include .env

COMPOSE := docker compose
ALEMBIC := poetry -C backend run alembic
LOCAL_DATABASE_URL := postgresql+psycopg://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@localhost:$(POSTGRES_PORT)/$(POSTGRES_DB)

.DEFAULT_GOAL := help

.PHONY: help up down logs migrate migration reset-db test-e2e

help: ## Mostra os comandos disponíveis
	@grep -E '^[a-zA-Z0-9_-]+:.*?## ' $(firstword $(MAKEFILE_LIST)) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

up: ## Sobe a stack em segundo plano e espera os healthchecks
	$(COMPOSE) up -d --build --wait

down: ## Derruba a stack, mantendo os dados do banco
	$(COMPOSE) down

logs: ## Acompanha os logs (ex.: make logs s=api)
	$(COMPOSE) logs -f --tail=100 $(s)

migrate: ## Aplica as migrações pendentes no banco do compose
	$(COMPOSE) run --rm api alembic upgrade head

migration: ## Gera uma migração a partir dos models (ex.: make migration name="adiciona campo")
	@test -n "$(name)" || { echo 'Informe o nome, ex.: make migration name="adiciona campo"'; exit 1; }
	DATABASE_URL=$(LOCAL_DATABASE_URL) $(ALEMBIC) revision --autogenerate -m "$(name)"

reset-db: ## Derruba a stack e apaga os dados do banco
	$(COMPOSE) down -v

test-e2e: up ## Sobe a stack e roda os testes E2E (Playwright) contra ela
	npm --prefix frontend exec -- playwright install chromium
	npm --prefix frontend run test:e2e
