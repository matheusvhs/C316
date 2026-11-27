import { describe, expect, it, vi } from "vitest";
import { ApiError, request } from "../src/services/api.js";
import { API, resposta } from "./apiFalsa.js";

describe("request", () => {
  it("devolve o JSON da resposta e usa a URL da API", async () => {
    const fetch = vi.fn().mockResolvedValue(resposta(200, [{ id: 1 }]));
    vi.stubGlobal("fetch", fetch);

    await expect(request("/pets?busca=rex")).resolves.toEqual([{ id: 1 }]);
    expect(fetch).toHaveBeenCalledWith(`${API}/pets?busca=rex`, {
      headers: undefined,
      body: undefined,
    });
  });

  it("envia o corpo como JSON com Content-Type", async () => {
    const fetch = vi.fn().mockResolvedValue(resposta(201, { id: 7 }));
    vi.stubGlobal("fetch", fetch);

    await request("/pets", { method: "POST", body: { nome: "Rex" } });

    const [, opcoes] = fetch.mock.calls[0];
    expect(opcoes.method).toBe("POST");
    expect(opcoes.headers).toEqual({ "Content-Type": "application/json" });
    expect(opcoes.body).toBe('{"nome":"Rex"}');
  });

  it("devolve null quando a resposta é 204", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(resposta(204)));

    await expect(request("/pets/1", { method: "DELETE" })).resolves.toBeNull();
  });

  it("lança ApiError com detail, status e erros quando a resposta não é ok", async () => {
    const corpo = {
      detail: "Nome: Deve ter pelo menos 2 caracteres",
      erros: [{ campo: "nome", mensagem: "Deve ter pelo menos 2 caracteres" }],
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(resposta(422, corpo)));

    const erro = await request("/pets").catch((e) => e);

    expect(erro).toBeInstanceOf(ApiError);
    expect(erro.message).toBe(corpo.detail);
    expect(erro.status).toBe(422);
    expect(erro.erros).toEqual(corpo.erros);
  });

  it("usa uma mensagem genérica quando o erro não tem JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Bad Gateway", { status: 502 })),
    );

    await expect(request("/pets")).rejects.toMatchObject({
      message: "Erro inesperado (status 502)",
      status: 502,
      erros: [],
    });
  });

  it("avisa que não conseguiu conectar quando o fetch falha", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(request("/pets")).rejects.toMatchObject({
      message: "Não foi possível conectar à API",
      status: 0,
    });
  });
});
