const services = require("../services/usersSecretSanta");
const serviceSecretSanta = require("../services/secretSanta")
const serviceResult = require("../services/sortResult");
const { SECRET_SANTA_NOT_FOUND } = require("../constants/errors");

const getUsers = async (req, res, next) => {
  const id = req.params.id;
  
  try {
  const result = await services.getUsers(id);
  
  res.json({
    data: result,
  });
  } catch(error) {
    return next(error)
  }
};

const getUsersById = async (req, res, next) => {
  const { id, userId } = req.params;

  try{
  const result = await services.getUsersById(id, userId);
  
  res.json({
    data: result,
  });
  } catch(error) {
    return next(error)
  }
};

const createUsers = async (req, res, next) => {
  const id = req.params.id;
  const body = req.body;
  
  try {
    const result = await services.createUsers(id, body);
    res.status(201).json({
      data: result
    });
  } catch(error) {
    return next(error);
  }
};

const deleteUsers = async (req, res, next) => {
  const secretSantaId = req.params.id;
  const userId = req.params.userId;
  
  try {
    await services.deleteUsers(secretSantaId, userId);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

const updateUsers = async (req, res, next) => {
  const secretSantaId = req.params.id;
  const userId = req.params.userId;
  const body = req.body;
  
  try {
    const result = await services.updateUsers(secretSantaId, userId, body);
  
    return res.json ({
      data: result
    });
  } catch(error) {
    return next(error);
  }
};

const sortUsers = async (req, res, next) => {
  try {
    const secretSanta = await serviceSecretSanta.getSecretSantaById(req.params.id);

    if (!secretSanta) {
      throw SECRET_SANTA_NOT_FOUND;
    }

    // ?enviarEmail=false sorteia sem disparar e-mail (o organizador ve os pares na tela)
    const enviarEmail = String(req.query.enviarEmail ?? "true").toLowerCase() !== "false";
    const { result, mail } = await serviceResult.sorteio(secretSanta, { enviarEmail });

    return res.json({
      message: "Successfully Raffled Users",
      data: result,
      mail,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getUsers,
  getUsersById,
  createUsers,
  deleteUsers,
  updateUsers,
  sortUsers
}
