import { useMemo, useState } from "react";

// Estado em memória da Prática 6. Na Prática 7 estas funções vão chamar a API
// em vez de só alterar o estado local.
export function useItens() {
  const [itens, setItens] = useState([]);
  const [filtro, setFiltro] = useState("todas");

  function adicionar(dados) {
    setItens((atuais) => [{ id: crypto.randomUUID(), ...dados }, ...atuais]);
  }

  function remover(id) {
    setItens((atuais) => atuais.filter((i) => i.id !== id));
  }

  const itensFiltrados = useMemo(
    () =>
      filtro === "todas" ? itens : itens.filter((i) => i.categoria === filtro),
    [itens, filtro],
  );

  const resumo = useMemo(
    () => ({
      total: itens.length,
      exibidos: itensFiltrados.length,
      categorias: new Set(itens.map((i) => i.categoria)).size,
    }),
    [itens, itensFiltrados],
  );

  return { itensFiltrados, filtro, setFiltro, resumo, adicionar, remover };
}
