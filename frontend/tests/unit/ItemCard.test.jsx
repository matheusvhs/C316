import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { ItemCard } from "../../src/components/ItemCard";

const item = {
  id: "i1",
  nome: "Fone bluetooth",
  descricao: "da gaveta",
  categoria: "casa",
};

it("mostra nome, descrição e selo da categoria", () => {
  render(
    <ul>
      <ItemCard item={item} onRemover={() => {}} />
    </ul>,
  );
  expect(screen.getByText("Fone bluetooth")).toBeInTheDocument();
  expect(screen.getByText("da gaveta")).toBeInTheDocument();
  expect(screen.getByText("Casa")).toBeInTheDocument();
});

it("dispara onRemover com o id do item", async () => {
  const user = userEvent.setup();
  const onRemover = vi.fn();
  render(
    <ul>
      <ItemCard item={item} onRemover={onRemover} />
    </ul>,
  );
  await user.click(
    screen.getByRole("button", { name: 'Remover "Fone bluetooth"' }),
  );
  expect(onRemover).toHaveBeenCalledExactlyOnceWith("i1");
});
