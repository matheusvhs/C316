const API_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  constructor(mensagem, status, erros = []) {
    super(mensagem);
    this.name = "ApiError";
    this.status = status;
    this.erros = erros;
  }
}

async function lerCorpo(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function request(path, options = {}) {
  const { body, headers, ...resto } = options;
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...resto,
      headers:
        body === undefined
          ? headers
          : { "Content-Type": "application/json", ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Não foi possível conectar à API", 0);
  }

  if (!response.ok) {
    const corpo = await lerCorpo(response);
    throw new ApiError(
      corpo?.detail ?? `Erro inesperado (status ${response.status})`,
      response.status,
      corpo?.erros ?? [],
    );
  }

  return response.status === 204 ? null : response.json();
}
