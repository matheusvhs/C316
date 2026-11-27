import { request } from "./api.js";
import { montarConsulta } from "./consulta.js";

export function listarPets({ busca, especie } = {}) {
  return request(`/pets${montarConsulta({ busca, especie })}`);
}

export function obterPet(id) {
  return request(`/pets/${id}`);
}

export function criarPet(dados) {
  return request("/pets", { method: "POST", body: dados });
}

export function atualizarPet(id, dados) {
  return request(`/pets/${id}`, { method: "PUT", body: dados });
}

export function excluirPet(id) {
  return request(`/pets/${id}`, { method: "DELETE" });
}

export function obterResumo(id) {
  return request(`/pets/${id}/resumo`);
}
