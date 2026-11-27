export const ESPECIES = [
  { valor: "cachorro", rotulo: "Cachorro" },
  { valor: "gato", rotulo: "Gato" },
  { valor: "outro", rotulo: "Outro" },
];

export function rotuloEspecie(valor) {
  return ESPECIES.find((especie) => especie.valor === valor)?.rotulo ?? valor;
}

function partesDaData(iso) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return { ano, mes, dia };
}

export function formatarData(iso) {
  if (!iso) return "";
  const { ano, mes, dia } = partesDaData(iso);
  return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
}

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatarMoeda(valor) {
  return moeda.format(Number(valor));
}

const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export function formatarPeso(valor) {
  return `${decimal.format(Number(valor))} kg`;
}

export function calcularIdade(nascimentoIso, hoje = new Date()) {
  const nascimento = partesDaData(nascimentoIso);
  let meses =
    (hoje.getFullYear() - nascimento.ano) * 12 +
    (hoje.getMonth() + 1 - nascimento.mes);
  if (hoje.getDate() < nascimento.dia) meses -= 1;
  return { anos: Math.floor(meses / 12), meses: meses % 12 };
}

function plural(quantidade, singular, varios) {
  return `${quantidade} ${quantidade === 1 ? singular : varios}`;
}

export function formatarIdade({ anos, meses }) {
  const partes = [];
  if (anos > 0) partes.push(plural(anos, "ano", "anos"));
  if (meses > 0) partes.push(plural(meses, "mês", "meses"));
  return partes.length ? partes.join(" e ") : "Menos de 1 mês";
}
