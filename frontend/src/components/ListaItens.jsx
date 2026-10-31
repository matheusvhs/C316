import { ItemCard } from "./ItemCard";

export function ListaItens({ itens, onRemover }) {
  if (itens.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 bg-white/60 p-8 text-center">
        <p className="text-stone-500">Nenhum item por aqui.</p>
        <p className="mt-1 text-sm text-stone-400">
          Use o formulário ao lado para adicionar o primeiro.
        </p>
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {itens.map((item) => (
        <ItemCard key={item.id} item={item} onRemover={onRemover} />
      ))}
    </ul>
  );
}
