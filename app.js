require('dotenv').config();
const express = require("express");
const app = express();
const routes = require("./routes");
require('./db/connection');
const { handleErrors } = require("./middlewares/handleError");

app.use(express.json());
app.use(routes);
app.use(handleErrors);

app.listen(3000, () => console.log("App Running on port 3000"));
