// A URL base da API e o unico ponto de configuracao do front:
//   sem configurar        -> "/api"  (mesmo host, proxy do nginx; tudo em Docker)
//   VITE_API_BASE_URL=... -> API remota ou backend embutido dentro do .exe
// Assim o mesmo front roda nos tres cenarios sem alterar codigo.
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

export const listarGrupos = async (nome) => {
  const query = nome ? "?name=" + encodeURIComponent(nome) : "";
  const corpo = await pedir("/secret-santa" + query);
  return (corpo && corpo.data) || [];
};
