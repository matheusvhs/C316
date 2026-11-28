import { ESPECIES } from "../utils/formatacao.js";

export default function FiltrosPets({ filtros, onChange }) {
  const alterar = (campo) => (evento) =>
    onChange({ ...filtros, [campo]: evento.target.value });

  return (
    <search className="flex flex-col gap-3 sm:flex-row">
      <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-slate-700">
        Buscar por nome
        <input
          type="search"
          value={filtros.busca}
          onChange={alterar("busca")}
          maxLength={60}
          placeholder="Ex.: Rex"
          className="rounded-lg border border-slate-300 px-3 py-2 font-normal"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 sm:w-48">
        Espécie
        <select
          value={filtros.especie}
          onChange={alterar("especie")}
          className="rounded-lg border border-slate-300 px-3 py-2 font-normal"
        >
          <option value="">Todas</option>
          {ESPECIES.map((especie) => (
            <option key={especie.valor} value={especie.valor}>
              {especie.rotulo}
            </option>
          ))}
        </select>
      </label>
    </search>
  );
}
