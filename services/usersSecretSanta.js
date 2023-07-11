const repository = require("../repositories/secretSantaUsers");
const { v4: uuidv4 } = require("uuid");

const getUsers = async (secretSantaId) => {
  return await repository.getSecretSantaUsers(secretSantaId);
}

const getUsersById = async (secretSantaId, userId) => {
  return await repository.getSecretSantaUsersById(secretSantaId, userId);
}

const createUsers = async (secretSantaId, usersData) => {
  usersData = {
    ...usersData,
    _id: uuidv4(),
  };
  
  return await repository.createSecretSantaUsers(secretSantaId, usersData);
}
  
const deleteUsers = async (secretSantaId, userId) => {
  return await repository.deleteSecretSantaUser(secretSantaId, userId);
  }
  
const updateUsers = async (secretSantaId, userId, usersData) => {
  return await repository.updateSecretSantaUsers(secretSantaId, userId, usersData);
  }
    
module.exports = {
  getUsers,
  getUsersById,
  createUsers,
  deleteUsers,
  updateUsers
}
