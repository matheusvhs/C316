import { useEffect, useMemo, useState } from "react";
import {
  atualizarTarefa,
  criarTarefa,
  listarTarefas,
  removerTarefa,
} from "../api/tarefas";

// Estado das tarefas vindo da API: cada operação grava no PostgreSQL e a
// resposta dela atualiza a lista local. Falhas sobem para a tela em `erro`.
export function useTarefas() {
  const [tarefas, setTarefas] = useState([]);
  const [filtro, setFiltro] = useState("todas");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let ativo = true;
    listarTarefas()
      .then((lista) => ativo && setTarefas([...lista].reverse()))
      .catch((e) => ativo && setErro(e.message))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, []);

  // A lista só muda quando a API confirma a operação.
  async function executar(operacao, aplicar) {
    setErro(null);
    try {
      aplicar(await operacao());
      return true;
    } catch (e) {
      setErro(e.message);
      return false;
    }
  }

  const adicionar = (dados) =>
    executar(
      () => criarTarefa(dados),
      (tarefa) => setTarefas((atuais) => [tarefa, ...atuais]),
    );

  const alternarConcluida = (tarefa) =>
    executar(
      () => atualizarTarefa(tarefa.id, { concluida: !tarefa.concluida }),
      (atualizada) =>
        setTarefas((atuais) =>
          atuais.map((t) => (t.id === atualizada.id ? atualizada : t)),
        ),
    );

  const remover = (id) =>
    executar(
      () => removerTarefa(id),
      () => setTarefas((atuais) => atuais.filter((t) => t.id !== id)),
    );

  const tarefasFiltradas = useMemo(
    () =>
      filtro === "todas"
        ? tarefas
        : tarefas.filter((t) => t.prioridade === filtro),
    [tarefas, filtro],
  );

  const resumo = useMemo(
    () => ({
      total: tarefas.length,
      exibidos: tarefasFiltradas.length,
      concluidas: tarefas.filter((t) => t.concluida).length,
    }),
    [tarefas, tarefasFiltradas],
  );

  return {
    tarefasFiltradas,
    filtro,
    setFiltro,
    resumo,
    carregando,
    erro,
    adicionar,
    alternarConcluida,
    remover,
  };
}
