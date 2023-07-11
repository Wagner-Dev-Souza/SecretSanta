const services = require("../services/usersSecretSanta");
const serviceSecretSanta = require("../services/secretSanta")
const serviceResult = require("../services/sortResult");

const getUsers = async (req, res) => {
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

const getUsersById = async (req, res) => {
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

const createUsers = async (req, res) => {
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

const sortUsers = async (req, res) => {
  try {
    const secretSanta = await serviceSecretSanta.getSecretSantaById(req.params.id);
    const result = await serviceResult.sorteio(secretSanta);
    
    return res.json({
      message: "Successfully Raffled Users",
      data: result,
    });
  } catch (error) {
    console.log(error);
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
