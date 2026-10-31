import { describe, expect, it } from "vitest";
import { LIMITES, validarItem } from "../../src/utils/validarItem";

describe("validarItem", () => {
  it.each(["", "   ", "\t\n "])("exige nome preenchido: %j", (nome) => {
    const { erros } = validarItem({ nome });
    expect(erros.nome).toBe("Dê um nome ao item.");
  });

  it("aceita nome no limite e rejeita um caractere a mais", () => {
    const noLimite = validarItem({ nome: "x".repeat(LIMITES.nome) });
    expect(noLimite.erros).toEqual({});

    const acima = validarItem({ nome: "x".repeat(LIMITES.nome + 1) });
    expect(acima.erros.nome).toContain("100 caracteres");
  });

  it("rejeita descrição acima do limite", () => {
    const { erros } = validarItem({
      nome: "ok",
      descricao: "d".repeat(LIMITES.descricao + 1),
    });
    expect(erros.descricao).toContain("500 caracteres");
  });

  it("rejeita categoria desconhecida", () => {
    const { erros } = validarItem({ nome: "ok", categoria: "urgente" });
    expect(erros.categoria).toBe("Escolha uma categoria válida.");
  });

  it("usa 'outros' quando a categoria não é informada", () => {
    const { dados } = validarItem({ nome: "ok" });
    expect(dados.categoria).toBe("outros");
  });

  it("remove espaços das extremidades dos campos de texto", () => {
    const { erros, dados } = validarItem({
      nome: "  Fone bluetooth  ",
      descricao: "  da gaveta  ",
      categoria: "casa",
    });
    expect(erros).toEqual({});
    expect(dados).toEqual({
      nome: "Fone bluetooth",
      descricao: "da gaveta",
      categoria: "casa",
    });
  });
});
