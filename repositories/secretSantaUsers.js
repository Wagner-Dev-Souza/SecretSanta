const { secretSanta, sortResult } = require('../models/secretSanta');
const { USER_NOT_FOUND, SECRET_SANTA_NOT_FOUND } = require("../constants/errors");
const { v4: uuidv4 } = require("uuid");

const getSecretSantaUsers = async (filter) => {
    const secretSantaData = await secretSanta.findById(filter);
    
    if(!secretSantaData) {
        throw SECRET_SANTA_NOT_FOUND
    }

    return secretSantaData.users;
};

const getSecretSantaUsersById = async (secretSantaId, userId) => {
    const secretSantaData = await secretSanta.findById(secretSantaId);
    
    if (!secretSantaData) {
        throw SECRET_SANTA_NOT_FOUND
    }

    const result = secretSantaData.users.id(userId);
    
    if (!result) {
        throw USER_NOT_FOUND
    }
    
    return result;
};

const createSecretSantaUsers = async (secretSantaId, usersSecretSanta) => {
    const secretSantaData = await secretSanta.findById(secretSantaId);

    if(!secretSantaData) {
        throw SECRET_SANTA_NOT_FOUND
    }

    secretSantaData.users.push(usersSecretSanta);
    await secretSantaData.save(); // aqui ele salva no banco
    return usersSecretSanta; 
};

const deleteSecretSantaUser = async (secretSantaId, userId) => {
    const secretSantaData = await secretSanta.findById(secretSantaId);

    if (!secretSantaData) {
        throw SECRET_SANTA_NOT_FOUND
    }

    const user = secretSantaData.users.id(userId);

    if (!user) {
        throw USER_NOT_FOUND
    }

    user.deleteOne();

    await secretSantaData.save();
};

const updateSecretSantaUsers = async (secretSantaId, userId, usersData) => {
    const secretSantaData = await secretSanta.findById(secretSantaId);

    if (!secretSantaData) {
        throw SECRET_SANTA_NOT_FOUND
    }

    const user = secretSantaData.users.id(userId)

    if (!user) {
        throw USER_NOT_FOUND
    }

    user.set({...usersData});
    secretSantaData.save();

    return user;
};

const createSortResult = async (secretSantaResultData) => {
    return await sortResult.create({...secretSantaResultData, _id: uuidv4()});
};

module.exports = {
    getSecretSantaUsers,
    getSecretSantaUsersById,
    createSecretSantaUsers,
    deleteSecretSantaUser,
    updateSecretSantaUsers,
    createSortResult
}
