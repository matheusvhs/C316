const ESTILO_PRIORIDADE = {
  baixa: "bg-sky-100 text-sky-800",
  media: "bg-amber-100 text-amber-800",
  alta: "bg-red-100 text-red-800",
};

const ROTULOS_PRIORIDADE = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export function TarefaCard({ tarefa, onAlternar, onRemover }) {
  return (
    <li className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={tarefa.concluida}
          onChange={() => onAlternar(tarefa)}
          aria-label={`Marcar "${tarefa.titulo}" como ${tarefa.concluida ? "pendente" : "concluída"}`}
          className="mt-1 h-4 w-4 shrink-0 accent-emerald-700"
        />
        <div className="min-w-0 flex-1">
          <p
            className={`font-medium break-words ${tarefa.concluida ? "text-stone-400 line-through" : ""}`}
          >
            {tarefa.titulo}
          </p>
          {tarefa.descricao && (
            <p className="mt-1 text-sm break-words whitespace-pre-wrap text-stone-500">
              {tarefa.descricao}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ESTILO_PRIORIDADE[tarefa.prioridade]}`}
        >
          {ROTULOS_PRIORIDADE[tarefa.prioridade]}
        </span>
        <button
          type="button"
          onClick={() => onRemover(tarefa.id)}
          aria-label={`Remover "${tarefa.titulo}"`}
          className="shrink-0 rounded-md px-2 py-0.5 text-sm text-stone-400 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-red-700"
        >
          ✕
        </button>
      </div>
    </li>
  );
}
