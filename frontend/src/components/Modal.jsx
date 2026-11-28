import { useEffect, useId, useRef } from "react";

export default function Modal({ titulo, onFechar, children }) {
  const idTitulo = useId();
  const caixa = useRef(null);

  useEffect(() => {
    caixa.current.querySelector("input, select, textarea, button")?.focus();
  }, []);

  useEffect(() => {
    const aoTeclar = (evento) => {
      if (evento.key === "Escape") onFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/50 p-4">
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 id={idTitulo} className="mb-4 text-xl font-semibold text-slate-800">
          {titulo}
        </h2>
        {children}
      </div>
    </div>
  );
}
