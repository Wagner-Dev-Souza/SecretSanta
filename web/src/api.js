// A URL base da API e o unico ponto de configuracao do front:
//   sem configurar        -> "/api"  (mesmo host, proxy do nginx; tudo em Docker)
//   VITE_API_BASE_URL=... -> API remota ou backend embutido dentro do .exe
const BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

export const baseDaApi = BASE;

const pedir = async (caminho, opcoes = {}) => {
  const resposta = await fetch(BASE + caminho, {
    headers: { "Content-Type": "application/json" },
    ...opcoes,
  });

  const texto = await resposta.text();
  const corpo = texto ? JSON.parse(texto) : null;

  if (!resposta.ok) {
    throw new Error((corpo && corpo.message) || "Erro " + resposta.status);
  }

  return corpo;
};

const comCorpo = (metodo, dados) => ({
  method: metodo,
  body: JSON.stringify(dados),
});

// grupos
export const listarGrupos = async (nome) => {
  const query = nome ? "?name=" + encodeURIComponent(nome) : "";
  const corpo = await pedir("/secret-santa" + query);
  return (corpo && corpo.data) || [];
};

export const buscarGrupo = async (id) => {
  const corpo = await pedir("/secret-santa/" + id);
  return corpo && corpo.data;
};

export const criarGrupo = async (nome) => {
  const corpo = await pedir("/secret-santa", comCorpo("POST", { name: nome, users: [] }));
  return corpo && corpo.data;
};

export const renomearGrupo = async (id, nome) => {
  const corpo = await pedir("/secret-santa/" + id, comCorpo("PATCH", { name: nome }));
  return corpo && corpo.data;
};

export const excluirGrupo = async (id) => {
  await pedir("/secret-santa/" + id, { method: "DELETE" });
};

// participantes (as rotas respondem com o participante; o grupo e recarregado)
export const adicionarParticipante = async (id, dados) =>
  pedir("/secret-santa/" + id + "/users", comCorpo("POST", dados));

export const editarParticipante = async (id, userId, dados) =>
  pedir("/secret-santa/" + id + "/users/" + userId, comCorpo("PATCH", dados));

export const removerParticipante = async (id, userId) => {
  await pedir("/secret-santa/" + id + "/users/" + userId, { method: "DELETE" });
};

// sorteio: devolve os pares em data e o relatorio de envio em mail
export const sortear = async (id) => pedir("/secret-santa/" + id + "/sortUsers");
