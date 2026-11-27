import { vi } from "vitest";

export const API = "http://api.teste";

export function resposta(status, corpo) {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function simularApi(rotas) {
  const fetch = vi.fn(async (url, opcoes = {}) => {
    const { pathname, search } = new URL(url);
    const chave = `${opcoes.method ?? "GET"} ${pathname}`;
    const rota = rotas[chave];
    if (!rota) throw new Error(`Rota não simulada: ${chave}`);
    const corpo = opcoes.body ? JSON.parse(opcoes.body) : undefined;
    const [status, dados] = await rota({ search, corpo });
    return resposta(status, dados);
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

export function chamadas(fetch, metodo, caminho) {
  return fetch.mock.calls.filter(([url, opcoes = {}]) => {
    const { pathname } = new URL(url);
    return (opcoes.method ?? "GET") === metodo && pathname === caminho;
  });
}
