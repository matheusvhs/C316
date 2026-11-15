import { expect, test } from "@playwright/test";

// API falsa em memória: os testes rolam sem backend de verdade, mas o
// estado persiste entre reloads como se o PostgreSQL estivesse atrás.
async function mockTarefasApi(page, inicial = []) {
  let proximoId = inicial.length + 1;
  const tarefas = [...inicial];

  await page.route("**/tarefas**", async (route) => {
    const request = route.request();
    const metodo = request.method();
    const caminho = new URL(request.url()).pathname;
    const id = Number(caminho.split("/")[2]);

    if (metodo === "GET") {
      await route.fulfill({ json: tarefas });
      return;
    }
    if (metodo === "POST") {
      const tarefa = {
        id: proximoId++,
        criada_em: "2026-11-14T00:00:00Z",
        atualizada_em: "2026-11-14T00:00:00Z",
        concluida: false,
        ...request.postDataJSON(),
      };
      tarefas.push(tarefa);
      await route.fulfill({ status: 201, json: tarefa });
      return;
    }
    if (metodo === "PATCH") {
      const indice = tarefas.findIndex((t) => t.id === id);
      tarefas[indice] = { ...tarefas[indice], ...request.postDataJSON() };
      await route.fulfill({ json: tarefas[indice] });
      return;
    }
    if (metodo === "DELETE") {
      tarefas.splice(
        tarefas.findIndex((t) => t.id === id),
        1,
      );
      await route.fulfill({ status: 204 });
      return;
    }
    await route.fulfill({ status: 404, json: { detail: "not found" } });
  });
}

test("abre a página carregando as tarefas da API", async ({ page }) => {
  await mockTarefasApi(page, [
    {
      id: 1,
      titulo: "Tarefa já salva",
      descricao: "veio do banco",
      prioridade: "alta",
      concluida: false,
      criada_em: "2026-11-14T00:00:00Z",
      atualizada_em: "2026-11-14T00:00:00Z",
    },
  ]);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Gerenciador de Tarefas" }),
  ).toBeVisible();
  await expect(page.getByText("Tarefa já salva")).toBeVisible();
  const resumo = page.getByRole("region", { name: "Resumo das tarefas" });
  await expect(resumo.locator("dd")).toHaveText(["1", "1", "0"]);
});

test("fluxo completo: criar, concluir, filtrar e remover tarefa", async ({
  page,
}) => {
  await mockTarefasApi(page);
  await page.goto("/");
  await expect(page.getByText("Nenhuma tarefa por aqui.")).toBeVisible();

  await page.getByLabel(/Título/).fill("Estudar FastAPI");
  await page.getByLabel("Descrição").fill("capítulo 3");
  await page.getByLabel("Prioridade").selectOption("alta");
  await page.getByRole("button", { name: "Adicionar tarefa" }).click();

  await page.getByLabel(/Título/).fill("Lavar louça");
  await page.getByLabel("Prioridade").selectOption("baixa");
  await page.getByRole("button", { name: "Adicionar tarefa" }).click();

  const resumo = page.getByRole("region", { name: "Resumo das tarefas" });
  await expect(resumo.locator("dd")).toHaveText(["2", "2", "0"]);

  await page
    .getByRole("checkbox", { name: 'Marcar "Estudar FastAPI" como concluída' })
    .click();
  await expect(resumo.locator("dd")).toHaveText(["2", "2", "1"]);

  await page.getByRole("button", { name: "Alta" }).click();
  const cards = page.getByRole("listitem");
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("Estudar FastAPI");

  await page.getByRole("button", { name: 'Remover "Estudar FastAPI"' }).click();
  await page.getByRole("button", { name: "Todas" }).click();
  await expect(cards).toHaveCount(1);
  await expect(resumo.locator("dd")).toHaveText(["1", "1", "0"]);
});

test("as tarefas persistem ao recarregar a página", async ({ page }) => {
  await mockTarefasApi(page);
  await page.goto("/");

  await page.getByLabel(/Título/).fill("Persistida");
  await page.getByRole("button", { name: "Adicionar tarefa" }).click();
  await expect(page.getByText("Persistida")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Persistida")).toBeVisible();
  const resumo = page.getByRole("region", { name: "Resumo das tarefas" });
  await expect(resumo.locator("dd")).toHaveText(["1", "1", "0"]);
});

test("mostra erro e lista vazia quando a API está fora", async ({ page }) => {
  await page.route("**/tarefas**", (route) => route.abort());
  await page.goto("/");

  await expect(page.getByRole("alert")).toContainText(
    "Não foi possível conectar ao servidor",
  );
});

test("não envia o formulário inválido para a API", async ({ page }) => {
  await mockTarefasApi(page);
  const chamadas = [];
  page.on("request", (req) => {
    if (["fetch", "xhr"].includes(req.resourceType()))
      chamadas.push(`${req.method()} ${new URL(req.url()).pathname}`);
  });
  await page.goto("/");

  await page.getByRole("button", { name: "Adicionar tarefa" }).click();
  await expect(page.getByRole("alert")).toHaveText("Dê um título à tarefa.");
  expect(chamadas).toEqual(["GET /tarefas"]);
});

test("não gera rolagem horizontal em telas estreitas", async ({ page }) => {
  await mockTarefasApi(page);
  await page.goto("/");
  await page
    .getByLabel(/Título/)
    .fill(`Tarefa ${"comprida ".repeat(20)}`);
  await page.getByRole("button", { name: "Adicionar tarefa" }).click();
  const semOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(semOverflow).toBe(true);
});
