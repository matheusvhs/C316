import { cloneElement, useId } from "react";

export default function Campo({ rotulo, erro, obrigatorio, children }) {
  const id = useId();
  const idErro = `${id}-erro`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {rotulo}
        {obrigatorio && <span className="text-red-600"> *</span>}
      </label>
      {cloneElement(children, {
        id,
        "aria-invalid": erro ? true : undefined,
        "aria-describedby": erro ? idErro : undefined,
        className: `rounded-lg border px-3 py-2 ${erro ? "border-red-500" : "border-slate-300"}`,
      })}
      {erro && (
        <p id={idErro} className="text-sm text-red-600">
          {erro}
        </p>
      )}
    </div>
  );
}
