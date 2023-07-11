const secretSantaService = require("./secretSanta");
const usersSecretSantaService = require("./usersSecretSanta");
const sortear = require("./sortResult")

module.exports = {
    ...secretSantaService,
    ...usersSecretSantaService,
    ...sortear
}
