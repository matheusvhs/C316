import { useState } from "react";
import Aviso from "./Aviso.jsx";

export default function ConfirmarExclusao({
  mensagem,
  onConfirmar,
  onCancelar,
}) {
  const [erro, setErro] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  const confirmar = async () => {
    setErro(null);
    setExcluindo(true);
    try {
      await onConfirmar();
    } catch (e) {
      setErro(e.message);
      setExcluindo(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <p className="text-slate-700">{mensagem}</p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={confirmar}
          disabled={excluindo}
          className="rounded-lg bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-800 disabled:opacity-60"
        >
          {excluindo ? "Excluindo..." : "Excluir"}
        </button>
      </div>
    </div>
  );
}
