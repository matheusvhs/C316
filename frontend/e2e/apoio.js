const API_URL = process.env.E2E_API_URL ?? "http://localhost:8000";

export function nomeUnico(prefixo) {
  return `${prefixo} ${Date.now()}`;
}

export function dataLocal(diasAPartirDeHoje = 0) {
  const data = new Date();
  data.setDate(data.getDate() + diasAPartirDeHoje);
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

export async function removerPet(request, nome) {
  const resposta = await request.get(`${API_URL}/pets`, {
    params: { busca: nome },
  });
  for (const pet of await resposta.json()) {
    const cuidados = await request.get(`${API_URL}/pets/${pet.id}/cuidados`);
    for (const cuidado of await cuidados.json()) {
      await request.delete(`${API_URL}/cuidados/${cuidado.id}`);
    }
    await request.delete(`${API_URL}/pets/${pet.id}`);
  }
}

export async function cadastrarPet(page, { nome, especie, nascimento, peso }) {
  await page.getByRole("button", { name: "Novo pet" }).click();
  const dialogo = page.getByRole("dialog", { name: "Novo pet" });
  await dialogo.getByLabel("Nome").fill(nome);
  await dialogo.getByLabel("Espécie").selectOption(especie);
  await dialogo.getByLabel("Data de nascimento").fill(nascimento);
  await dialogo.getByLabel("Peso (kg)").fill(peso);
  await dialogo.getByRole("button", { name: "Salvar" }).click();
  await page.getByRole("status").getByText(`${nome} foi cadastrado.`).waitFor();
}
