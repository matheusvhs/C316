import { act, renderHook } from "@testing-library/react";
import { expect, it } from "vitest";
import { useItens } from "../../src/hooks/useItens";

function novoItem(nome, categoria = "outros") {
  return { nome, descricao: "", categoria };
}

it("adiciona itens no topo e atualiza o resumo", () => {
  const { result } = renderHook(() => useItens());
  act(() => result.current.adicionar(novoItem("Primeiro", "casa")));
  act(() => result.current.adicionar(novoItem("Segundo", "trabalho")));

  expect(result.current.itensFiltrados.map((i) => i.nome)).toEqual([
    "Segundo",
    "Primeiro",
  ]);
  expect(result.current.resumo).toEqual({
    total: 2,
    exibidos: 2,
    categorias: 2,
  });
});

it("filtra por categoria e conta quantos aparecem", () => {
  const { result } = renderHook(() => useItens());
  act(() => {
    result.current.adicionar(novoItem("Livro", "estudos"));
    result.current.adicionar(novoItem("Chave", "casa"));
    result.current.adicionar(novoItem("Caderno", "estudos"));
  });
  act(() => result.current.setFiltro("estudos"));

  expect(result.current.itensFiltrados.map((i) => i.nome)).toEqual([
    "Caderno",
    "Livro",
  ]);
  expect(result.current.resumo).toEqual({
    total: 3,
    exibidos: 2,
    categorias: 2,
  });

  act(() => result.current.setFiltro("todas"));
  expect(result.current.itensFiltrados).toHaveLength(3);
});

it("remove itens e recalcula o resumo", () => {
  const { result } = renderHook(() => useItens());
  act(() => {
    result.current.adicionar(novoItem("Um", "casa"));
    result.current.adicionar(novoItem("Dois", "casa"));
  });
  const [primeiro] = result.current.itensFiltrados;
  act(() => result.current.remover(primeiro.id));

  expect(result.current.itensFiltrados).toHaveLength(1);
  expect(result.current.resumo).toEqual({
    total: 1,
    exibidos: 1,
    categorias: 1,
  });
});
