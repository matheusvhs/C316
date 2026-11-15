import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import App from "../../src/App";

function respostaJson(corpo, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => corpo,
  };
}

// API falsa em memória, no mesmo formato que o backend responde.
function mockTarefasApi(inicial = []) {
  let proximoId = inicial.length + 1;
  const tarefas = [...inicial];
  const chamadas = [];

  vi.stubGlobal(
    "fetch",
    vi.fn(async (url, options = {}) => {
      const metodo = options.method ?? "GET";
      const caminho = String(url).split("?")[0];
      const id = Number(caminho.split("/")[2]);
      chamadas.push(`${metodo} ${caminho}`);

      if (metodo === "GET") return respostaJson([...tarefas]);
      if (metodo === "POST") {
        const tarefa = {
          id: proximoId++,
          criada_em: "2026-11-14T00:00:00Z",
          atualizada_em: "2026-11-14T00:00:00Z",
          concluida: false,
          ...JSON.parse(options.body),
        };
        tarefas.push(tarefa);
        return respostaJson(tarefa, 201);
      }
      if (metodo === "PATCH") {
        const indice = tarefas.findIndex((t) => t.id === id);
        tarefas[indice] = { ...tarefas[indice], ...JSON.parse(options.body) };
        return respostaJson(tarefas[indice]);
      }
      if (metodo === "DELETE") {
        tarefas.splice(
          tarefas.findIndex((t) => t.id === id),
          1,
        );
        return respostaJson(null, 204);
      }
      return respostaJson({ detail: "not found" }, 404);
    }),
  );
  return chamadas;
}

const semTarefas = () => screen.findByText("Nenhuma tarefa por aqui.");

async function criarTarefa(user, { titulo, prioridade = "media" }) {
  await user.type(screen.getByLabelText(/Título/), titulo);
  await user.selectOptions(screen.getByLabelText("Prioridade"), prioridade);
  await user.click(screen.getByRole("button", { name: "Adicionar tarefa" }));
}

function valoresDoResumo() {
  const resumo = screen.getByRole("region", { name: "Resumo das tarefas" });
  return [...resumo.querySelectorAll("dd")].map((dd) => dd.textContent);
}

afterEach(() => vi.unstubAllGlobals());

it("cria e remove tarefas pela API atualizando o resumo", async () => {
  const chamadas = mockTarefasApi();
  const user = userEvent.setup();
  render(<App />);
  await semTarefas();

  await criarTarefa(user, { titulo: "Fone", prioridade: "baixa" });
  await criarTarefa(user, { titulo: "Relatório", prioridade: "alta" });
  await screen.findByText("Relatório");
  expect(valoresDoResumo()).toEqual(["2", "2", "0"]);
  expect(screen.getAllByRole("listitem")).toHaveLength(2);

  await user.click(screen.getByRole("button", { name: 'Remover "Fone"' }));
  expect(screen.getAllByRole("listitem")).toHaveLength(1);
  expect(valoresDoResumo()).toEqual(["1", "1", "0"]);
  expect(chamadas).toEqual([
    "GET /tarefas",
    "POST /tarefas",
    "POST /tarefas",
    "DELETE /tarefas/1",
  ]);
});

it("marca a tarefa como concluída via PATCH", async () => {
  mockTarefasApi();
  const user = userEvent.setup();
  render(<App />);
  await semTarefas();
  await criarTarefa(user, { titulo: "Estudar" });
  await screen.findByText("Estudar");

  await user.click(
    screen.getByRole("checkbox", { name: 'Marcar "Estudar" como concluída' }),
  );

  expect(valoresDoResumo()).toEqual(["1", "1", "1"]);
  expect(screen.getByText("Estudar")).toHaveClass("line-through");
});

it("filtra a lista por prioridade", async () => {
  mockTarefasApi();
  const user = userEvent.setup();
  render(<App />);
  await semTarefas();
  await criarTarefa(user, { titulo: "Livro", prioridade: "alta" });
  await criarTarefa(user, { titulo: "Chave", prioridade: "baixa" });
  await screen.findByText("Livro");

  await user.click(screen.getByRole("button", { name: "Alta" }));
  expect(screen.getAllByRole("listitem")).toHaveLength(1);
  expect(screen.getByText("Livro")).toBeInTheDocument();
  expect(valoresDoResumo()).toEqual(["2", "1", "0"]);

  await user.click(screen.getByRole("button", { name: "Todas" }));
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
});

it("mostra o erro da API sem perder as tarefas carregadas", async () => {
  const chamadas = mockTarefasApi([
    {
      id: 1,
      titulo: "Já existia",
      descricao: "",
      prioridade: "media",
      concluida: false,
      criada_em: "2026-11-14T00:00:00Z",
      atualizada_em: "2026-11-14T00:00:00Z",
    },
  ]);
  const user = userEvent.setup();
  render(<App />);
  await screen.findByText("Já existia");

  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }),
  );
  await criarTarefa(user, { titulo: "Vai falhar" });

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Não foi possível conectar ao servidor.",
  );
  expect(screen.getByText("Já existia")).toBeInTheDocument();
  expect(chamadas).toEqual(["GET /tarefas"]);
});

it("mantém a lista vazia quando o envio é inválido", async () => {
  const chamadas = mockTarefasApi();
  const user = userEvent.setup();
  render(<App />);
  await semTarefas();
  await user.click(screen.getByRole("button", { name: "Adicionar tarefa" }));
  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(screen.getByText("Nenhuma tarefa por aqui.")).toBeInTheDocument();
  expect(chamadas).toEqual(["GET /tarefas"]);
});
