const routes = require('express').Router();
const {
    getSecretSanta,
    getSecretSantaById,
    createSecretSanta,
    deleteSecretSanta,
    updateSecretSanta
} = require("../controllers/secretSanta");

const {
    getUsers,
    getUsersById,
    createUsers,
    deleteUsers,
    updateUsers,
    sortUsers
} = require("../controllers/usersSecretSanta");

const { validateSecretSantaId, validateSecretSantaBody, validateSecretSantaUserBody } = require("../middlewares/validators");

//CRUD Amigo-Oculto
routes.get("/secret-santa", getSecretSanta);
routes.get("/secret-santa/:id", validateSecretSantaId, getSecretSantaById);
routes.post("/secret-santa", validateSecretSantaBody, createSecretSanta);
routes.delete("/secret-santa/:id", validateSecretSantaId, deleteSecretSanta);
routes.patch("/secret-santa/:id", validateSecretSantaId, updateSecretSanta);

//CRUD USERS de um amigo-oculto
routes.get("/secret-santa/:id/users", validateSecretSantaId, getUsers); 
routes.get("/secret-santa/:id/users/:userId", validateSecretSantaId, getUsersById);
routes.post("/secret-santa/:id/users", validateSecretSantaId, validateSecretSantaUserBody, createUsers);
routes.delete("/secret-santa/:id/users/:userId", validateSecretSantaId, deleteUsers);
routes.patch("/secret-santa/:id/users/:userId", validateSecretSantaId, updateUsers);
routes.get("/secret-santa/:id/sortUsers", sortUsers);

module.exports = routes;
