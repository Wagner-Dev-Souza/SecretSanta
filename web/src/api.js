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

// sorteio: enviarEmail=false sorteia sem disparar e-mail nenhum
export const sortear = async (id, { enviarEmail = true } = {}) =>
  pedir(`/secret-santa/${id}/sortUsers?enviarEmail=${enviarEmail}`);

// configuracao do envio de e-mail (senha nunca volta da API)
export const obterConfiguracaoEmail = async () => {
  const corpo = await pedir("/configuracao/email");
  return (corpo && corpo.data) || null;
};

export const salvarConfiguracaoEmail = async (dados) => {
  const corpo = await pedir("/configuracao/email", comCorpo("PUT", dados));
  return (corpo && corpo.data) || null;
};

export const limparConfiguracaoEmail = async () => {
  const corpo = await pedir("/configuracao/email", { method: "DELETE" });
  return (corpo && corpo.data) || null;
};
