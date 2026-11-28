import { useState } from "react";
import { ESPECIES, hojeIso } from "../utils/formatacao.js";
import { errosPorCampo, paraNumero, validarPet } from "../utils/validacao.js";
import Aviso from "./Aviso.jsx";
import Campo from "./Campo.jsx";

function dadosIniciais(pet) {
  return {
    nome: pet?.nome ?? "",
    especie: pet?.especie ?? "",
    raca: pet?.raca ?? "",
    data_nascimento: pet?.data_nascimento ?? "",
    peso_kg: pet ? String(pet.peso_kg).replace(".", ",") : "",
  };
}

export default function FormularioPet({ pet, onSalvar, onCancelar }) {
  const [dados, setDados] = useState(() => dadosIniciais(pet));
  const [erros, setErros] = useState({});
  const [erroApi, setErroApi] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const alterar = (campo) => (evento) => {
    setDados({ ...dados, [campo]: evento.target.value });
    setErros({ ...erros, [campo]: undefined });
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    const errosDoCliente = validarPet(dados);
    setErros(errosDoCliente);
    setErroApi(null);
    if (Object.keys(errosDoCliente).length > 0) return;

    setSalvando(true);
    try {
      await onSalvar({
        nome: dados.nome.trim(),
        especie: dados.especie,
        raca: dados.raca.trim() || null,
        data_nascimento: dados.data_nascimento,
        peso_kg: paraNumero(dados.peso_kg),
      });
    } catch (e) {
      setErros(errosPorCampo(e.erros ?? []));
      setErroApi(e.erros?.length ? "Corrija os campos destacados." : e.message);
      setSalvando(false);
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      {erroApi && <Aviso tipo="erro">{erroApi}</Aviso>}
      <Campo rotulo="Nome" erro={erros.nome} obrigatorio>
        <input value={dados.nome} onChange={alterar("nome")} maxLength={60} />
      </Campo>
      <Campo rotulo="Espécie" erro={erros.especie} obrigatorio>
        <select value={dados.especie} onChange={alterar("especie")}>
          <option value="">Selecione</option>
          {ESPECIES.map((especie) => (
            <option key={especie.valor} value={especie.valor}>
              {especie.rotulo}
            </option>
          ))}
        </select>
      </Campo>
      <Campo rotulo="Raça" erro={erros.raca}>
        <input value={dados.raca} onChange={alterar("raca")} maxLength={60} />
      </Campo>
      <Campo
        rotulo="Data de nascimento"
        erro={erros.data_nascimento}
        obrigatorio
      >
        <input
          type="date"
          value={dados.data_nascimento}
          onChange={alterar("data_nascimento")}
          max={hojeIso()}
        />
      </Campo>
      <Campo rotulo="Peso (kg)" erro={erros.peso_kg} obrigatorio>
        <input
          inputMode="decimal"
          value={dados.peso_kg}
          onChange={alterar("peso_kg")}
          placeholder="Ex.: 12,5"
        />
      </Campo>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </button>
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
