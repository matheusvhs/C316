import { FormularioItem } from "./components/FormularioItem";
import { ListaItens } from "./components/ListaItens";
import { useItens } from "./hooks/useItens";
import { CATEGORIAS } from "./utils/validarItem";

const ROTULOS_CATEGORIA = {
  casa: "Casa",
  trabalho: "Trabalho",
  estudos: "Estudos",
  outros: "Outros",
};

export default function App() {
  const { itensFiltrados, filtro, setFiltro, resumo, adicionar, remover } =
    useItens();

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Gerenciador de Itens
            </h1>
            <p className="text-sm text-stone-500">
              Lista mantida apenas nesta sessão, sem persistência.
            </p>
          </div>
          <section
            aria-label="Resumo dos itens"
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
              <dt className="text-stone-500">Categorias</dt>
              <dd className="text-lg font-semibold text-amber-600">
                {resumo.categorias}
              </dd>
            </dl>
          </section>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section aria-labelledby="novo-item-heading">
          <h2 id="novo-item-heading" className="sr-only">
            Novo item
          </h2>
          <FormularioItem onSubmit={adicionar} />
        </section>

        <section aria-labelledby="lista-itens-heading" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="lista-itens-heading"
              className="text-lg font-semibold tracking-tight"
            >
              Seus itens
            </h2>
            <fieldset className="flex flex-wrap gap-1.5">
              <legend className="sr-only">Filtrar por categoria</legend>
              {["todas", ...CATEGORIAS].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFiltro(c)}
                  aria-pressed={filtro === c}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    filtro === c
                      ? "bg-emerald-700 text-white"
                      : "bg-white text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {c === "todas" ? "Todas" : ROTULOS_CATEGORIA[c]}
                </button>
              ))}
            </fieldset>
          </div>
          <ListaItens itens={itensFiltrados} onRemover={remover} />
        </section>
      </main>
    </div>
  );
}
