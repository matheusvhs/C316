import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import FormularioCuidado from "../src/components/FormularioCuidado.jsx";

function renderizar() {
  const onSalvar = vi.fn().mockResolvedValue();
  render(<FormularioCuidado nascimento="2020-01-15" onSalvar={onSalvar} />);
  return { onSalvar, usuario: userEvent.setup() };
}

describe("FormularioCuidado", () => {
  it("exige o nome quando o tipo é vacina", async () => {
    const { onSalvar, usuario } = renderizar();

    expect(screen.getByLabelText("Descrição")).toBeInTheDocument();
    await usuario.selectOptions(screen.getByLabelText(/Tipo/), "vacina");
    await usuario.type(screen.getByLabelText(/Custo/), "80");
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByLabelText(/Nome da vacina/)).toHaveAccessibleDescription(
      "Informe o nome da vacina",
    );
    expect(onSalvar).not.toHaveBeenCalled();
  });

  it("envia o cuidado com os valores convertidos", async () => {
    const { onSalvar, usuario } = renderizar();
    const data = screen.getByLabelText(/^Data/);

    await usuario.selectOptions(screen.getByLabelText(/Tipo/), "vermifugo");
    await usuario.clear(data);
    await usuario.type(data, "2026-01-10");
    await usuario.type(screen.getByLabelText(/Custo/), "35,90");
    await usuario.type(screen.getByLabelText(/Próxima data/), "2026-04-10");
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSalvar).toHaveBeenCalledWith({
      tipo: "vermifugo",
      data: "2026-01-10",
      custo: 35.9,
      descricao: null,
      proxima_data: "2026-04-10",
    });
  });
});
