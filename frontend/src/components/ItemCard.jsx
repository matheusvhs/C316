const ESTILO_CATEGORIA = {
  casa: "bg-sky-100 text-sky-800",
  trabalho: "bg-amber-100 text-amber-800",
  estudos: "bg-violet-100 text-violet-800",
  outros: "bg-stone-200 text-stone-700",
};

const ROTULOS_CATEGORIA = {
  casa: "Casa",
  trabalho: "Trabalho",
  estudos: "Estudos",
  outros: "Outros",
};

export function ItemCard({ item, onRemover }) {
  return (
    <li className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium break-words">{item.nome}</p>
          {item.descricao && (
            <p className="mt-1 text-sm break-words whitespace-pre-wrap text-stone-500">
              {item.descricao}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ESTILO_CATEGORIA[item.categoria]}`}
        >
          {ROTULOS_CATEGORIA[item.categoria]}
        </span>
        <button
          type="button"
          onClick={() => onRemover(item.id)}
          aria-label={`Remover "${item.nome}"`}
          className="shrink-0 rounded-md px-2 py-0.5 text-sm text-stone-400 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-red-700"
        >
          ✕
        </button>
      </div>
    </li>
  );
}
