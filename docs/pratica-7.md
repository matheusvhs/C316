# Prática 7 — Frontend integrado à API

A SPA da `frontend/` deixou de ser isolada: ela agora é um gerenciador de
tarefas de verdade, falando com a API do `backend/` e gravando tudo no
PostgreSQL. O domínio também foi alinhado — o que era "item com categoria" na
Prática 6 virou "tarefa com prioridade e status de concluída", os mesmos
campos que a API expõe.

## Como rodar

Com Docker, a stack inteira sobe de uma vez (Postgres + API + frontend no
Nginx):

```bash
make up   # frontend em http://localhost:5173, API em :8000
```

Para desenvolver com reload, suba só API + banco e rode o Vite no host:

```bash
docker compose up -d db backend
make frontend-install
make frontend-dev   # http://localhost:5173 com proxy /tarefas → :8000
```

## O que mudou

- `src/api/tarefas.js` — cliente HTTP: `listarTarefas`, `criarTarefa`,
  `atualizarTarefa` (PATCH) e `removerTarefa`, com mensagens de erro
  amigáveis quando a API está fora.
- `src/hooks/useTarefas.js` — carrega a lista da API ao montar e só mexe no
  estado quando a operação é confirmada; expõe `carregando` e `erro`, além de
  `adicionar`, `alternarConcluida` e `remover`.
- `src/components/` — `FormularioTarefa` (título, descrição, prioridade; só
  limpa se a criação der certo), `TarefaCard` (checkbox de concluída, selo de
  prioridade, remover) e `ListaTarefas`.
- `src/App.jsx` — resumo com total, exibidos e concluídas; filtro por
  prioridade; banner de erro e estado de carregamento.
- Backend — `CORSMiddleware` lendo `FRONTEND_ORIGIN` (padrão
  `http://localhost:5173`), configurável em `app/core/config.py` e no
  `docker-compose.yml`; dois testes novos cobrem a resposta CORS e o
  preflight.
- Infra — `frontend/Dockerfile` multi-stage (build Vite → Nginx) com
  `nginx.conf` fazendo proxy de `/tarefas` para o serviço `backend`; o Vite
  de dev tem o mesmo proxy em `vite.config.js`; serviço `frontend` no
  Compose e `FRONTEND_ORIGIN` no `.env.example`.

## Testes

Os testes continuam herméticos — não precisam de API de verdade:

- **unitários** — `validarTarefa`, `useTarefas` (módulo `api` mockado com
  `vi.mock`), `FormularioTarefa` e `TarefaCard`.
- **integração** — `App` inteiro contra uma API falsa em memória via
  `vi.stubGlobal("fetch")`: criar, concluir, filtrar, remover e falha de rede.
- **e2e** — Playwright intercepta `**/tarefas**` com `page.route`: carga
  inicial, fluxo completo, **persistência após reload**, API fora do ar,
  formulário inválido sem chamada extra e layout no celular.

```bash
make frontend-test        # Vitest
make frontend-test-e2e    # Playwright (mocka a API, não precisa do backend)
make check-all            # backend + frontend
```

## Entrega

A branch `pratica-7` sai de `pratica-6` e deve ser revisada num PR para
`pratica-6`.
