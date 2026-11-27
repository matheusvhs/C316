import {
  calcularIdade,
  formatarIdade,
  rotuloEspecie,
} from "../utils/formatacao.js";

export default function PetCard({ pet }) {
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
    </article>
  );
}
