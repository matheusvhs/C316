import { useState } from "react";
import { hojeIso, TIPOS_CUIDADO } from "../utils/formatacao.js";
import {
  errosPorCampo,
  paraNumero,
  validarCuidado,
} from "../utils/validacao.js";
import Aviso from "./Aviso.jsx";
import Campo from "./Campo.jsx";

function dadosIniciais(cuidado) {
  return {
    tipo: cuidado?.tipo ?? "",
    data: cuidado?.data ?? hojeIso(),
    custo: cuidado ? String(cuidado.custo).replace(".", ",") : "",
    descricao: cuidado?.descricao ?? "",
    proxima_data: cuidado?.proxima_data ?? "",
  };
}

export default function FormularioCuidado({
  cuidado,
  nascimento,
  onSalvar,
  onCancelar,
}) {
  const [dados, setDados] = useState(() => dadosIniciais(cuidado));
  const [erros, setErros] = useState({});
  const [erroApi, setErroApi] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const alterar = (campo) => (evento) => {
    setDados({ ...dados, [campo]: evento.target.value });
    setErros({ ...erros, [campo]: undefined });
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    const errosDoCliente = validarCuidado(dados, nascimento);
    setErros(errosDoCliente);
    setErroApi(null);
    if (Object.keys(errosDoCliente).length > 0) return;

    setSalvando(true);
    try {
      await onSalvar({
        tipo: dados.tipo,
        data: dados.data,
        custo: paraNumero(dados.custo),
        descricao: dados.descricao.trim() || null,
        proxima_data: dados.proxima_data || null,
      });
    } catch (e) {
      setErros(errosPorCampo(e.erros ?? []));
      setErroApi(e.erros?.length ? "Corrija os campos destacados." : e.message);
      setSalvando(false);
    }
  };

  const vacina = dados.tipo === "vacina";

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      {erroApi && <Aviso tipo="erro">{erroApi}</Aviso>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Tipo" erro={erros.tipo} obrigatorio>
          <select value={dados.tipo} onChange={alterar("tipo")}>
            <option value="">Selecione</option>
            {TIPOS_CUIDADO.map((tipo) => (
              <option key={tipo.valor} value={tipo.valor}>
                {tipo.rotulo}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Data" erro={erros.data} obrigatorio>
          <input
            type="date"
            value={dados.data}
            onChange={alterar("data")}
            min={nascimento}
            max={hojeIso()}
          />
        </Campo>
        <Campo rotulo="Custo (R$)" erro={erros.custo} obrigatorio>
          <input
            inputMode="decimal"
            value={dados.custo}
            onChange={alterar("custo")}
            placeholder="Ex.: 35,90"
          />
        </Campo>
        <Campo rotulo="Próxima data" erro={erros.proxima_data}>
          <input
            type="date"
            value={dados.proxima_data}
            onChange={alterar("proxima_data")}
            min={dados.data || undefined}
          />
        </Campo>
      </div>
      <Campo
        rotulo={vacina ? "Nome da vacina" : "Descrição"}
        erro={erros.descricao}
        obrigatorio={vacina}
      >
        <input
          value={dados.descricao}
          onChange={alterar("descricao")}
          maxLength={255}
          placeholder={vacina ? "Ex.: V10" : ""}
        />
      </Campo>
      <div className="flex justify-end gap-3">
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}
