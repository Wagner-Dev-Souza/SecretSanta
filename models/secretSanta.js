const mongoose = require('mongoose');
const{ Schema } = mongoose;

const secretSantaUsersSchema = new Schema({
    "_id": String,
    "name": String,
    "email": String
}, {
    timestamps: true,
    versionKey: false
});

const secretSantaSchema = new Schema({
    "_id": String,
    "name": String,
    "users": [secretSantaUsersSchema]
}, {
    timestamps: true,
    versionKey: false
});

const amigoOcultoSchema = new Schema({
    "name": String,
    "email": String,
},{"_id": false});

const paresAleatoriosSchema = new Schema({
    "name": String,
    "email": String,
    "occultFriend": amigoOcultoSchema,
},{"_id": false});

const ResultSchema = new Schema({
    "_id": String,
    "secretSantaName": String,
    "pairs": [paresAleatoriosSchema]
}, {
    timestamps: true,
    versionKey: false
});

const secretSanta = mongoose.model('secretSanta', secretSantaSchema);
const sortResult = mongoose.model("sortResult", ResultSchema);

module.exports = {
    secretSanta,
    sortResult
}
