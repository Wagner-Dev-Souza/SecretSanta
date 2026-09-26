require('dotenv').config();
const express = require("express");
const app = express();
const routes = require("./routes");
require('./db/connection');
const { handleErrors } = require("./middlewares/handleError");

app.use(express.json());
app.use(routes);
app.use(handleErrors);

// Sobe o servidor apenas quando executado direto (npm start / node app.js).
// Os testes importam o app e exercitam a porta efemera do supertest.
if (require.main === module) {
  app.listen(3000, () => console.log("App Running on port 3000"));
}

module.exports = app;
