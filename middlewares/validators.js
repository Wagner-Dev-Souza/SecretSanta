const uuid = require("uuid");

const validateSecretSantaId = (req, res, next) => {
    const { id } = req.params;

    if (!uuid.validate(id)) {
        return res.status(400).json({
            message: "Secret Santa Id Is Not Valid",
        });
    }

    next();
}

const validateSecretSantaBody = (req, res, next) => {
    const { name, users } = req.body;
    
    if (!name || name == "") {
        return res.status(400).json({
            message: "Name Must Be Greater Than 0",
        });
    }

    if (!users || !Array.isArray(users)) {
        return res.status(400).json({
            message: "Users Must Exists As An Array",
        });
    }

    next();
}

const validateSecretSantaUserBody = (req, res, next) => {
    const { name, email } = req.body;

    if(!name || name == "") {
        return res.status(400).json({
            message: "Name Must Be Greater Than 0",
        });
    }

    if (!email || email == "") {
        return res.status(400).json({
            message: "Email Must Be Greater Than 0",
        });
    }

    next();
}

module.exports = {
    validateSecretSantaId,
    validateSecretSantaBody,
    validateSecretSantaUserBody
}
