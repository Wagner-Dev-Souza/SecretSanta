const { SECRET_SANTA_NOT_FOUND, USER_NOT_FOUND } = require("../constants/errors");

const handleErrors = (error, req, res, next) => {
    if (error === SECRET_SANTA_NOT_FOUND) {
        return res.status(404).json({
            status: 404,
            message: "Amigo oculto não encontrado"
        })
    }

    if (error === USER_NOT_FOUND) {
        return res.status(404).json({
            status: 404,
            message: "Usuário não encontrado"
        })
    }

    return res.status(500).json({
        status: 500,
        message: "Internal Server Error"
    });
}

module.exports = {
    handleErrors
}
