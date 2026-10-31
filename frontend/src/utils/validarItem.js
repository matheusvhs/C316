export const CATEGORIAS = ["casa", "trabalho", "estudos", "outros"];

export const LIMITES = { nome: 100, descricao: 500 };

// Devolve { erros, dados }: erros vazio significa entrada válida e dados traz
// os campos já normalizados para criar o item.
export function validarItem({ nome, descricao, categoria }) {
  const dados = {
    nome: (nome ?? "").trim(),
    descricao: (descricao ?? "").trim(),
    categoria: categoria || "outros",
  };
  const erros = {};

  if (dados.nome.length === 0) {
    erros.nome = "Dê um nome ao item.";
  } else if (dados.nome.length > LIMITES.nome) {
    erros.nome = `Nome muito longo (máximo de ${LIMITES.nome} caracteres).`;
  }
  if (dados.descricao.length > LIMITES.descricao) {
    erros.descricao = `Descrição muito longa (máximo de ${LIMITES.descricao} caracteres).`;
  }
  if (!CATEGORIAS.includes(dados.categoria)) {
    erros.categoria = "Escolha uma categoria válida.";
  }

  return { erros, dados };
}
