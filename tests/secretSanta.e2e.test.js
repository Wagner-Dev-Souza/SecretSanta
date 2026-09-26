const request = require("supertest");
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

describe("roteiro E2E: evento, renome, busca, participante e remocao", () => {
  test("cria 'heróis da dc', renomeia para 'heróis da marvel', acha o hulk e apaga", async () => {
    // 1. cria o grupo
    const criado = await request(app)
      .post("/secret-santa")
      .send({ name: "heróis da dc", users: [] })
      .expect(201);
    expect(criado.body.data.name).toBe("heróis da dc");
    const id = criado.body.data._id;

    // 2. renomeia
    const renomeado = await request(app)
      .patch(`/secret-santa/${id}`)
      .send({ name: "heróis da marvel" })
      .expect(200);
    expect(renomeado.body.data.name).toBe("heróis da marvel");

    // 3. o nome antigo nao existe mais
    const buscaDc = await request(app)
      .get("/secret-santa")
      .query({ name: "heróis da dc" })
      .expect(200);
    expect(buscaDc.body.data).toEqual([]);

    // 4. adiciona o hulk
    const hulk = await request(app)
      .post(`/secret-santa/${id}/users`)
      .send({ name: "hulk", email: "hulksmash@gmail.com" })
      .expect(201);
    expect(hulk.body.data.name).toBe("hulk");

    // 5. busca o grupo renomeado, ja com o hulk dentro
    const buscaMarvel = await request(app)
      .get("/secret-santa")
      .query({ name: "heróis da marvel" })
      .expect(200);
    expect(buscaMarvel.body.data).toHaveLength(1);
    expect(buscaMarvel.body.data[0].users).toHaveLength(1);
    expect(buscaMarvel.body.data[0].users[0]).toMatchObject({
      name: "hulk",
      email: "hulksmash@gmail.com",
    });

    // 6. apaga o grupo (204 de verdade, nao 200 com "nao encontrado")
    await request(app).delete(`/secret-santa/${id}`).expect(204);

    // 7. nao esta mais la
    const buscaFinal = await request(app)
      .get("/secret-santa")
      .query({ name: "heróis da marvel" })
      .expect(200);
    expect(buscaFinal.body.data).toEqual([]);

    // 8. buscar pelo id apagado devolve 404
    const porId = await request(app).get(`/secret-santa/${id}`).expect(404);
    expect(porId.body.message).toBe("Amigo oculto não encontrado");
  });
});

describe("validacoes", () => {
  test("UUID invalido na rota de participantes devolve 400", async () => {
    const resposta = await request(app).get("/secret-santa/nao-e-uuid/users").expect(400);
    expect(resposta.body.message).toBe("Secret Santa Id Is Not Valid");
  });

  test("evento sem nome devolve 400", async () => {
    await request(app).post("/secret-santa").send({ name: "", users: [] }).expect(400);
  });

  test("evento sem lista de participantes devolve 400", async () => {
    await request(app).post("/secret-santa").send({ name: "sem lista" }).expect(400);
  });

  test("participante sem e-mail devolve 400", async () => {
    const criado = await request(app).post("/secret-santa").send({ name: "grupo", users: [] }).expect(201);
    await request(app)
      .post(`/secret-santa/${criado.body.data._id}/users`)
      .send({ name: "sem email" })
      .expect(400);
  });

  test("participante inexistente devolve 404", async () => {
    const criado = await request(app).post("/secret-santa").send({ name: "grupo", users: [] }).expect(201);
    const resposta = await request(app)
      .get(`/secret-santa/${criado.body.data._id}/users/2ff62129-285e-48ad-aec1-677cc2b06449`)
      .expect(404);
    expect(resposta.body.message).toBe("Usuário não encontrado");
  });
});
