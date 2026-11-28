import { formatarData, rotuloTipo, textoPrazo } from "../utils/formatacao.js";

const ESTILOS = {
  vencido: {
    caixa: "border-red-300 bg-red-50 text-red-900",
    rotulo: "Vencido",
  },
  proximo: {
    caixa: "border-amber-300 bg-amber-50 text-amber-900",
    rotulo: "Próximo",
  },
  em_dia: {
    caixa: "border-green-300 bg-green-50 text-green-900",
    rotulo: "Em dia",
  },
};

export default function PainelAlertas({ alertas }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-lg font-semibold text-slate-800">Alertas</h3>
      {alertas.length === 0 ? (
        <p className="text-slate-600">
          Nenhum cuidado com próxima data registrada.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {alertas.map((alerta) => {
            const estilo = ESTILOS[alerta.status];
            return (
              <li
                key={alerta.cuidado_id}
                data-status={alerta.status}
                className={`rounded-xl border p-4 ${estilo.caixa}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">
                    {rotuloTipo(alerta.tipo)}
                    {alerta.descricao && ` · ${alerta.descricao}`}
                  </span>
                  <span className="text-xs font-semibold uppercase">
                    {estilo.rotulo}
                  </span>
                </div>
                <p className="mt-1 text-lg">
                  {textoPrazo(alerta.dias_restantes)}
                </p>
                <p className="text-sm opacity-80">
                  Próxima data: {formatarData(alerta.proxima_data)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
