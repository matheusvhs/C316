import { formatarData, formatarMoeda } from "../utils/formatacao.js";

function Cartao({ titulo, valor }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <dt className="text-sm text-slate-500">{titulo}</dt>
      <dd className="mt-1 text-2xl font-semibold text-slate-800">{valor}</dd>
    </div>
  );
}

export default function ResumoPet({ resumo }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-3">
      <Cartao titulo="Total gasto" valor={formatarMoeda(resumo.total_gasto)} />
      <Cartao
        titulo="Quantidade de cuidados"
        valor={resumo.quantidade_cuidados}
      />
      <Cartao
        titulo="Último cuidado"
        valor={
          resumo.ultimo_cuidado ? formatarData(resumo.ultimo_cuidado) : "Nenhum"
        }
      />
    </dl>
  );
}
