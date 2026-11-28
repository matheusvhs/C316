export function montarConsulta(filtros = {}) {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(filtros)) {
    const texto = typeof valor === "string" ? valor.trim() : valor;
    if (texto !== undefined && texto !== null && texto !== "") {
      params.set(chave, texto);
    }
  }
  const consulta = params.toString();
  return consulta ? `?${consulta}` : "";
}
