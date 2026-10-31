# Prática 6 — Interface web

A pasta `frontend/` traz uma SPA feita em JavaScript com React + Vite, estilizada
com Tailwind CSS 4. Ela é totalmente independente: não fala com a API, não usa
banco nem `localStorage` — tudo vive em memória e some ao dar refresh. Backend e
Compose seguem iguais aos da `pratica-5`.

## Como rodar

É preciso ter Node 22.22.2 ou superior (LTS 22/24/26) e npm — confira com
`node --version`. Na raiz do projeto:

```bash
make frontend-install   # dependências a partir do package-lock.json
make frontend-dev       # sobe em http://localhost:5173
```

A página mostra um formulário à esquerda (nome, descrição e categoria) e a lista
de itens à direita; no topo, um resumo com total, quantos estão sendo exibidos
e quantas categorias estão em uso. O nome é obrigatório e limitado a 100
caracteres, a descrição é opcional com até 500, e a categoria é uma entre casa,
trabalho, estudos e outros. Dá para filtrar a lista por categoria nos chips
acima dela e remover qualquer item pelo cartão.

## Estrutura

- `src/hooks/useItens.js` — guarda a lista e o filtro ativo, e expõe
  `adicionar`, `remover`, `setFiltro` e um `resumo` derivado com `useMemo`. É
  aqui que, na Prática 7, entram as chamadas HTTP; os componentes não precisam
  mudar.
- `src/components/FormularioItem.jsx` — controla os inputs, chama a validação
  antes de submeter e mostra um erro por campo com `role="alert"`,
  `aria-invalid` e `aria-describedby`.
- `src/components/ItemCard.jsx` — um cartão por item: selo colorido de
  categoria e botão de remover.
- `src/components/ListaItens.jsx` — empilha os cartões ou mostra o estado
  vazio.
- `src/utils/validarItem.js` — função pura: recebe os campos e devolve
  `{ erros, dados }` já normalizados (trim, categoria padrão `"outros"`).

## Testes e qualidade

```bash
make frontend-lint        # Biome
make frontend-check       # lint + formatação + imports
make frontend-test        # Vitest: unitários e integração
make frontend-build       # build de produção
(cd frontend && npx playwright install chromium)
make frontend-test-e2e    # Playwright: desktop Chrome + Pixel 7
```

`make check-all` roda a validação inteira (backend + frontend). Para corrigir
formatação use `make frontend-format`; para desenvolver com watch mode,
`npm run test:watch --prefix frontend`.

A cobertura dos testes:

- **unitários** — validação (obrigatório, tamanho, categoria inválida, trim),
  hook `useItens` (ordem, filtro, resumo, remover), formulário (erro
  acessível, envio normalizado) e cartão (selo e callback de remover).
- **integração** — o `App` inteiro: criar dois itens, conferir o resumo,
  filtrar por categoria, remover e rejeitar formulário inválido.
- **e2e** — carregamento com resumo zerado, ciclo criar → filtrar → remover,
  zero chamadas `fetch`/`XHR` à rede, estado apagado após reload e ausência de
  scroll horizontal no celular.

## CI

O `ci-frontend.yml` tem dois jobs: `qualidade` (Biome, Vitest e build) e `e2e`
(Playwright, que só roda se o primeiro passar). Em caso de falha nos E2E o
relatório HTML sobe como artifact por 7 dias. O workflow dispara em PRs e
pushes na `main` que mexam em `frontend/`, no próprio workflow ou no Makefile;
o `ci-backend.yml` ganhou os mesmos filtros para os arquivos do backend.

## Entrega

A branch `pratica-6` sai de `pratica-5` e deve ser revisada num PR para
`pratica-5`. Integração com a API e containerização do frontend ficam para a
Prática 7.
