const request = require("supertest");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
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

const criarGrupo = async (nome, participantes) => {
  const criado = await request(app).post("/secret-santa").send({ name: nome, users: [] }).expect(201);
  const id = criado.body.data._id;
  const ids = {};
  for (const [nomeParticipante, email] of participantes) {
    const resposta = await request(app)
      .post(`/secret-santa/${id}/users`)
      .send({ name: nomeParticipante, email })
      .expect(201);
    ids[nomeParticipante] = resposta.body.data._id;
  }
  return { id, ids };
};

const conferirIntegridade = (pares, quantidadeEsperada) => {
  expect(pares).toHaveLength(quantidadeEsperada);
  // ninguem tira a si mesmo
  expect(pares.every((par) => par.name !== par.amigoOculto.name)).toBe(true);
  // todo mundo da exatamente 1 presente e recebe exatamente 1
  const quemDa = pares.map((par) => par.name).sort();
  const quemRecebe = pares.map((par) => par.amigoOculto.name).sort();
  expect(quemDa).toEqual(quemRecebe);
  expect(new Set(quemDa).size).toBe(quantidadeEsperada);
  // o par ficou gravado (o bug do occultFriend apagava isso)
  expect(pares.every((par) => par.amigoOculto.email)).toBe(true);
};

describe("vizinhança", () => {
  test("remove fabiana, inclui Marcia, sorteia e persiste os pares", async () => {
    const { id, ids } = await criarGrupo("vizinhança", [
      ["Wagner", "souzawagner.ti@gmail.com"],
      ["Grasi", "grasi.fst@gmail.com"],
      ["fabiana", "fabiglitter@gmail.com"],
      ["Luiz Cláudio", "quintinopub@gmail.com"],
    ]);

    // remove a fabiana
    await request(app).delete(`/secret-santa/${id}/users/${ids.fabiana}`).expect(204);

    // inclui a Marcia
    await request(app)
      .post(`/secret-santa/${id}/users`)
      .send({ name: "Marcia", email: "Mademal@hotmail.com" })
      .expect(201);

    const grupo = await request(app).get(`/secret-santa/${id}`).expect(200);
    const nomes = grupo.body.data.users.map((user) => user.name);
    expect(nomes).toEqual(expect.arrayContaining(["Wagner", "Grasi", "Luiz Cláudio", "Marcia"]));
    expect(nomes).toHaveLength(4);
    expect(nomes).not.toContain("fabiana");

    // sorteia
    const sorteio = await request(app).get(`/secret-santa/${id}/sortUsers`).expect(200);
    expect(sorteio.body.message).toBe("Successfully Raffled Users");
    conferirIntegridade(sorteio.body.data.pairs, 4);
    expect(sorteio.body.data.secretSantaName).toBe("vizinhança");

    // o e-mail foi enviado pelo transporte de teste, sem falha
    expect(sorteio.body.mail).toMatchObject({ transport: "json", sent: 4, failed: 0 });
    expect(sorteio.body.mail.errors).toEqual([]);

    // e o resultado esta no banco, com o par completo
    const gravado = await mongoose.connection.db
      .collection("sortresults")
      .findOne({ secretSantaName: "vizinhança" });
    expect(gravado).toBeTruthy();
    expect(gravado.pairs).toHaveLength(4);
    expect(gravado.pairs[0].amigoOculto.email).toBeTruthy();
  });
});

describe("amigos do waguinho", () => {
  test("sorteia 4 participantes e persiste", async () => {
    const { id } = await criarGrupo("amigos do waguinho", [
      ["Wagner", "loghanth@gmail.com"],
      ["grasi", "grasi.fst@gmail.com"],
      ["Camila", "Camiguedes@gmail.com"],
      ["Leonardo", "paladinoleo@gmail.com"],
    ]);

    const sorteio = await request(app).get(`/secret-santa/${id}/sortUsers`).expect(200);
    conferirIntegridade(sorteio.body.data.pairs, 4);
    expect(sorteio.body.mail).toMatchObject({ sent: 4, failed: 0 });

    const total = await mongoose.connection.db
      .collection("sortresults")
      .countDocuments({ secretSantaName: "amigos do waguinho" });
    expect(total).toBe(1);
  });
});

describe("casos de borda do sorteio", () => {
  test("sorteio em grupo inexistente devolve 404 (antes estourava 500)", async () => {
    const resposta = await request(app).get(`/secret-santa/${uuidv4()}/sortUsers`).expect(404);
    expect(resposta.body.message).toBe("Amigo oculto não encontrado");
  });

  test("sorteio com id invalido devolve 400", async () => {
    await request(app).get("/secret-santa/nao-e-uuid/sortUsers").expect(400);
  });
});
