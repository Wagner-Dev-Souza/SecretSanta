// Configuracao do envio de e-mail, definida pelo proprio app.
//
// Ordem de prioridade ao enviar:
//   1. configuracao salva pelo app (arquivo local, senha cifrada)
//   2. MAILER_EMAIL / MAILER_PASS do ambiente (.env)
//   3. transporte de teste (MAILER_TRANSPORT=json), que nao envia nada
//
// A senha fica cifrada em disco (AES-256-GCM) com uma chave gerada nesta
// instalacao. Isso protege contra leitura casual do arquivo ou de um dump do
// banco; NAO protege contra quem tem acesso a maquina (a chave fica no mesmo
// volume). Estar fora do repositorio e o ponto principal.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DIR = process.env.CONFIG_DIR || path.join(__dirname, "..", "config");
const arquivoConfig = () => path.join(DIR, "email.json");
const arquivoChave = () => path.join(DIR, "chave.key");

const transporte = () => (process.env.MAILER_TRANSPORT || "gmail").toLowerCase();

const chave = () => {
  fs.mkdirSync(DIR, { recursive: true });
  const arquivo = arquivoChave();
  if (fs.existsSync(arquivo)) {
    return fs.readFileSync(arquivo);
  }
  const nova = crypto.randomBytes(32);
  fs.writeFileSync(arquivo, nova, { mode: 0o600 });
  return nova;
};

const cifrar = (texto) => {
  const iv = crypto.randomBytes(12);
  const cifra = crypto.createCipheriv("aes-256-gcm", chave(), iv);
  const dados = Buffer.concat([cifra.update(texto, "utf8"), cifra.final()]);
  return {
    iv: iv.toString("base64"),
    tag: cifra.getAuthTag().toString("base64"),
    dados: dados.toString("base64"),
  };
};

const decifrar = (guardado) => {
  const decifra = crypto.createDecipheriv("aes-256-gcm", chave(), Buffer.from(guardado.iv, "base64"));
  decifra.setAuthTag(Buffer.from(guardado.tag, "base64"));
  return Buffer.concat([
    decifra.update(Buffer.from(guardado.dados, "base64")),
    decifra.final(),
  ]).toString("utf8");
};

const mascarar = (email) => {
  if (!email || !email.includes("@")) return "";
  const [usuario, dominio] = email.split("@");
  const visivel = usuario.slice(0, 2);
  return `${visivel}${"*".repeat(Math.max(usuario.length - 2, 1))}@${dominio}`;
};

const doArquivo = () => {
  const arquivo = arquivoConfig();
  if (!fs.existsSync(arquivo)) return null;
  try {
    const guardado = JSON.parse(fs.readFileSync(arquivo, "utf8"));
    return { email: guardado.email, senha: decifrar(guardado.senha) };
  } catch (erro) {
    // arquivo corrompido ou chave diferente: melhor avisar do que falhar calado
    console.warn("[aviso] nao consegui ler a configuracao de e-mail salva:", erro.message);
    return null;
  }
};

const ler = () => {
  const doAmbiente = { email: process.env.MAILER_EMAIL, senha: process.env.MAILER_PASS };
  const salvo = doArquivo();

  if (salvo && salvo.email && salvo.senha) {
    return { ...salvo, transporte: transporte(), configurado: true, origem: "app" };
  }
  if (doAmbiente.email && doAmbiente.senha) {
    return { ...doAmbiente, transporte: transporte(), configurado: true, origem: "env" };
  }
  return {
    email: "",
    senha: "",
    transporte: transporte(),
    configurado: transporte() === "json",
    origem: "nenhuma",
  };
};

const salvar = ({ email, senha }) => {
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(
    arquivoConfig(),
    JSON.stringify({ email, senha: cifrar(senha) }, null, 2),
    { mode: 0o600 }
  );
  return status();
};

const limpar = () => {
  const arquivo = arquivoConfig();
  if (fs.existsSync(arquivo)) fs.unlinkSync(arquivo);
  return status();
};

// Nunca devolve a senha — so o suficiente para a tela dizer o que esta configurado
const status = () => {
  const atual = ler();
  return {
    configurado: atual.configurado,
    // so a versao mascarada sai daqui: o endereco completo nunca volta pela API,
    // entao nem log nem print de tela vazam quem envia
    emailMascarado: mascarar(atual.email),
    origem: atual.origem,
    transporte: atual.transporte,
    enviaDeVerdade: atual.transporte !== "json",
  };
};

module.exports = { ler, salvar, limpar, status, mascarar, DIR };
