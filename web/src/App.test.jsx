import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App.jsx";

const grupo = {
  _id: "g-1",
  name: "vizinhança",
  users: [
    { _id: "u-1", name: "Wagner", email: "souzawagner.ti@gmail.com" },
    { _id: "u-2", name: "Grasi", email: "grasi.fst@gmail.com" },
  ],
};

const respostaSorteio = {
  message: "Successfully Raffled Users",
  data: {
    _id: "r-1",
    secretSantaName: "vizinhança",
    pairs: [
      { name: "Wagner", email: "wagner@exemplo.com", amigoOculto: { name: "Grasi", email: "grasi@exemplo.com" } },
      { name: "Grasi", email: "grasi@exemplo.com", amigoOculto: { name: "Wagner", email: "wagner@exemplo.com" } },
    ],
  },
  mail: { transport: "json", configured: true, sent: 2, failed: 0, errors: [] },
};

let chamadas;

const responder = (status, corpo) =>
  Promise.resolve({
    ok: status < 400,
    status,
    text: () => Promise.resolve(corpo === undefined ? "" : JSON.stringify(corpo)),
  });

beforeEach(() => {
  chamadas = [];
  global.fetch = vi.fn((url, opcoes = {}) => {
    const metodo = (opcoes.method || "GET").toUpperCase();
    const caminho = String(url);
    chamadas.push({ metodo, caminho, corpo: opcoes.body ? JSON.parse(opcoes.body) : null });

    if (caminho.endsWith("/sortUsers")) return responder(200, respostaSorteio);
    if (metodo === "GET" && caminho.includes("/secret-santa/g-1")) return responder(200, { data: grupo });
    if (metodo === "GET") return responder(200, { data: [grupo] });
    if (metodo === "POST" && caminho.endsWith("/users"))
      return responder(201, { data: { _id: "u-3", name: "Hulk", email: "hulk@exemplo.com" } });
    if (metodo === "POST") return responder(201, { data: { _id: "g-2", name: "novo grupo", users: [] } });
    if (metodo === "PATCH") return responder(200, { data: grupo });
    return responder(204, undefined);
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const chamadasPara = (metodo, sufixo) =>
  chamadas.filter((chamada) => chamada.metodo === metodo && chamada.caminho.endsWith(sufixo));

const abrirGrupo = async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByText("vizinhança")).toBeTruthy());
  fireEvent.click(screen.getByText("vizinhança"));
  await waitFor(() => expect(screen.getByText("Wagner")).toBeTruthy());
};

describe("tela de grupos", () => {
  it("lista os grupos vindos da API", async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText("vizinhança")).toBeTruthy());
    expect(screen.getAllByText("2 participante(s)").length).toBe(1);
  });

  it("cria um grupo com o nome digitado", async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText("vizinhança")).toBeTruthy());

    fireEvent.change(screen.getByLabelText("Nome do novo grupo"), { target: { value: "heróis da marvel" } });
    fireEvent.click(screen.getByText("Criar grupo"));

    await waitFor(() => expect(chamadasPara("POST", "/secret-santa").length).toBe(1));
    expect(chamadasPara("POST", "/secret-santa")[0].corpo).toEqual({ name: "heróis da marvel", users: [] });
  });

  it("exclui o grupo so depois de confirmar no modal", async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText("vizinhança")).toBeTruthy());

    fireEvent.click(screen.getByText("Excluir"));
    expect(chamadasPara("DELETE", "/secret-santa/g-1").length).toBe(0);

    fireEvent.click(screen.getAllByText("Excluir grupo").at(-1));
    await waitFor(() => expect(chamadasPara("DELETE", "/secret-santa/g-1").length).toBe(1));
  });

  it("mostra o erro devolvido pela API", async () => {
    global.fetch = vi.fn(() => responder(400, { message: "Secret Santa Id Is Not Valid" }));
    render(<App />);
    await waitFor(() => expect(screen.getByText("Secret Santa Id Is Not Valid")).toBeTruthy());
  });
});

describe("tela do grupo", () => {
  it("abre o grupo e mostra os participantes com e-mail", async () => {
    await abrirGrupo();
    expect(screen.getByText("grasi.fst@gmail.com")).toBeTruthy();
    expect(screen.getByText("Participantes (2)")).toBeTruthy();
  });

  it("adiciona participante e recarrega o grupo", async () => {
    await abrirGrupo();

    fireEvent.change(screen.getByLabelText("Nome do participante"), { target: { value: "Hulk" } });
    fireEvent.change(screen.getByLabelText("E-mail do participante"), { target: { value: "hulk@exemplo.com" } });
    fireEvent.click(screen.getByText("Adicionar"));

    await waitFor(() => expect(chamadasPara("POST", "/users").length).toBe(1));
    expect(chamadasPara("POST", "/users")[0].corpo).toEqual({ name: "Hulk", email: "hulk@exemplo.com" });
    expect(chamadasPara("GET", "/secret-santa/g-1").length).toBeGreaterThan(1);
  });

  it("remove participante", async () => {
    await abrirGrupo();
    fireEvent.click(screen.getAllByText("Remover")[0]);
    await waitFor(() => expect(chamadasPara("DELETE", "/users/u-1").length).toBe(1));
  });

  it("renomeia o grupo", async () => {
    await abrirGrupo();
    fireEvent.change(screen.getByLabelText("Nome do grupo"), { target: { value: "heróis da marvel" } });
    fireEvent.click(screen.getByText("Renomear"));
    await waitFor(() => expect(chamadasPara("PATCH", "/secret-santa/g-1").length).toBe(1));
    expect(chamadasPara("PATCH", "/secret-santa/g-1")[0].corpo).toEqual({ name: "heróis da marvel" });
  });
});

describe("sorteio", () => {
  it("nao chama a API antes de confirmar", async () => {
    await abrirGrupo();
    fireEvent.click(screen.getByText("Sortear"));
    expect(screen.getByText("Confirmar sorteio")).toBeTruthy();
    expect(chamadasPara("GET", "/sortUsers").length).toBe(0);
  });

  it("mostra os pares e o relatorio de envio apos confirmar", async () => {
    await abrirGrupo();
    fireEvent.click(screen.getByText("Sortear"));
    fireEvent.click(screen.getByText("Sortear e enviar e-mails"));

    await waitFor(() => expect(chamadasPara("GET", "/sortUsers").length).toBe(1));
    await waitFor(() => expect(screen.getByText("Sorteio de vizinhança")).toBeTruthy());
    expect(screen.getByText("Envio: 2 e-mail(s) enviado(s), 0 falha(s)")).toBeTruthy();
    expect(screen.getAllByText("Grasi").length).toBeGreaterThan(1);
  });
});
