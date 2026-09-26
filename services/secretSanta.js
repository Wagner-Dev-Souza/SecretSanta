const repository = require('../repositories/secretSanta');

const getSecretSanta = async ({name: secretSantaName}) => {
  if (secretSantaName) {
    return await repository.getSecretSanta({name: secretSantaName});
  }

  const result = await repository.getSecretSanta({});

  return result;
};

const getSecretSantaById = async (id) => {
  const result = await repository.getSecretSantaById(id);
  return result
}

const createSecretSanta = async (secretSantaData) => {
  const result = await repository.createSecretSanta(secretSantaData);
  return result;
}

const deleteSecretSanta = async (id) => {
  const result = await repository.deleteSecretSanta(id);
  return result;
}

const updateSecretSanta = async (id, secretSantaData) => {
  const result = await repository.updateSecretSanta(id, secretSantaData);
  return result;
}

module.exports = {
  getSecretSanta,
  getSecretSantaById,
  createSecretSanta,
  deleteSecretSanta,
  updateSecretSanta
}
