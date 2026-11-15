import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { FormularioTarefa } from "../../src/components/FormularioTarefa";

it("não envia sem título e sinaliza o campo", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(<FormularioTarefa onSubmit={onSubmit} />);
  await user.click(screen.getByRole("button", { name: "Adicionar tarefa" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Dê um título à tarefa.");
  expect(screen.getByLabelText(/Título/)).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect(onSubmit).not.toHaveBeenCalled();
});

it("envia os dados normalizados com a prioridade escolhida", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn().mockResolvedValue(true);
  render(<FormularioTarefa onSubmit={onSubmit} />);
  await user.type(screen.getByLabelText(/Título/), "  Estudar FastAPI  ");
  await user.type(screen.getByLabelText("Descrição"), "  capítulo 3  ");
  await user.selectOptions(screen.getByLabelText("Prioridade"), "alta");
  await user.click(screen.getByRole("button", { name: "Adicionar tarefa" }));
  expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
    titulo: "Estudar FastAPI",
    descricao: "capítulo 3",
    prioridade: "alta",
  });
  expect(screen.getByLabelText(/Título/)).toHaveValue("");
  expect(screen.getByLabelText("Descrição")).toHaveValue("");
  expect(screen.getByLabelText("Prioridade")).toHaveValue("media");
});

it("mantém o que foi digitado quando o envio falha", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn().mockResolvedValue(false);
  render(<FormularioTarefa onSubmit={onSubmit} />);
  await user.type(screen.getByLabelText(/Título/), "Estudar FastAPI");
  await user.click(screen.getByRole("button", { name: "Adicionar tarefa" }));
  expect(onSubmit).toHaveBeenCalledOnce();
  expect(screen.getByLabelText(/Título/)).toHaveValue("Estudar FastAPI");
});
