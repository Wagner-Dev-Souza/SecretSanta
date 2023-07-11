const mongoose = require('mongoose');

const HOST = process.env.DB_HOST;
const PORT = process.env.DB_PORT;
const DB = process.env.DB_NAME;

// const url = `mongodb://${USER}:${PASS}@${HOST}:${PORT}/${DB}`;
const url = `mongodb://${HOST}:${PORT}/${DB}`;

const conn = async () => {
    try {
        await mongoose.connect(url);
        console.log("Banco conectado");
    } catch (error) {
        console.error("Deu ruim menó", error);
    }
}

conn();

mongoose.connection.on('error', error => console.log("Deu merda", error));
