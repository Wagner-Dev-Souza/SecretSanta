// Sobe um MongoDB em memoria e devolve o app Express pronto para o supertest.
// Precisa ser chamado ANTES de qualquer require do app: db/connection le as
// variaveis de ambiente no momento em que o modulo e carregado.
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.MAILER_TRANSPORT = "json";        // nenhum e-mail real nos testes
process.env.MAILER_EMAIL = "teste@exemplo.com";
process.env.MAILER_PASS = "senha-de-teste";

let mongo;

const startApp = async () => {
  mongo = await MongoMemoryServer.create();
  const { hostname, port } = new URL(mongo.getUri());

  process.env.DB_HOST = hostname;
  process.env.DB_PORT = port;
  process.env.DB_NAME = "secretSanta_test";

  // dotenv nao sobrescreve o que ja esta em process.env, entao o .env
  // de desenvolvimento nao vaza para dentro dos testes.
  const app = require("../../app");

  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("timeout conectando ao MongoDB de teste")), 30000);
      mongoose.connection.once("connected", () => {
        clearTimeout(timer); // sem isso o Jest fica com handle aberto e nao encerra sozinho
        resolve();
      });
    });
  }

  return app;
};

const cleanDatabase = async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
};

const stopApp = async () => {
  await cleanDatabase();
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
};

module.exports = { startApp, stopApp, cleanDatabase };
