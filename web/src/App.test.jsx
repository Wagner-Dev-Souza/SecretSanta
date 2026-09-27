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

const pares = [
  { name: "Wagner", email: "wagner@exemplo.com", amigoOculto: { name: "Grasi", email: "grasi@exemplo.com" } },
  { name: "Grasi", email: "grasi@exemplo.com", amigoOculto: { name: "Wagner", email: "wagner@exemplo.com" } },
];

const respostaSorteio = (mail) => ({
  message: "Successfully Raffled Users",
  data: { _id: "r-1", secretSantaName: "vizinhança", pairs: pares },
  mail,
});

let chamadas;
let configuradoNoMock;

const responder = (status, corpo) =>
  Promise.resolve({
    ok: status < 400,
    status,
    text: () => Promise.resolve(corpo === undefined ? "" : JSON.stringify(corpo)),
  });

beforeEach(() => {
  chamadas = [];
  configuradoNoMock = true;

  global.fetch = vi.fn((url, opcoes = {}) => {
    const metodo = (opcoes.method || "GET").toUpperCase();
    const caminho = String(url);
    chamadas.push({ metodo, caminho, corpo: opcoes.body ? JSON.parse(opcoes.body) : null });

    if (caminho.includes("/configuracao/email")) {
      if (metodo === "PUT") {
        return responder(200, {
          data: { configurado: true, email: "projeto@gmail.com", emailMascarado: "pr*****@gmail.com", origem: "app" },
        });
      }
      if (metodo === "DELETE") {
        return responder(200, { data: { configurado: true, emailMascarado: "en**@gmail.com", origem: "env" } });
      }
      return responder(200, {
        data: {
          configurado: configuradoNoMock,
          email: "ana@gmail.com",
          emailMascarado: "an***@gmail.com",
          origem: configuradoNoMock ? "env" : "nenhuma",
          transporte: "gmail",
          enviaDeVerdade: true,
        },
      });
    }

    if (caminho.includes("/sortUsers")) {
      const semEnvio = caminho.includes("enviarEmail=false");
      return responder(
        200,
        respostaSorteio({
          transport: "json",
          configured: true,
          sent: semEnvio ? 0 : 2,
          failed: 0,
          errors: [],
          skipped: semEnvio,
          motivo: semEnvio ? "sorteio sem envio de e-mail" : undefined,
        })
      );
    }

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
  localStorage.clear();
});

const chamadasPara = (metodo, trecho) =>
  chamadas.filter((chamada) => chamada.metodo === metodo && chamada.caminho.includes(trecho));

const abrirGrupo = async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByText("vizinhança")).toBeTruthy());
  fireEvent.click(screen.getByText("vizinhança"));
  await waitFor(() => expect(screen.getByText("Wagner")).toBeTruthy());
};

const confirmarSorteio = async (rotulo) => {
  fireEvent.click(screen.getByText("Sortear"));
  await waitFor(() => expect(screen.getByText("Confirmar sorteio")).toBeTruthy());
  fireEvent.click(screen.getByText(rotulo));
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

describe("configuracao do envio de e-mail", () => {
  it("mostra o endereco configurado no topo", async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText("E-mail: an***@gmail.com")).toBeTruthy());
  });

  it("avisa na primeira execucao sem e-mail configurado e nao insiste depois de fechar", async () => {
    configuradoNoMock = false;
    render(<App />);

    await waitFor(() => expect(screen.getByText("Configurar o envio de e-mail")).toBeTruthy());
    expect(localStorage.getItem("secretsanta.configuracao.dispensada")).toBe(null);

    fireEvent.click(screen.getByText("Fechar"));
    await waitFor(() => expect(screen.queryByText("Configurar o envio de e-mail")).toBe(null));
    expect(localStorage.getItem("secretsanta.configuracao.dispensada")).toBe("1");
  });

  it("o botao Ajuda mostra o passo a passo da senha de app", async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText(/E-mail:/)).toBeTruthy());

    fireEvent.click(screen.getByText(/E-mail:/));
    await waitFor(() => expect(screen.getByText("Envio de e-mail")).toBeTruthy());

    fireEvent.click(screen.getByText("Ajuda"));
    expect(screen.getByText("Como criar a senha de app do Gmail")).toBeTruthy();
    expect(screen.getByText(/myaccount\.google\.com\/apppasswords/)).toBeTruthy();
  });

  it("salva a credencial e passa a mostrar o endereco mascarado", async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText(/E-mail:/)).toBeTruthy());

    fireEvent.click(screen.getByText(/E-mail:/));
    await waitFor(() => expect(screen.getByText("Envio de e-mail")).toBeTruthy());

    fireEvent.change(screen.getByLabelText("E-mail que envia"), { target: { value: "projeto@gmail.com" } });
    fireEvent.change(screen.getByLabelText("Senha de app"), { target: { value: "abcd efgh ijkl mnop" } });
    fireEvent.click(screen.getByText("Salvar"));

    await waitFor(() => expect(chamadasPara("PUT", "/configuracao/email").length).toBe(1));
    expect(chamadasPara("PUT", "/configuracao/email")[0].corpo).toEqual({
      email: "projeto@gmail.com",
      senha: "abcdefghijklmnop",
    });
    await waitFor(() => expect(screen.getByText("E-mail: pr*****@gmail.com")).toBeTruthy());
  });
});

describe("sorteio", () => {
  it("nao chama a API antes de confirmar", async () => {
    await abrirGrupo();
    fireEvent.click(screen.getByText("Sortear"));
    expect(screen.getByText("Confirmar sorteio")).toBeTruthy();
    expect(chamadasPara("GET", "/sortUsers").length).toBe(0);
  });

  it("sorteia com envio e mostra os pares ocultos com o relatorio", async () => {
    await abrirGrupo();
    await confirmarSorteio("Sortear e enviar 2 e-mail(s)");

    await waitFor(() => expect(chamadasPara("GET", "/sortUsers").length).toBe(1));
    expect(chamadasPara("GET", "/sortUsers")[0].caminho).toContain("enviarEmail=true");

    await waitFor(() => expect(screen.getByText("Sorteio de vizinhança")).toBeTruthy());
    expect(screen.getAllByText("•••••").length).toBe(2);
    expect(screen.getByText("Envio: 2 e-mail(s) enviado(s), 0 falha(s)")).toBeTruthy();
  });

  it("revela e oculta um par ao clicar", async () => {
    await abrirGrupo();
    await confirmarSorteio("Sortear e enviar 2 e-mail(s)");
    await waitFor(() => expect(screen.getAllByText("•••••").length).toBe(2));

    const primeiroPar = screen.getAllByText("Wagner")[1].closest("button");
    fireEvent.click(primeiroPar);
    await waitFor(() => expect(screen.getAllByText("•••••").length).toBe(1));
    expect(primeiroPar.textContent).toContain("Grasi");

    fireEvent.click(primeiroPar);
    await waitFor(() => expect(screen.getAllByText("•••••").length).toBe(2));
  });

  it("revelar tudo mostra todos os pares de uma vez", async () => {
    await abrirGrupo();
    await confirmarSorteio("Sortear e enviar 2 e-mail(s)");
    await waitFor(() => expect(screen.getByText("Revelar tudo")).toBeTruthy());

    fireEvent.click(screen.getByText("Revelar tudo"));
    await waitFor(() => expect(screen.queryAllByText("•••••").length).toBe(0));
    expect(screen.getByText("Ocultar tudo")).toBeTruthy();
  });

  it("sorteia sem enviar e-mail quando essa opcao e escolhida", async () => {
    await abrirGrupo();
    await confirmarSorteio("Sortear sem enviar e-mail");

    await waitFor(() => expect(chamadasPara("GET", "/sortUsers").length).toBe(1));
    expect(chamadasPara("GET", "/sortUsers")[0].caminho).toContain("enviarEmail=false");

    await waitFor(() =>
      expect(screen.getByText("Nenhum e-mail foi enviado: este sorteio foi só para ver os pares.")).toBeTruthy()
    );
    expect(screen.getAllByText("•••••").length).toBe(2);
  });
});
