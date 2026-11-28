import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import PaginaPets from "../src/pages/PaginaPets.jsx";
import { chamadas, simularApi } from "./apiFalsa.js";

const REX = {
  id: 1,
  nome: "Rex",
  especie: "cachorro",
  raca: "Vira-lata",
  data_nascimento: "2020-01-15",
  peso_kg: "12.50",
};
const MIA = {
  id: 2,
  nome: "Mia",
  especie: "gato",
  raca: null,
  data_nascimento: "2021-03-01",
  peso_kg: "4.20",
};

function renderizar() {
  render(
    <MemoryRouter>
      <PaginaPets />
    </MemoryRouter>,
  );
  return userEvent.setup();
}

describe("PaginaPets", () => {
  it("mostra o carregando e depois os cards", async () => {
    simularApi({ "GET /pets": () => [200, [MIA, REX]] });
    renderizar();

    expect(screen.getByRole("status")).toHaveTextContent("Carregando pets...");
    const cards = await screen.findAllByRole("article");

    expect(cards).toHaveLength(2);
    expect(within(cards[1]).getByText("Rex")).toBeInTheDocument();
    expect(within(cards[1]).getByText("Vira-lata")).toBeInTheDocument();
    expect(within(cards[0]).getByText("Não informada")).toBeInTheDocument();
    expect(
      within(cards[1]).getByRole("link", { name: "Abrir Rex" }),
    ).toHaveAttribute("href", "/pets/1");
  });

  it("mostra a mensagem de erro e tenta de novo", async () => {
    let falhar = true;
    simularApi({
      "GET /pets": () => {
        if (falhar) throw new TypeError("Failed to fetch");
        return [200, [REX]];
      },
    });
    const usuario = renderizar();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível conectar à API",
    );
    falhar = false;
    await usuario.click(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );

    expect(await screen.findByText("Rex")).toBeInTheDocument();
  });

  it("avisa quando não há pets", async () => {
    simularApi({ "GET /pets": () => [200, []] });
    renderizar();

    expect(
      await screen.findByText("Nenhum pet cadastrado ainda."),
    ).toBeInTheDocument();
  });

  it("filtra por espécie e por nome", async () => {
    const fetch = simularApi({
      "GET /pets": ({ search }) => [200, search.includes("gato") ? [MIA] : []],
    });
    const usuario = renderizar();
    await screen.findByText("Nenhum pet cadastrado ainda.");

    await usuario.selectOptions(screen.getByLabelText("Espécie"), "gato");
    await usuario.type(screen.getByLabelText("Buscar por nome"), "mi");

    expect(await screen.findByText("Mia")).toBeInTheDocument();
    const [ultima] = chamadas(fetch, "GET", "/pets").slice(-1);
    expect(ultima[0]).toBe("http://api.teste/pets?busca=mi&especie=gato");
  });

  it("exclui um pet depois da confirmação", async () => {
    let pets = [REX];
    const fetch = simularApi({
      "GET /pets": () => [200, pets],
      "DELETE /pets/1": () => {
        pets = [];
        return [204];
      },
    });
    const usuario = renderizar();

    await usuario.click(
      await screen.findByRole("button", { name: "Excluir Rex" }),
    );
    const dialogo = screen.getByRole("dialog", { name: "Excluir pet" });
    await usuario.click(
      within(dialogo).getByRole("button", { name: "Excluir" }),
    );

    expect(await screen.findByText("Rex foi excluído.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(chamadas(fetch, "DELETE", "/pets/1")).toHaveLength(1);
    expect(
      await screen.findByText("Nenhum pet cadastrado ainda."),
    ).toBeInTheDocument();
  });

  it("mostra o 409 quando o pet tem cuidados", async () => {
    simularApi({
      "GET /pets": () => [200, [REX]],
      "DELETE /pets/1": () => [
        409,
        { detail: "Exclua os cuidados antes de remover o pet" },
      ],
    });
    const usuario = renderizar();

    await usuario.click(
      await screen.findByRole("button", { name: "Excluir Rex" }),
    );
    const dialogo = screen.getByRole("dialog");
    await usuario.click(
      within(dialogo).getByRole("button", { name: "Excluir" }),
    );

    expect(await within(dialogo).findByRole("alert")).toHaveTextContent(
      "Exclua os cuidados antes de remover o pet",
    );
  });

  it("cadastra um pet pelo formulário e recarrega a lista", async () => {
    let pets = [];
    const fetch = simularApi({
      "GET /pets": () => [200, pets],
      "POST /pets": ({ corpo }) => {
        pets = [{ ...REX, ...corpo, id: 3 }];
        return [201, pets[0]];
      },
    });
    const usuario = renderizar();
    await screen.findByText("Nenhum pet cadastrado ainda.");

    await usuario.click(screen.getByRole("button", { name: "Novo pet" }));
    const dialogo = screen.getByRole("dialog", { name: "Novo pet" });
    await usuario.type(within(dialogo).getByLabelText(/Nome/), "Bolt");
    await usuario.selectOptions(
      within(dialogo).getByLabelText(/Espécie/),
      "cachorro",
    );
    await usuario.type(
      within(dialogo).getByLabelText(/Data de nascimento/),
      "2019-06-01",
    );
    await usuario.type(within(dialogo).getByLabelText(/Peso/), "20");
    await usuario.click(
      within(dialogo).getByRole("button", { name: "Salvar" }),
    );

    expect(await screen.findByText("Bolt foi cadastrado.")).toBeInTheDocument();
    expect(chamadas(fetch, "POST", "/pets")[0][1].body).toBe(
      '{"nome":"Bolt","especie":"cachorro","raca":null,"data_nascimento":"2019-06-01","peso_kg":20}',
    );
    expect(await screen.findByRole("article")).toHaveTextContent("Bolt");
  });
});
