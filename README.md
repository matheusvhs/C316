# PetCare — carteira de cuidados do pet

## Objetivo e tema

Quem cuida de um pet precisa lembrar de várias datas: a próxima dose de vacina, o vermífugo, o antipulgas, a consulta de rotina. Essas informações costumam ficar espalhadas em carteirinhas de papel, recibos e na memória, e é fácil perder um prazo.

O PetCare é uma carteira digital de cuidados. O tutor cadastra seus pets, registra cada cuidado com data, custo e, quando houver, a data do próximo, e acompanha:

- **alertas por tipo de cuidado**, em vermelho (vencido), amarelo (vence em até 7 dias) ou verde (em dia);
- **um resumo de cada pet**, com idade, total gasto, quantidade de cuidados e data do último.

O objetivo do projeto é aplicar, numa aplicação completa, os conteúdos da disciplina: uma API REST em FastAPI organizada em camadas (rotas, services e repositories), persistência em PostgreSQL com migrações, um frontend React que consome a API, execução integrada com Docker Compose, testes automatizados em todas as camadas e integração contínua no GitHub Actions.

## Funcionalidades

**Pets**
- Cadastrar, editar e excluir pets pela interface, com confirmação antes de excluir.
- Lista em cards com nome, espécie, raça e idade.
- Busca por nome, sem diferenciar maiúsculas, e filtro por espécie (cachorro, gato ou outro).

**Cuidados**
- Registrar, editar e excluir cuidados de cada pet. Os tipos são vacina, vermífugo, antipulgas, banho, consulta e outro.
- Cada cuidado tem data, custo, descrição e, opcionalmente, a data do próximo.
- Tabela de cuidados com filtro por tipo.

**Resumo e alertas**
- Resumo de cada pet: idade em anos e meses, total gasto em R$, quantidade de cuidados e data do último.
- Um alerta por tipo de cuidado, calculado a partir do cuidado mais recente que tem data do próximo:
  - vermelho: vencido ("venceu há X dias");
  - amarelo: vence em até 7 dias ("vence em X dias" ou "vence hoje");
  - verde: em dia.
- O resumo e os alertas são atualizados assim que um cuidado é registrado, editado ou excluído.

**Regras de negócio**

Elas valem na API, e os erros aparecem na tela.

| Regra | Resposta da API |
|---|---|
| O nome do pet é único, sem diferenciar maiúsculas | 409 |
| Um cuidado não pode ser anterior ao nascimento do pet, nem quando o nascimento é editado | 422 |
| A data do próximo cuidado precisa ser depois da data do cuidado | 422 |
| Uma vacina precisa ter o nome informado | 422 |
| Um pet com cuidados não pode ser excluído; exclua os cuidados antes | 409 |

**Validações e interface**
- Datas não podem ser futuras. O peso vai de mais de 0 até 150 kg, e o custo é de no mínimo 0, os dois com até 2 casas decimais.
- Os formulários validam os campos antes de enviar e mostram as mensagens, em português, embaixo de cada campo.
- Toda tela mostra os estados de carregando, sucesso e erro. Quando o backend está fora do ar, aparece "Não foi possível conectar à API".
- Moeda, datas e peso são exibidos no formato brasileiro.

**Dados de exemplo**
- `make seed` cadastra 2 pets (um cachorro e um gato) com cuidados que geram um alerta de cada cor.

## Tecnologias

| Camada | Tecnologias (versões dos lockfiles) |
|---|---|
| Backend | Python 3.14, FastAPI 0.165.0, Uvicorn 0.54.0, Pydantic 2.14.4, pydantic-settings 2.16.3 |
| Banco de dados | PostgreSQL 17, SQLAlchemy 2.1.9, Alembic 1.20.1, psycopg 3.3.9 |
| Frontend | React 19.3.1, React Router 8.5.2, Vite 8.3.8, Tailwind CSS 4.3.5 |
| Qualidade | Ruff 0.17.6 (backend), Biome 2.6.8 (frontend) |
| Testes | Pytest 9.2.0 e httpx2 2.16.2 (backend); Vitest 5.1.1, Testing Library e jsdom 31.0.1 (frontend); Playwright 1.65.1 (E2E) |
| Infraestrutura | Docker Compose (`postgres:17-alpine`, `python:3.14-slim`, `node:24-alpine` e `nginx:1.30-alpine`), Poetry 2.5.1, npm, Make, GitHub Actions |

## Estrutura resumida

```
.
├── backend/
│   ├── src/backend/
│   │   ├── app/
│   │   │   ├── main.py          # app FastAPI, CORS, routers e handlers de erro
│   │   │   ├── core/            # configurações e erros de domínio
│   │   │   ├── db/              # engine e sessão do banco
│   │   │   ├── models/          # tabelas pets e cuidados (SQLAlchemy)
│   │   │   ├── schemas/         # validação de entrada e saída (Pydantic)
│   │   │   ├── repositories/    # acesso ao banco
│   │   │   ├── services/        # regras de negócio
│   │   │   └── routers/         # endpoints
│   │   └── seed.py              # dados de exemplo (make seed)
│   ├── alembic/                 # migrações
│   ├── tests/                   # Pytest
│   ├── Dockerfile
│   └── entrypoint.sh            # aplica as migrações e sobe a API
├── frontend/
│   ├── src/
│   │   ├── services/            # chamadas à API (fetch)
│   │   ├── pages/               # lista de pets e detalhe do pet
│   │   ├── components/
│   │   └── utils/               # formatação e validação
│   ├── tests/                   # Vitest + Testing Library
│   ├── e2e/                     # Playwright
│   ├── Dockerfile
│   └── nginx.conf
├── .github/workflows/           # CI do backend e do frontend
├── scripts/                     # relatório do make test
├── docker-compose.yml
├── Makefile
└── .env.example
```

## Pré-requisitos

- Docker com Docker Compose
- Make

Para rodar os testes e o lint fora do Docker (`make install`, `make test`, `make lint`):

- Python 3.14 ou mais novo e Poetry 2
- Node.js 22.22 ou mais novo e npm

## Variáveis de ambiente

Os valores de exemplo ficam em `.env.example`. O `.env` não é versionado.

| Variável | Para que serve |
|---|---|
| `POSTGRES_USER` | Usuário criado no PostgreSQL do compose |
| `POSTGRES_PASSWORD` | Senha desse usuário |
| `POSTGRES_DB` | Nome do banco criado no PostgreSQL |
| `POSTGRES_PORT` | Porta do PostgreSQL publicada no computador (usada também por `make migration`) |
| `DATABASE_URL` | URL de conexão da API com o banco. No compose, o host é `db` |
| `CORS_ORIGINS` | Origens que podem chamar a API pelo navegador, separadas por vírgula. Precisa conter o endereço do frontend |
| `API_PORT` | Porta da API publicada no computador |
| `FRONTEND_PORT` | Porta do frontend publicada no computador |
| `VITE_API_URL` | Endereço da API usado pelo navegador. Entra no build do frontend, então use `localhost`, e não `api` |

Se mudar `FRONTEND_PORT`, atualize `CORS_ORIGINS`. Se mudar `API_PORT`, atualize `VITE_API_URL` e rode `make up` de novo para reconstruir o frontend.

## Como executar

```bash
cp .env.example .env
make up
```

O `make up` constrói as imagens, sobe os três serviços e só termina quando todos estão saudáveis. A ordem de subida é `db` → `api` → `frontend`, garantida pelos healthchecks. As migrações rodam sozinhas quando a API sobe.

| Serviço | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:8000 |
| Documentação da API (Swagger) | http://localhost:8000/docs |
| Saúde da API | http://localhost:8000/health |

Outros comandos:

| Comando | O que faz |
|---|---|
| `make seed` | Insere 2 pets de exemplo com cuidados, com um alerta de cada cor. Se os pets já existirem, não altera nada |
| `make logs` | Acompanha os logs. Para filtrar um serviço: `make logs s=api` |
| `make down` | Derruba a stack e mantém os dados do banco |
| `make reset-db` | Derruba a stack e apaga os dados do banco |
| `make help` | Lista todos os comandos |

## Migrações

| Comando | O que faz |
|---|---|
| `make migrate` | Aplica as migrações pendentes no banco do compose |
| `make migration name="descrição"` | Gera uma nova migração a partir dos models. Roda no computador, com Poetry, contra o banco do compose, que precisa estar no ar |

## Testes

| Comando | O que faz |
|---|---|
| `make install` | Instala as dependências do backend e do frontend e o Chromium do Playwright |
| `make test` (ou `make tests`) | Roda todos os testes (backend, frontend e E2E) e mostra no fim um relatório com o resultado, a quantidade de testes e o tempo de cada suíte |
| `make test-backend` | Pytest (SQLite temporário; no CI, PostgreSQL) |
| `make test-frontend` | Vitest com Testing Library |
| `make test-e2e` | Sobe a stack e roda o Playwright contra ela |
| `make lint` | Ruff no backend e Biome no frontend |
| `make format` | Formata o backend e o frontend |

O GitHub Actions roda os workflows `Backend` (Ruff e Pytest contra PostgreSQL) e `Frontend` (Biome, Vitest e build) em pull requests para a `main` e em pushes na `projeto-final`.

## Vídeo demonstrativo

<!-- link do vídeo -->
