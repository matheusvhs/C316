import { describe, expect, it } from "vitest";
import { montarConsulta } from "../src/services/consulta.js";
import {
  calcularIdade,
  formatarData,
  formatarIdade,
  formatarMoeda,
  formatarPeso,
  hojeIso,
  textoPrazo,
} from "../src/utils/formatacao.js";
import { validarCuidado, validarPet } from "../src/utils/validacao.js";

const HOJE = "2026-11-27";

describe("formatação", () => {
  it("formata data, moeda e peso em pt-BR", () => {
    expect(formatarData("2026-03-05")).toBe("05/03/2026");
    expect(formatarMoeda("1234.5")).toBe("R$\u00a01.234,50");
    expect(formatarPeso("12.50")).toBe("12,5 kg");
  });

  it.each([
    ["2020-01-15", "2026-01-14", { anos: 5, meses: 11 }, "5 anos e 11 meses"],
    ["2020-01-15", "2026-01-15", { anos: 6, meses: 0 }, "6 anos"],
    ["2020-01-31", "2020-02-29", { anos: 0, meses: 0 }, "Menos de 1 mês"],
    ["2025-10-27", "2026-11-27", { anos: 1, meses: 1 }, "1 ano e 1 mês"],
  ])("calcula a idade de %s em %s", (nascimento, hoje, idade, texto) => {
    const [ano, mes, dia] = hoje.split("-").map(Number);
    const resultado = calcularIdade(nascimento, new Date(ano, mes - 1, dia));
    expect(resultado).toEqual(idade);
    expect(formatarIdade(resultado)).toBe(texto);
  });

  it("monta a data de hoje pelo horário local", () => {
    expect(hojeIso(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });

  it.each([
    [-2, "venceu há 2 dias"],
    [-1, "venceu há 1 dia"],
    [0, "vence hoje"],
    [1, "vence em 1 dia"],
    [3, "vence em 3 dias"],
  ])("descreve o prazo de %i dias", (dias, texto) => {
    expect(textoPrazo(dias)).toBe(texto);
  });
});

describe("montarConsulta", () => {
  it("ignora filtros vazios e codifica os valores", () => {
    expect(montarConsulta({ busca: "  ", especie: "" })).toBe("");
    expect(montarConsulta({ busca: " 50% R_x ", especie: "gato" })).toBe(
      "?busca=50%25+R_x&especie=gato",
    );
  });
});

describe("validarPet", () => {
  const pet = {
    nome: "Rex",
    especie: "cachorro",
    raca: "",
    data_nascimento: "2020-01-15",
    peso_kg: "12,5",
  };

  it("aceita um pet válido e os limites", () => {
    expect(validarPet(pet, HOJE)).toEqual({});
    expect(validarPet({ ...pet, data_nascimento: HOJE }, HOJE)).toEqual({});
    expect(validarPet({ ...pet, peso_kg: "150" }, HOJE)).toEqual({});
  });

  it.each([
    ["nome", { nome: " R " }, "Deve ter pelo menos 2 caracteres"],
    ["especie", { especie: "" }, "Escolha uma opção válida"],
    ["raca", { raca: "x".repeat(61) }, "Deve ter no máximo 60 caracteres"],
    ["data_nascimento", { data_nascimento: "" }, "Campo obrigatório"],
    [
      "data_nascimento",
      { data_nascimento: "2026-11-28" },
      "A data não pode ser futura",
    ],
    ["peso_kg", { peso_kg: "0" }, "Deve ser maior que 0"],
    ["peso_kg", { peso_kg: "150,01" }, "Deve ser no máximo 150"],
    [
      "peso_kg",
      { peso_kg: "1,234" },
      "Informe um número com no máximo 2 casas decimais",
    ],
  ])("recusa %s inválido (%j)", (campo, alteracao, mensagem) => {
    expect(validarPet({ ...pet, ...alteracao }, HOJE)).toEqual({
      [campo]: mensagem,
    });
  });
});

describe("validarCuidado", () => {
  const cuidado = {
    tipo: "banho",
    data: "2026-11-20",
    custo: "50",
    descricao: "",
    proxima_data: "",
  };
  const NASCIMENTO = "2020-01-15";

  it("aceita um cuidado válido, custo 0 e data no nascimento", () => {
    expect(validarCuidado(cuidado, NASCIMENTO, HOJE)).toEqual({});
    expect(
      validarCuidado({ ...cuidado, custo: "0" }, NASCIMENTO, HOJE),
    ).toEqual({});
    expect(
      validarCuidado({ ...cuidado, data: NASCIMENTO }, NASCIMENTO, HOJE),
    ).toEqual({});
  });

  it.each([
    ["tipo", { tipo: "" }, "Escolha uma opção válida"],
    ["data", { data: "2026-11-28" }, "A data não pode ser futura"],
    [
      "data",
      { data: "2019-12-31" },
      "O cuidado não pode ser anterior ao nascimento do pet",
    ],
    ["custo", { custo: "" }, "Campo obrigatório"],
    ["custo", { custo: "-1" }, "Deve ser maior ou igual a 0"],
    ["custo", { custo: "100000000" }, "Número grande demais"],
    [
      "descricao",
      { tipo: "vacina", descricao: "  " },
      "Informe o nome da vacina",
    ],
    [
      "proxima_data",
      { proxima_data: "2026-11-20" },
      "A próxima data deve ser depois da data do cuidado",
    ],
  ])("recusa %s inválido (%j)", (campo, alteracao, mensagem) => {
    expect(
      validarCuidado({ ...cuidado, ...alteracao }, NASCIMENTO, HOJE),
    ).toEqual({ [campo]: mensagem });
  });
});
