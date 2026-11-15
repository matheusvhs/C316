import { TarefaCard } from "./TarefaCard";

export function ListaTarefas({ tarefas, onAlternar, onRemover }) {
  if (tarefas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 bg-white/60 p-8 text-center">
        <p className="text-stone-500">Nenhuma tarefa por aqui.</p>
        <p className="mt-1 text-sm text-stone-400">
          Use o formulário ao lado para adicionar a primeira.
        </p>
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {tarefas.map((tarefa) => (
        <TarefaCard
          key={tarefa.id}
          tarefa={tarefa}
          onAlternar={onAlternar}
          onRemover={onRemover}
        />
      ))}
    </ul>
  );
}
