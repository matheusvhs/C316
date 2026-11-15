import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { useTarefas } from "../../src/hooks/useTarefas";

const api = vi.hoisted(() => ({
  listarTarefas: vi.fn(),
  criarTarefa: vi.fn(),
  atualizarTarefa: vi.fn(),
  removerTarefa: vi.fn(),
}));

vi.mock("../../src/api/tarefas", () => api);

function tarefa(id, campos = {}) {
  return {
    id,
    titulo: `Tarefa ${id}`,
    descricao: "",
    prioridade: "media",
    concluida: false,
    ...campos,
  };
}

async function renderUseTarefas() {
  const view = renderHook(() => useTarefas());
  await waitFor(() => expect(view.result.current.carregando).toBe(false));
  return view;
}

beforeEach(() => {
  vi.clearAllMocks();
  api.listarTarefas.mockResolvedValue([]);
});

it("carrega a lista da API mostrando as mais novas primeiro", async () => {
  api.listarTarefas.mockResolvedValue([tarefa(1), tarefa(2)]);
  const { result } = await renderUseTarefas();

  expect(api.listarTarefas).toHaveBeenCalledOnce();
  expect(result.current.tarefasFiltradas.map((t) => t.id)).toEqual([2, 1]);
  expect(result.current.resumo).toEqual({
    total: 2,
    exibidos: 2,
    concluidas: 0,
  });
});

it("adiciona no topo só quando a API confirma", async () => {
  const { result } = await renderUseTarefas();
  api.criarTarefa.mockResolvedValue(tarefa(9, { titulo: "Nova" }));

  let ok;
  await act(async () => {
    ok = await result.current.adicionar({
      titulo: "Nova",
      descricao: "",
      prioridade: "alta",
    });
  });

  expect(ok).toBe(true);
  expect(api.criarTarefa).toHaveBeenCalledWith({
    titulo: "Nova",
    descricao: "",
    prioridade: "alta",
  });
  expect(result.current.tarefasFiltradas[0].titulo).toBe("Nova");
});

it("mantém os dados e expõe o erro quando a API falha", async () => {
  const { result } = await renderUseTarefas();
  api.criarTarefa.mockRejectedValue(new Error("API fora do ar"));

  let ok;
  await act(async () => {
    ok = await result.current.adicionar({ titulo: "Nova" });
  });

  expect(ok).toBe(false);
  expect(result.current.tarefasFiltradas).toHaveLength(0);
  expect(result.current.erro).toBe("API fora do ar");
});

it("alterna concluída via PATCH e atualiza o resumo", async () => {
  const inicial = tarefa(1);
  api.listarTarefas.mockResolvedValue([inicial]);
  api.atualizarTarefa.mockResolvedValue({ ...inicial, concluida: true });
  const { result } = await renderUseTarefas();

  await act(async () => {
    await result.current.alternarConcluida(result.current.tarefasFiltradas[0]);
  });

  expect(api.atualizarTarefa).toHaveBeenCalledWith(1, { concluida: true });
  expect(result.current.tarefasFiltradas[0].concluida).toBe(true);
  expect(result.current.resumo.concluidas).toBe(1);
});

it("remove a tarefa quando o DELETE responde", async () => {
  api.listarTarefas.mockResolvedValue([tarefa(1), tarefa(2)]);
  api.removerTarefa.mockResolvedValue(null);
  const { result } = await renderUseTarefas();

  await act(async () => {
    await result.current.remover(2);
  });

  expect(api.removerTarefa).toHaveBeenCalledWith(2);
  expect(result.current.tarefasFiltradas.map((t) => t.id)).toEqual([1]);
});

it("filtra por prioridade", async () => {
  api.listarTarefas.mockResolvedValue([
    tarefa(1, { prioridade: "alta" }),
    tarefa(2, { prioridade: "baixa" }),
    tarefa(3, { prioridade: "alta" }),
  ]);
  const { result } = await renderUseTarefas();

  act(() => result.current.setFiltro("alta"));
  expect(result.current.tarefasFiltradas.map((t) => t.id)).toEqual([3, 1]);
  expect(result.current.resumo.exibidos).toBe(2);

  act(() => result.current.setFiltro("todas"));
  expect(result.current.tarefasFiltradas).toHaveLength(3);
});
