# C316 - Makefile
# Atalhos para as tarefas mais comuns do projeto.

BACKEND := backend
POETRY  := poetry -C $(BACKEND)
RUN     := $(POETRY) run

APP     := backend.app.main:app
HOST    ?= 127.0.0.1
PORT    ?= 8000

.DEFAULT_GOAL := help
.PHONY: help install run test lint format check clean

help: ## Lista os comandos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

install: ## Instala as dependências (incluindo as de desenvolvimento)
	$(POETRY) install

run: ## Sobe a API em modo de desenvolvimento (reload automático)
	$(RUN) uvicorn $(APP) --reload --host $(HOST) --port $(PORT)

test: ## Executa a suíte de testes
	$(RUN) pytest

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
