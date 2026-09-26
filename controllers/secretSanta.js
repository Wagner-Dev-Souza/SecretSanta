let services = require('../services');

const getSecretSanta = async (req, res) => {
  const filters = req.query || {};
  
  const result = await services.getSecretSanta(filters);

  res.status(200).json({
    data: result,
  });
}
  
const getSecretSantaById = async (req, res) => {
  const id = req.params.id;

  const result = await services.getSecretSantaById(id);
  
  if (!result) {
    return res.status(404).json({
      status: 404,
      message: "Amigo oculto não encontrado",
    });
  }
 
  res.status(200).json({
    data: result,
  });
};

const createSecretSanta = async (req, res) => {
  const result = await services.createSecretSanta(req.body);

  res.status(201).json({
    data: result,
  });
};
  
const deleteSecretSanta = async (req, res) => {
  const id = req.params.id;
  
  const result = await services.deleteSecretSanta(id);
  
  if (!result) {
    return res.status(404).json({
      status: 404,
      message: "Amigo oculto não encontrado",
    });
  }  
  res.status(204).send();
};

const updateSecretSanta = async (req, res) => {
  const id = req.params.id;
  const body = req.body;
  
  const result = await services.updateSecretSanta(id, body);
  
  if (!result) {
    return res.status(404).json({
      status: 404,
      message: "Amigo oculto não encontrado",
    });
  }  
  res.json({
    data: result
  });
};

module.exports = {
  getSecretSanta,
  getSecretSantaById,
  createSecretSanta,
  deleteSecretSanta,
  updateSecretSanta
}
  