import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import App from "../../src/App";

async function criarItem(user, { nome, categoria = "outros" }) {
  await user.type(screen.getByLabelText(/Nome/), nome);
  await user.selectOptions(screen.getByLabelText("Categoria"), categoria);
  await user.click(screen.getByRole("button", { name: "Adicionar item" }));
}

function valoresDoResumo() {
  const resumo = screen.getByRole("region", { name: "Resumo dos itens" });
  return [...resumo.querySelectorAll("dd")].map((dd) => dd.textContent);
}

it("cria e remove itens atualizando o resumo", async () => {
  const user = userEvent.setup();
  render(<App />);
  expect(screen.getByText("Nenhum item por aqui.")).toBeInTheDocument();

  await criarItem(user, { nome: "Fone", categoria: "casa" });
  await criarItem(user, { nome: "Relatório", categoria: "trabalho" });
  expect(valoresDoResumo()).toEqual(["2", "2", "2"]);
  expect(screen.getAllByRole("listitem")).toHaveLength(2);

  await user.click(screen.getByRole("button", { name: 'Remover "Fone"' }));
  expect(screen.getAllByRole("listitem")).toHaveLength(1);
  expect(screen.queryByText("Fone")).not.toBeInTheDocument();
  expect(valoresDoResumo()).toEqual(["1", "1", "1"]);
});

it("filtra a lista por categoria", async () => {
  const user = userEvent.setup();
  render(<App />);
  await criarItem(user, { nome: "Livro", categoria: "estudos" });
  await criarItem(user, { nome: "Chave", categoria: "casa" });

  await user.click(screen.getByRole("button", { name: "Estudos" }));
  expect(screen.getAllByRole("listitem")).toHaveLength(1);
  expect(screen.getByText("Livro")).toBeInTheDocument();
  expect(valoresDoResumo()).toEqual(["2", "1", "2"]);

  await user.click(screen.getByRole("button", { name: "Todas" }));
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
});

it("mantém a lista vazia quando o envio é inválido", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Adicionar item" }));
  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(screen.getByText("Nenhum item por aqui.")).toBeInTheDocument();
});
