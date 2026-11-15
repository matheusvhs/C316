import { FormularioTarefa } from "./components/FormularioTarefa";
import { ListaTarefas } from "./components/ListaTarefas";
import { useTarefas } from "./hooks/useTarefas";
import { PRIORIDADES } from "./utils/validarTarefa";

const ROTULOS_PRIORIDADE = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export default function App() {
  const {
    tarefasFiltradas,
    filtro,
    setFiltro,
    resumo,
    carregando,
    erro,
    adicionar,
    alternarConcluida,
    remover,
  } = useTarefas();

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Gerenciador de Tarefas
            </h1>
            <p className="text-sm text-stone-500">
              Tarefas salvas no PostgreSQL pela API.
            </p>
          </div>
          <section
            aria-label="Resumo das tarefas"
            className="flex gap-4 text-center text-sm"
          >
            <dl>
              <dt className="text-stone-500">Total</dt>
              <dd className="text-lg font-semibold">{resumo.total}</dd>
            </dl>
            <dl>
              <dt className="text-stone-500">Exibindo</dt>
              <dd className="text-lg font-semibold text-emerald-700">
                {resumo.exibidos}
              </dd>
            </dl>
            <dl>
              <dt className="text-stone-500">Concluídas</dt>
              <dd className="text-lg font-semibold text-amber-600">
                {resumo.concluidas}
              </dd>
            </dl>
          </section>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section aria-labelledby="nova-tarefa-heading">
          <h2 id="nova-tarefa-heading" className="sr-only">
            Nova tarefa
          </h2>
          <FormularioTarefa onSubmit={adicionar} />
        </section>

        <section aria-labelledby="lista-tarefas-heading" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="lista-tarefas-heading"
              className="text-lg font-semibold tracking-tight"
            >
              Suas tarefas
            </h2>
            <fieldset className="flex flex-wrap gap-1.5">
              <legend className="sr-only">Filtrar por prioridade</legend>
              {["todas", ...PRIORIDADES].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFiltro(p)}
                  aria-pressed={filtro === p}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    filtro === p
                      ? "bg-emerald-700 text-white"
                      : "bg-white text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {p === "todas" ? "Todas" : ROTULOS_PRIORIDADE[p]}
                </button>
              ))}
            </fieldset>
          </div>
          {erro && (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {erro}
            </p>
          )}
          {carregando ? (
            <p className="py-8 text-center text-sm text-stone-500">
              Carregando tarefas…
            </p>
          ) : (
            <ListaTarefas
              tarefas={tarefasFiltradas}
              onAlternar={alternarConcluida}
              onRemover={remover}
            />
          )}
        </section>
      </main>
    </div>
  );
}
