// Prova que a falha de e-mail deixou de ser invisivel: o sorteio responde
// com o relatorio de envio em vez de dizer "sucesso" sem ter enviado nada.
jest.mock("nodemailer", () => ({
  createTransport: () => ({
    sendMail: jest.fn().mockRejectedValue(new Error("SMTP indisponivel")),
    verify: jest.fn().mockResolvedValue(true),
  }),
}));

const request = require("supertest");
const mongoose = require("mongoose");
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

test("falha de SMTP aparece no relatorio e o resultado continua persistido", async () => {
  const criado = await request(app)
    .post("/secret-santa")
    .send({ name: "grupo com smtp caindo", users: [] })
    .expect(201);
  const id = criado.body.data._id;

  for (const [nome, email] of [["Wagner", "w@exemplo.com"], ["Grasi", "g@exemplo.com"]]) {
    await request(app).post(`/secret-santa/${id}/users`).send({ name: nome, email }).expect(201);
  }

  const sorteio = await request(app).get(`/secret-santa/${id}/sortUsers`).expect(200);

  expect(sorteio.body.mail.sent).toBe(0);
  expect(sorteio.body.mail.failed).toBe(2);
  expect(sorteio.body.mail.errors).toHaveLength(2);
  expect(sorteio.body.mail.errors[0].error).toBe("SMTP indisponivel");

  // o sorteio em si continua valido e gravado
  expect(sorteio.body.data.pairs).toHaveLength(2);
  const gravado = await mongoose.connection.db
    .collection("sortresults")
    .countDocuments({ secretSantaName: "grupo com smtp caindo" });
  expect(gravado).toBe(1);
});
