import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import PaginaDetalhePet from "../src/pages/PaginaDetalhePet.jsx";
import { hojeIso } from "../src/utils/formatacao.js";
import { chamadas, simularApi } from "./apiFalsa.js";

const PET = {
  id: 1,
  nome: "Rex",
  especie: "cachorro",
  raca: null,
  data_nascimento: "2020-01-15",
  peso_kg: "12.50",
};
const RESUMO = {
  idade: { anos: 6, meses: 10 },
  total_gasto: "120.00",
  quantidade_cuidados: 1,
  ultimo_cuidado: "2025-11-22",
};
const VACINA = {
  id: 10,
  pet_id: 1,
  tipo: "vacina",
  data: "2025-11-22",
  custo: "120.00",
  descricao: "V10",
  proxima_data: "2026-11-22",
};
const ALERTAS = [
  {
    cuidado_id: 10,
    tipo: "vacina",
    descricao: "V10",
    proxima_data: "2026-11-22",
    dias_restantes: -5,
    status: "vencido",
  },
  {
    cuidado_id: 11,
    tipo: "vermifugo",
    descricao: null,
    proxima_data: "2026-11-30",
    dias_restantes: 3,
    status: "proximo",
  },
  {
    cuidado_id: 12,
    tipo: "antipulgas",
    descricao: null,
    proxima_data: "2026-12-17",
    dias_restantes: 20,
    status: "em_dia",
  },
];

function rotasDoPet(extras = {}) {
  return {
    "GET /pets/1": () => [200, PET],
    "GET /pets/1/resumo": () => [200, RESUMO],
    "GET /pets/1/alertas": () => [200, ALERTAS],
    "GET /pets/1/cuidados": () => [200, [VACINA]],
    ...extras,
  };
}

function renderizar(caminho = "/pets/1") {
  render(
    <MemoryRouter initialEntries={[caminho]}>
      <Routes>
        <Route path="/pets/:id" element={<PaginaDetalhePet />} />
      </Routes>
    </MemoryRouter>,
  );
  return userEvent.setup();
}

describe("PaginaDetalhePet", () => {
  it("mostra o cabeçalho, o resumo, os alertas coloridos e os cuidados", async () => {
    simularApi(rotasDoPet());
    renderizar();

    expect(
      await screen.findByRole("heading", { name: "Rex" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Cachorro · 6 anos e 10 meses · 12,5 kg"),
    ).toBeInTheDocument();
    expect(screen.getByText("Total gasto").nextSibling).toHaveTextContent(
      "R$ 120,00",
    );

    const alertas = screen.getAllByRole("listitem");
    expect(alertas.map((alerta) => alerta.dataset.status)).toEqual([
      "vencido",
      "proximo",
      "em_dia",
    ]);
    expect(alertas[0]).toHaveTextContent("venceu há 5 dias");
    expect(alertas[1]).toHaveTextContent("vence em 3 dias");
    expect(alertas[1]).toHaveClass("bg-amber-50");

    const linhas = await screen.findAllByRole("row");
    expect(linhas[1]).toHaveTextContent("22/11/2025VacinaV10R$ 120,00");
  });

  it("filtra os cuidados por tipo", async () => {
    const fetch = simularApi(rotasDoPet());
    const usuario = renderizar();
    await screen.findByRole("heading", { name: "Rex" });

    await usuario.selectOptions(
      screen.getByLabelText("Filtrar por tipo"),
      "banho",
    );

    const [ultima] = chamadas(fetch, "GET", "/pets/1/cuidados").slice(-1);
    expect(ultima[0]).toBe("http://api.teste/pets/1/cuidados?tipo=banho");
  });

  it("registra um cuidado e recarrega o resumo e os alertas", async () => {
    const fetch = simularApi(
      rotasDoPet({
        "POST /pets/1/cuidados": ({ corpo }) => [201, { id: 11, ...corpo }],
      }),
    );
    const usuario = renderizar();
    await screen.findByRole("heading", { name: "Rex" });
    const formulario = screen.getByRole("region", {
      name: "Registrar cuidado",
    });

    await usuario.selectOptions(
      within(formulario).getByLabelText(/Tipo/),
      "vermifugo",
    );
    await usuario.type(within(formulario).getByLabelText(/Custo/), "35,9");
    await usuario.click(
      within(formulario).getByRole("button", { name: "Salvar" }),
    );

    expect(
      await screen.findByText("Vermífugo registrado."),
    ).toBeInTheDocument();
    expect(
      JSON.parse(chamadas(fetch, "POST", "/pets/1/cuidados")[0][1].body),
    ).toEqual({
      tipo: "vermifugo",
      data: hojeIso(),
      custo: 35.9,
      descricao: null,
      proxima_data: null,
    });
    expect(
      chamadas(fetch, "GET", "/pets/1/resumo").length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      chamadas(fetch, "GET", "/pets/1/alertas").length,
    ).toBeGreaterThanOrEqual(2);
    expect(within(formulario).getByLabelText(/Custo/)).toHaveValue("");
  });

  it("avisa quando o pet não existe", async () => {
    simularApi({
      "GET /pets/99": () => [404, { detail: "Pet não encontrado" }],
      "GET /pets/99/resumo": () => [404, { detail: "Pet não encontrado" }],
      "GET /pets/99/alertas": () => [404, { detail: "Pet não encontrado" }],
      "GET /pets/99/cuidados": () => [404, { detail: "Pet não encontrado" }],
    });
    renderizar("/pets/99");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Pet não encontrado",
    );
    expect(
      screen.queryByRole("button", { name: "Tentar novamente" }),
    ).not.toBeInTheDocument();
  });
});
