# C316

Projeto da disciplina C316, com backend em FastAPI, PostgreSQL e Docker.

## Começando

```bash
make install   # instala as dependências
make run       # sobe a API em http://127.0.0.1:8000
make test      # roda os testes
make help      # lista todos os comandos
```

Para subir tudo em containers (API + PostgreSQL):

```bash
make up
make down
```

## Testes

```bash
make test        # suíte completa
make test-v      # detalhando cada caso
make test-k K=404  # filtrando por nome
```

Os detalhes de como os testes são organizados estão em
[`backend/README.md`](backend/README.md#executando-os-testes).

O mesmo conjunto roda no CI a cada `push` e `pull_request`
([`.github/workflows/ci-backend.yml`](.github/workflows/ci-backend.yml)).

## Documentação

- [`backend/README.md`](backend/README.md) — estrutura do backend e testes
