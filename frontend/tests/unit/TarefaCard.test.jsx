import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { TarefaCard } from "../../src/components/TarefaCard";

const tarefa = {
  id: 7,
  titulo: "Estudar FastAPI",
  descricao: "capítulo 3",
  prioridade: "alta",
  concluida: false,
};

it("mostra título, descrição e selo da prioridade", () => {
  render(
    <ul>
      <TarefaCard tarefa={tarefa} onAlternar={() => {}} onRemover={() => {}} />
    </ul>,
  );
  expect(screen.getByText("Estudar FastAPI")).toBeInTheDocument();
  expect(screen.getByText("capítulo 3")).toBeInTheDocument();
  expect(screen.getByText("Alta")).toBeInTheDocument();
});

it("dispara onAlternar ao marcar como concluída", async () => {
  const user = userEvent.setup();
  const onAlternar = vi.fn();
  render(
    <ul>
      <TarefaCard
        tarefa={tarefa}
        onAlternar={onAlternar}
        onRemover={() => {}}
      />
    </ul>,
  );
  await user.click(
    screen.getByRole("checkbox", {
      name: 'Marcar "Estudar FastAPI" como concluída',
    }),
  );
  expect(onAlternar).toHaveBeenCalledExactlyOnceWith(tarefa);
});

it("dispara onRemover com o id da tarefa", async () => {
  const user = userEvent.setup();
  const onRemover = vi.fn();
  render(
    <ul>
      <TarefaCard
        tarefa={tarefa}
        onAlternar={() => {}}
        onRemover={onRemover}
      />
    </ul>,
  );
  await user.click(
    screen.getByRole("button", { name: 'Remover "Estudar FastAPI"' }),
  );
  expect(onRemover).toHaveBeenCalledExactlyOnceWith(7);
});
