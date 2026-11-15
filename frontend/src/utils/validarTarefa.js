export const PRIORIDADES = ["baixa", "media", "alta"];

export const LIMITES = { titulo: 120, descricao: 500 };

// Devolve { erros, dados }: erros vazio significa entrada válida e dados traz
// os campos já normalizados para criar a tarefa na API.
export function validarTarefa({ titulo, descricao, prioridade }) {
  const dados = {
    titulo: (titulo ?? "").trim(),
    descricao: (descricao ?? "").trim(),
    prioridade: prioridade || "media",
  };
  const erros = {};

  if (dados.titulo.length === 0) {
    erros.titulo = "Dê um título à tarefa.";
  } else if (dados.titulo.length > LIMITES.titulo) {
    erros.titulo = `Título muito longo (máximo de ${LIMITES.titulo} caracteres).`;
  }
  if (dados.descricao.length > LIMITES.descricao) {
    erros.descricao = `Descrição muito longa (máximo de ${LIMITES.descricao} caracteres).`;
  }
  if (!PRIORIDADES.includes(dados.prioridade)) {
    erros.prioridade = "Escolha uma prioridade válida.";
  }

  return { erros, dados };
}
