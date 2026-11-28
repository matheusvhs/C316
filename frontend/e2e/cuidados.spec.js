import { expect, test } from "@playwright/test";
import { cadastrarPet, dataLocal, nomeUnico, removerPet } from "./apoio.js";

test.describe("Cuidado e alerta", () => {
  const nome = nomeUnico("E2E Cuidado");

  test.afterEach(async ({ request }) => {
    await removerPet(request, nome);
  });

  test("registra um vermífugo, mostra o alerta amarelo e impede excluir o pet", async ({
    page,
  }) => {
    await page.goto("/");
    await cadastrarPet(page, {
      nome,
      especie: "cachorro",
      nascimento: "2020-01-15",
      peso: "12,5",
    });
    await page.getByLabel("Buscar por nome").fill(nome);
    await page.getByRole("link", { name: `Abrir ${nome}` }).click();
    await expect(page.getByRole("heading", { name: nome })).toBeVisible();
    await expect(
      page.getByText("Nenhum cuidado com próxima data registrada."),
    ).toBeVisible();

    const formulario = page.getByRole("region", { name: "Registrar cuidado" });
    await formulario.getByLabel("Tipo").selectOption("vermifugo");
    await expect(
      formulario.getByRole("textbox", { name: "Data", exact: true }),
    ).toHaveValue(dataLocal(0));
    await formulario.getByLabel("Custo (R$)").fill("35,90");
    await formulario.getByLabel("Próxima data").fill(dataLocal(3));
    await formulario.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByText("Vermífugo registrado.")).toBeVisible();
    const alerta = page.locator('[data-status="proximo"]');
    await expect(alerta).toContainText("Vermífugo");
    await expect(alerta).toContainText("vence em 3 dias");
    await expect(alerta).toHaveCSS("background-color", /251, 235|oklch\(0\.98/);
    await expect(page.getByRole("row").nth(1)).toContainText("R$ 35,90");

    await page.getByRole("link", { name: "← Voltar para os pets" }).click();
    await page.getByLabel("Buscar por nome").fill(nome);
    await page.getByRole("button", { name: `Excluir ${nome}` }).click();
    const dialogo = page.getByRole("dialog", { name: "Excluir pet" });
    await dialogo.getByRole("button", { name: "Excluir" }).click();

    await expect(dialogo.getByRole("alert")).toHaveText(
      "Exclua os cuidados antes de remover o pet",
    );
    await dialogo.getByRole("button", { name: "Cancelar" }).click();
    await expect(
      page.getByRole("article").filter({ hasText: nome }),
    ).toBeVisible();
  });
});
