const { secretSanta } = require("../models/secretSanta");
const { v4: uuidv4 } = require("uuid");

const getSecretSanta = async (filter) => {
    return await secretSanta.find(filter);
};

const getSecretSantaById = async (id) => {
    const result = await secretSanta.findById(id);
    return result;
}

const createSecretSanta = async (secretSantaData) => {
    const result = await secretSanta.create({ ...secretSantaData, _id: uuidv4() });
    return result;
}

const deleteSecretSanta = async (id) => {
    await secretSanta.findByIdAndDelete(id);
}

const updateSecretSanta = async (id, secretSantaData) => {
    const result = await secretSanta.findByIdAndUpdate(id, secretSantaData, {
        new: true,
    });
    return result;
}

module.exports = {
    getSecretSanta,
    getSecretSantaById,
    createSecretSanta,
    deleteSecretSanta,
    updateSecretSanta
}
