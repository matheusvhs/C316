import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import FormularioPet from "../src/components/FormularioPet.jsx";
import { ApiError } from "../src/services/api.js";

function renderizar(props = {}) {
  const onSalvar = props.onSalvar ?? vi.fn().mockResolvedValue();
  render(<FormularioPet onSalvar={onSalvar} onCancelar={vi.fn()} {...props} />);
  return { onSalvar, usuario: userEvent.setup() };
}

async function preencher(usuario) {
  await usuario.type(screen.getByLabelText(/Nome/), "  Rex  ");
  await usuario.selectOptions(screen.getByLabelText(/Espécie/), "cachorro");
  await usuario.type(screen.getByLabelText(/Data de nascimento/), "2020-01-15");
  await usuario.type(screen.getByLabelText(/Peso/), "12,5");
}

describe("FormularioPet", () => {
  it("mostra os erros nos campos e não chama o service quando está vazio", async () => {
    const { onSalvar, usuario } = renderizar();

    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByLabelText(/Nome/)).toHaveAccessibleDescription(
      "Deve ter pelo menos 2 caracteres",
    );
    expect(screen.getByLabelText(/Espécie/)).toHaveAccessibleDescription(
      "Escolha uma opção válida",
    );
    expect(screen.getByLabelText(/Peso/)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(onSalvar).not.toHaveBeenCalled();
  });

  it("envia os dados limpos e convertidos ao salvar", async () => {
    const { onSalvar, usuario } = renderizar();

    await preencher(usuario);
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSalvar).toHaveBeenCalledWith({
      nome: "Rex",
      especie: "cachorro",
      raca: null,
      data_nascimento: "2020-01-15",
      peso_kg: 12.5,
    });
  });

  it("mostra o erro de conflito da API em destaque", async () => {
    const onSalvar = vi
      .fn()
      .mockRejectedValue(new ApiError("Já existe um pet com este nome", 409));
    const { usuario } = renderizar({ onSalvar });

    await preencher(usuario);
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Já existe um pet com este nome",
    );
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
  });

  it("leva os erros de validação da API para os campos", async () => {
    const onSalvar = vi
      .fn()
      .mockRejectedValue(
        new ApiError("Peso: Deve ser no máximo 150", 422, [
          { campo: "peso_kg", mensagem: "Deve ser no máximo 150" },
        ]),
      );
    const { usuario } = renderizar({ onSalvar });

    await preencher(usuario);
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Corrija os campos destacados.",
    );
    expect(screen.getByLabelText(/Peso/)).toHaveAccessibleDescription(
      "Deve ser no máximo 150",
    );
  });

  it("vem preenchido na edição", () => {
    renderizar({
      pet: {
        id: 1,
        nome: "Mia",
        especie: "gato",
        raca: null,
        data_nascimento: "2021-03-01",
        peso_kg: "4.20",
      },
    });

    expect(screen.getByLabelText(/Nome/)).toHaveValue("Mia");
    expect(screen.getByLabelText(/Espécie/)).toHaveValue("gato");
    expect(screen.getByLabelText(/Peso/)).toHaveValue("4,20");
  });
});
