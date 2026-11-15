const TAREFAS_URL = "/tarefas";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new Error(
      "Não foi possível conectar ao servidor. Verifique se a aplicação está ativa.",
    );
  }

  const payload =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const detalhe = payload?.detail;
    throw new Error(
      typeof detalhe === "string"
        ? detalhe
        : "Não foi possível concluir a operação.",
    );
  }
  return payload;
}

export const listarTarefas = (limit = 100) =>
  request(`${TAREFAS_URL}?limit=${limit}`);

export const criarTarefa = (tarefa) =>
  request(TAREFAS_URL, { method: "POST", body: JSON.stringify(tarefa) });

export const atualizarTarefa = (id, mudancas) =>
  request(`${TAREFAS_URL}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(mudancas),
  });

export const removerTarefa = (id) =>
  request(`${TAREFAS_URL}/${id}`, { method: "DELETE" });
