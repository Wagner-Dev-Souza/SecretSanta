const request = require("supertest");
const fs = require("node:fs");
const path = require("node:path");
const { startApp, stopApp, cleanDatabase } = require("./helpers/app");

let app;

beforeAll(async () => {
  app = await startApp();
});

afterEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await stopApp();
});

const SENHA_APP = "abcdefghijklmnop";
const arquivoConfig = () => path.join(process.env.CONFIG_DIR, "email.json");

describe("configuracao do envio de e-mail", () => {
  test("comeca sem configuracao feita no app", async () => {
    const resposta = await request(app).get("/configuracao/email").expect(200);
    // o ambiente de teste define MAILER_EMAIL/PASS, entao a origem e "env"
    expect(resposta.body.data.origem).toBe("env");
    expect(fs.existsSync(arquivoConfig())).toBe(false);
  });

  test("salva a credencial sem guardar a senha em texto e sem devolve-la", async () => {
    const resposta = await request(app)
      .put("/configuracao/email")
      .send({ email: "projeto.secretsanta@gmail.com", senha: "abcd efgh ijkl mnop" })
      .expect(200);

    expect(resposta.body.data.configurado).toBe(true);
    expect(resposta.body.data.origem).toBe("app");
    expect(resposta.body.data.emailMascarado).toMatch(/^pr\*+@gmail\.com$/);
    expect(JSON.stringify(resposta.body)).not.toContain(SENHA_APP);

    const conteudo = fs.readFileSync(arquivoConfig(), "utf8");
    expect(conteudo).not.toContain(SENHA_APP);   // senha cifrada no disco
    expect(conteudo).toMatch(/"iv"/);            // AES-GCM gravou iv e tag
    expect(conteudo).toMatch(/"tag"/);
  });

  test("a configuracao do app tem prioridade sobre o .env", async () => {
    await request(app)
      .put("/configuracao/email")
      .send({ email: "outro.endereco@gmail.com", senha: SENHA_APP })
      .expect(200);

    const resposta = await request(app).get("/configuracao/email").expect(200);
    expect(resposta.body.data.origem).toBe("app");
    expect(resposta.body.data.emailMascarado).toMatch(/^ou\*+@gmail\.com$/);
    expect(JSON.stringify(resposta.body)).not.toContain("outro.endereco@gmail.com");
  });

  test("limpar volta a usar o .env", async () => {
    await request(app)
      .put("/configuracao/email")
      .send({ email: "temporario@gmail.com", senha: SENHA_APP })
      .expect(200);

    await request(app).delete("/configuracao/email").expect(200);

    const resposta = await request(app).get("/configuracao/email").expect(200);
    expect(resposta.body.data.origem).toBe("env");
    expect(fs.existsSync(arquivoConfig())).toBe(false);
  });

  test("e-mail invalido devolve 400", async () => {
    await request(app)
      .put("/configuracao/email")
      .send({ email: "sem-arroba", senha: SENHA_APP })
      .expect(400);
  });

  test("senha curta demais devolve 400", async () => {
    await request(app)
      .put("/configuracao/email")
      .send({ email: "teste@gmail.com", senha: "123" })
      .expect(400);
  });
});
