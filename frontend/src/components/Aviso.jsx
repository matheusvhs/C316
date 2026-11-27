const ESTILOS = {
  erro: "border-red-200 bg-red-50 text-red-800",
  sucesso: "border-green-200 bg-green-50 text-green-800",
  info: "border-slate-200 bg-slate-50 text-slate-700",
};

export default function Aviso({ tipo = "info", children }) {
  return (
    <div
      role={tipo === "erro" ? "alert" : "status"}
      className={`rounded-lg border px-4 py-3 ${ESTILOS[tipo]}`}
    >
      {children}
    </div>
  );
}
