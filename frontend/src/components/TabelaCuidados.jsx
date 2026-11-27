import {
  formatarData,
  formatarMoeda,
  rotuloTipo,
  TIPOS_CUIDADO,
} from "../utils/formatacao.js";
import Aviso from "./Aviso.jsx";

export default function TabelaCuidados({
  cuidados,
  carregando,
  erro,
  tipo,
  onTipoChange,
  onEditar,
  onExcluir,
  onTentarNovamente,
}) {
  let conteudo;
  if (carregando) {
    conteudo = <Aviso>Carregando cuidados...</Aviso>;
  } else if (erro) {
    conteudo = (
      <Aviso tipo="erro">
        <p>{erro}</p>
        <button
          type="button"
          onClick={onTentarNovamente}
          className="mt-2 font-medium underline"
        >
          Tentar novamente
        </button>
      </Aviso>
    );
  } else if (cuidados.length === 0) {
    conteudo = (
      <Aviso>
        {tipo ? "Nenhum cuidado deste tipo." : "Nenhum cuidado registrado."}
      </Aviso>
    );
  } else {
    conteudo = (
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-2 font-medium">Data</th>
              <th className="px-4 py-2 font-medium">Tipo</th>
              <th className="px-4 py-2 font-medium">Descrição</th>
              <th className="px-4 py-2 font-medium">Custo</th>
              <th className="px-4 py-2 font-medium">Próxima data</th>
              <th className="px-4 py-2 font-medium">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {cuidados.map((cuidado) => (
              <tr key={cuidado.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{formatarData(cuidado.data)}</td>
                <td className="px-4 py-2">{rotuloTipo(cuidado.tipo)}</td>
                <td className="px-4 py-2">{cuidado.descricao ?? "—"}</td>
                <td className="px-4 py-2">{formatarMoeda(cuidado.custo)}</td>
                <td className="px-4 py-2">
                  {cuidado.proxima_data
                    ? formatarData(cuidado.proxima_data)
                    : "—"}
                </td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEditar(cuidado)}
                      aria-label={`Editar ${rotuloTipo(cuidado.tipo)} de ${formatarData(cuidado.data)}`}
                      className="rounded-lg border border-slate-300 px-3 py-1 font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onExcluir(cuidado)}
                      aria-label={`Excluir ${rotuloTipo(cuidado.tipo)} de ${formatarData(cuidado.data)}`}
                      className="rounded-lg border border-red-200 px-3 py-1 font-medium text-red-700 hover:bg-red-50"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-800">Cuidados</h3>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 sm:w-48">
          Filtrar por tipo
          <select
            value={tipo}
            onChange={(evento) => onTipoChange(evento.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 font-normal"
          >
            <option value="">Todos</option>
            {TIPOS_CUIDADO.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </select>
        </label>
      </div>
      {conteudo}
    </section>
  );
}
