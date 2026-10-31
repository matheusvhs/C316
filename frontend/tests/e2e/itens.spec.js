import { expect, test } from "@playwright/test";

test("abre a página com resumo zerado e lista vazia", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Gerenciador de Itens" }),
  ).toBeVisible();
  await expect(page.getByText("Nenhum item por aqui.")).toBeVisible();
  const resumo = page.getByRole("region", { name: "Resumo dos itens" });
  await expect(resumo.locator("dd")).toHaveText(["0", "0", "0"]);
});

test("fluxo completo: criar, filtrar e remover item", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel(/Nome/).fill("Fone bluetooth");
  await page.getByLabel("Descrição").fill("da gaveta");
  await page.getByLabel("Categoria").selectOption("casa");
  await page.getByRole("button", { name: "Adicionar item" }).click();

  await page.getByLabel(/Nome/).fill("Relatório");
  await page.getByLabel("Categoria").selectOption("trabalho");
  await page.getByRole("button", { name: "Adicionar item" }).click();

  const resumo = page.getByRole("region", { name: "Resumo dos itens" });
  await expect(resumo.locator("dd")).toHaveText(["2", "2", "2"]);

  await page.getByRole("button", { name: "Casa" }).click();
  const cards = page.getByRole("listitem");
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("Fone bluetooth");
  await expect(resumo.locator("dd")).toHaveText(["2", "1", "2"]);

  await page.getByRole("button", { name: 'Remover "Fone bluetooth"' }).click();
  await expect(cards).toHaveCount(0);
  await page.getByRole("button", { name: "Todas" }).click();
  await expect(cards).toHaveCount(1);
});

test("não chama a API e perde o estado ao recarregar", async ({ page }) => {
  const chamadas = [];
  page.on("request", (req) => {
    if (["fetch", "xhr"].includes(req.resourceType())) chamadas.push(req.url());
  });
  await page.goto("/");

  await page.getByRole("button", { name: "Adicionar item" }).click();
  await expect(page.getByRole("alert")).toHaveText("Dê um nome ao item.");

  await page.getByLabel(/Nome/).fill("Livro de redes");
  await page.getByRole("button", { name: "Adicionar item" }).click();
  await expect(page.getByRole("listitem")).toHaveCount(1);
  expect(chamadas).toEqual([]);

  await page.reload();
  await expect(page.getByText("Nenhum item por aqui.")).toBeVisible();
});

test("não gera rolagem horizontal em telas estreitas", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel(/Nome/).fill(`Item ${"comprido ".repeat(20)}`);
  await page.getByRole("button", { name: "Adicionar item" }).click();
  const semOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(semOverflow).toBe(true);
});
