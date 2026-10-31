import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { FormularioItem } from "../../src/components/FormularioItem";

it("não envia sem nome e sinaliza o campo", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(<FormularioItem onSubmit={onSubmit} />);
  await user.click(screen.getByRole("button", { name: "Adicionar item" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Dê um nome ao item.");
  expect(screen.getByLabelText(/Nome/)).toHaveAttribute("aria-invalid", "true");
  expect(onSubmit).not.toHaveBeenCalled();
});

it("envia os dados normalizados com a categoria escolhida", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(<FormularioItem onSubmit={onSubmit} />);
  await user.type(screen.getByLabelText(/Nome/), "  Fone bluetooth  ");
  await user.type(screen.getByLabelText("Descrição"), "  da gaveta  ");
  await user.selectOptions(screen.getByLabelText("Categoria"), "casa");
  await user.click(screen.getByRole("button", { name: "Adicionar item" }));
  expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
    nome: "Fone bluetooth",
    descricao: "da gaveta",
    categoria: "casa",
  });
  expect(screen.getByLabelText(/Nome/)).toHaveValue("");
  expect(screen.getByLabelText("Descrição")).toHaveValue("");
  expect(screen.getByLabelText("Categoria")).toHaveValue("outros");
});
