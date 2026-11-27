import { expect, test } from "@playwright/test";
import { cadastrarPet, nomeUnico, removerPet } from "./apoio.js";

test.describe("CRUD do pet", () => {
  const nome = nomeUnico("E2E Pet");

  test.afterEach(async ({ request }) => {
    await removerPet(request, nome);
  });

  test("cadastra, recarrega, edita o peso e exclui", async ({ page }) => {
    await page.goto("/");
    await cadastrarPet(page, {
      nome,
      especie: "gato",
      nascimento: "2022-05-10",
      peso: "4,5",
    });

    await page.reload();
    await page.getByLabel("Buscar por nome").fill(nome);
    const card = page.getByRole("article").filter({ hasText: nome });
    await expect(card).toBeVisible();
    await expect(card).toContainText("Gato");

    await card.getByRole("button", { name: `Editar ${nome}` }).click();
    const edicao = page.getByRole("dialog", { name: `Editar ${nome}` });
    await expect(edicao.getByLabel("Peso (kg)")).toHaveValue("4,50");
    await edicao.getByLabel("Peso (kg)").fill("5,25");
    await edicao.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText(`${nome} foi atualizado.`)).toBeVisible();

    await card.getByRole("link", { name: `Abrir ${nome}` }).click();
    await expect(page.getByRole("heading", { name: nome })).toBeVisible();
    await expect(page.getByText("5,25 kg")).toBeVisible();
    await page.getByRole("link", { name: "← Voltar para os pets" }).click();

    await page.getByLabel("Buscar por nome").fill(nome);
    await card.getByRole("button", { name: `Excluir ${nome}` }).click();
    await page
      .getByRole("dialog", { name: "Excluir pet" })
      .getByRole("button", { name: "Excluir" })
      .click();

    await expect(page.getByText(`${nome} foi excluído.`)).toBeVisible();
    await expect(card).toHaveCount(0);
    await page.reload();
    await page.getByLabel("Buscar por nome").fill(nome);
    await expect(
      page.getByText("Nenhum pet encontrado com esses filtros."),
    ).toBeVisible();
  });
});
