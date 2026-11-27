import { ESPECIES, hojeIso, TIPOS_CUIDADO } from "./formatacao.js";

const DECIMAL_COM_ATE_2_CASAS = /^\d+([.,]\d{1,2})?$/;

export function paraNumero(texto) {
  return Number(String(texto).trim().replace(",", "."));
}

export function validarPet(dados, hoje = hojeIso()) {
  const erros = {};
  const nome = dados.nome.trim();
  if (nome.length < 2) erros.nome = "Deve ter pelo menos 2 caracteres";
  else if (nome.length > 60) erros.nome = "Deve ter no máximo 60 caracteres";

  if (!ESPECIES.some((especie) => especie.valor === dados.especie)) {
    erros.especie = "Escolha uma opção válida";
  }

  if (dados.raca.trim().length > 60) {
    erros.raca = "Deve ter no máximo 60 caracteres";
  }

  if (!dados.data_nascimento) erros.data_nascimento = "Campo obrigatório";
  else if (dados.data_nascimento > hoje) {
    erros.data_nascimento = "A data não pode ser futura";
  }

  const peso = String(dados.peso_kg).trim();
  if (!peso) erros.peso_kg = "Campo obrigatório";
  else if (!DECIMAL_COM_ATE_2_CASAS.test(peso)) {
    erros.peso_kg = "Informe um número com no máximo 2 casas decimais";
  } else if (paraNumero(peso) <= 0) erros.peso_kg = "Deve ser maior que 0";
  else if (paraNumero(peso) > 150) erros.peso_kg = "Deve ser no máximo 150";

  return erros;
}

export function errosPorCampo(erros) {
  return Object.fromEntries(
    erros.map(({ campo, mensagem }) => [campo, mensagem]),
  );
}

export function validarCuidado(dados, nascimento, hoje = hojeIso()) {
  const erros = {};
  if (!TIPOS_CUIDADO.some((tipo) => tipo.valor === dados.tipo)) {
    erros.tipo = "Escolha uma opção válida";
  }

  if (!dados.data) erros.data = "Campo obrigatório";
  else if (dados.data > hoje) erros.data = "A data não pode ser futura";
  else if (nascimento && dados.data < nascimento) {
    erros.data = "O cuidado não pode ser anterior ao nascimento do pet";
  }

  const custo = String(dados.custo).trim();
  if (!custo) erros.custo = "Campo obrigatório";
  else if (custo.startsWith("-")) erros.custo = "Deve ser maior ou igual a 0";
  else if (!DECIMAL_COM_ATE_2_CASAS.test(custo)) {
    erros.custo = "Informe um número com no máximo 2 casas decimais";
  } else if (paraNumero(custo) >= 100_000_000) {
    erros.custo = "Número grande demais";
  }

  const descricao = dados.descricao.trim();
  if (dados.tipo === "vacina" && !descricao) {
    erros.descricao = "Informe o nome da vacina";
  } else if (descricao.length > 255) {
    erros.descricao = "Deve ter no máximo 255 caracteres";
  }

  if (dados.proxima_data && dados.data && dados.proxima_data <= dados.data) {
    erros.proxima_data = "A próxima data deve ser depois da data do cuidado";
  }

  return erros;
}
