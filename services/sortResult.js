const repository = require('../repositories/secretSantaUsers');
const nodemailer = require("nodemailer");
const EMAIL = process.env.MAILER_EMAIL;
const PASS = process.env.MAILER_PASS;

const transporter = nodemailer.createTransport({
    service: "gmail",
    secure: false,
    auth: {
        user: EMAIL,
        pass: PASS
    }
});

const sendMail = async (secretSanta, user, amigoSecreto) => {
    try {
        await transporter.sendMail({
            from: process.env.MAILER_EMAIL,
            to: user.email,
            subject: `Sorteio ${secretSanta.name}`,
            text: `Olá ${user.name}, você sorteou ${amigoSecreto} como seu amigo secreto!`
        })
    } catch (error) {
        console.log(`Erro ao enviar o e-mail para o usuário ${user.name}:`, error);
    }
};

const sorteio = async (secretSanta) => {
    const paresAleatorios = [];
    const sortUsers = secretSanta.users.sort(() => Math.random() - 0.5);
    
    sortUsers.forEach((pessoa, i) => {
        const amigoOcultoIndice = (i + 1) % secretSanta.users.length;
        const amigoOculto = sortUsers[amigoOcultoIndice];
        
        sendMail(secretSanta, pessoa, amigoOculto.name)

        paresAleatorios.push({
            name: pessoa.name,
            email: pessoa.email,
            amigoOculto: {
                name: amigoOculto.name,
                email: amigoOculto.email,
            }
        });
    });

    const result = {
        secretSantaName: secretSanta.name,
        pairs: paresAleatorios,
    };

   return await repository.createSortResult(result)
};

module.exports = {
    sorteio,
    sendMail
};
