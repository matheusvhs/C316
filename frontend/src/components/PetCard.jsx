import { Link } from "react-router";
import {
  calcularIdade,
  formatarIdade,
  rotuloEspecie,
} from "../utils/formatacao.js";

export default function PetCard({ pet, onEditar, onExcluir }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800">{pet.nome}</h2>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-slate-500">Espécie</dt>
        <dd>{rotuloEspecie(pet.especie)}</dd>
        <dt className="text-slate-500">Raça</dt>
        <dd>{pet.raca ?? "Não informada"}</dd>
        <dt className="text-slate-500">Idade</dt>
        <dd>{formatarIdade(calcularIdade(pet.data_nascimento))}</dd>
      </dl>
      <div className="mt-4 flex gap-2">
        <Link
          to={`/pets/${pet.id}`}
          aria-label={`Abrir ${pet.nome}`}
          className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          Abrir
        </Link>
        <button
          type="button"
          onClick={() => onEditar(pet)}
          aria-label={`Editar ${pet.nome}`}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onExcluir(pet)}
          aria-label={`Excluir ${pet.nome}`}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Excluir
        </button>
      </div>
    </article>
  );
}
