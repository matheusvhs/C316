import { request } from "./api.js";
import { montarConsulta } from "./consulta.js";

export function listarCuidados(petId, { tipo } = {}) {
  return request(`/pets/${petId}/cuidados${montarConsulta({ tipo })}`);
}

export function criarCuidado(petId, dados) {
  return request(`/pets/${petId}/cuidados`, { method: "POST", body: dados });
}

export function atualizarCuidado(id, dados) {
  return request(`/cuidados/${id}`, { method: "PUT", body: dados });
}

export function excluirCuidado(id) {
  return request(`/cuidados/${id}`, { method: "DELETE" });
}

export function obterAlertas(petId) {
  return request(`/pets/${petId}/alertas`);
}
