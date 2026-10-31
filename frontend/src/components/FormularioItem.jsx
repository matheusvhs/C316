import { useState } from "react";
import { CATEGORIAS, validarItem } from "../utils/validarItem";

const ROTULOS_CATEGORIA = {
  casa: "Casa",
  trabalho: "Trabalho",
  estudos: "Estudos",
  outros: "Outros",
};

const campo =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15";

export function FormularioItem({ onSubmit }) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("outros");
  const [erros, setErros] = useState({});

  function aoEnviar(event) {
    event.preventDefault();
    const { erros: novosErros, dados } = validarItem({
      nome,
      descricao,
      categoria,
    });
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;
    onSubmit(dados);
    setNome("");
    setDescricao("");
    setCategoria("outros");
  }

  return (
    <form
      onSubmit={aoEnviar}
      noValidate
      className="space-y-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
    >
      <p className="font-semibold">Novo item</p>

      <div className="space-y-1.5">
        <label htmlFor="campo-nome" className="block text-sm font-medium">
          Nome <span aria-hidden="true">*</span>
        </label>
        <input
          id="campo-nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          aria-invalid={Boolean(erros.nome)}
          aria-describedby={erros.nome ? "erro-nome" : undefined}
          className={campo}
        />
        {erros.nome && (
          <p id="erro-nome" role="alert" className="text-sm text-red-700">
            {erros.nome}
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
        <label htmlFor="campo-categoria" className="block text-sm font-medium">
          Categoria
        </label>
        <select
          id="campo-categoria"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className={campo}
        >
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {ROTULOS_CATEGORIA[c]}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="w-full rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
      >
        Adicionar item
      </button>
    </form>
  );
}
