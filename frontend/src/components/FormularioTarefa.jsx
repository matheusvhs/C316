import { useState } from "react";
import { PRIORIDADES, validarTarefa } from "../utils/validarTarefa";

const ROTULOS_PRIORIDADE = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

const campo =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15";

export function FormularioTarefa({ onSubmit }) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState("media");
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(event) {
    event.preventDefault();
    const { erros: novosErros, dados } = validarTarefa({
      titulo,
      descricao,
      prioridade,
    });
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    setEnviando(true);
    try {
      // Só limpa o formulário se a API confirmar a criação.
      if (await onSubmit(dados)) {
        setTitulo("");
        setDescricao("");
        setPrioridade("media");
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={aoEnviar}
      noValidate
      className="space-y-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
    >
      <p className="font-semibold">Nova tarefa</p>

      <div className="space-y-1.5">
        <label htmlFor="campo-titulo" className="block text-sm font-medium">
          Título <span aria-hidden="true">*</span>
        </label>
        <input
          id="campo-titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          aria-invalid={Boolean(erros.titulo)}
          aria-describedby={erros.titulo ? "erro-titulo" : undefined}
          className={campo}
        />
        {erros.titulo && (
          <p id="erro-titulo" role="alert" className="text-sm text-red-700">
            {erros.titulo}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="campo-descricao" className="block text-sm font-medium">
          Descrição
        </label>
        <textarea
          id="campo-descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={4}
          aria-invalid={Boolean(erros.descricao)}
          aria-describedby={erros.descricao ? "erro-descricao" : undefined}
          className={campo}
        />
        {erros.descricao && (
          <p id="erro-descricao" role="alert" className="text-sm text-red-700">
            {erros.descricao}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="campo-prioridade" className="block text-sm font-medium">
          Prioridade
        </label>
        <select
          id="campo-prioridade"
          value={prioridade}
          onChange={(e) => setPrioridade(e.target.value)}
          className={campo}
        >
          {PRIORIDADES.map((p) => (
            <option key={p} value={p}>
              {ROTULOS_PRIORIDADE[p]}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Adicionar tarefa
      </button>
    </form>
  );
}
