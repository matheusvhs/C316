import { describe, expect, it } from "vitest";
import { LIMITES, validarTarefa } from "../../src/utils/validarTarefa";

describe("validarTarefa", () => {
  it.each(["", "   ", "\t\n "])("exige título preenchido: %j", (titulo) => {
    const { erros } = validarTarefa({ titulo });
    expect(erros.titulo).toBe("Dê um título à tarefa.");
  });

  it("aceita título no limite e rejeita um caractere a mais", () => {
    const noLimite = validarTarefa({ titulo: "x".repeat(LIMITES.titulo) });
    expect(noLimite.erros).toEqual({});

    const acima = validarTarefa({ titulo: "x".repeat(LIMITES.titulo + 1) });
    expect(acima.erros.titulo).toContain("120 caracteres");
  });

  it("rejeita descrição acima do limite", () => {
    const { erros } = validarTarefa({
      titulo: "ok",
      descricao: "d".repeat(LIMITES.descricao + 1),
    });
    expect(erros.descricao).toContain("500 caracteres");
  });

  it("rejeita prioridade desconhecida", () => {
    const { erros } = validarTarefa({ titulo: "ok", prioridade: "urgente" });
    expect(erros.prioridade).toBe("Escolha uma prioridade válida.");
  });

  it("usa 'media' quando a prioridade não é informada", () => {
    const { dados } = validarTarefa({ titulo: "ok" });
    expect(dados.prioridade).toBe("media");
  });

  it("remove espaços das extremidades dos campos de texto", () => {
    const { erros, dados } = validarTarefa({
      titulo: "  Estudar FastAPI  ",
      descricao: "  capítulo 3  ",
      prioridade: "alta",
    });
    expect(erros).toEqual({});
    expect(dados).toEqual({
      titulo: "Estudar FastAPI",
      descricao: "capítulo 3",
      prioridade: "alta",
    });
  });
});
