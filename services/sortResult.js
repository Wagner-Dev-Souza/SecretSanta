const repository = require('../repositories/secretSantaUsers');
const nodemailer = require("nodemailer");
const configuracaoEmail = require('./configuracaoEmail');

// O transporte e montado na hora do envio, com a configuracao vigente: assim o
// e-mail definido pelo app (tela de configuracao) vale sem reiniciar nada.
const criarTransporte = (config) => {
    if (config.transporte === "json") {
        return nodemailer.createTransport({ jsonTransport: true });
    }

    return nodemailer.createTransport({
        service: "gmail",
        secure: false,
        auth: {
            user: config.email,
            pass: config.senha
        }
    });
};

// Sem try/catch: a falha sobe para quem chamou e entra no relatorio da resposta.
const sendMail = async (config, secretSanta, user, amigoSecreto) => {
    const transporter = criarTransporte(config);

    return await transporter.sendMail({
        from: config.email || "no-reply@secretsanta.local",
        to: user.email,
        subject: `Sorteio ${secretSanta.name}`,
        text: `Olá ${user.name}, você sorteou ${amigoSecreto} como seu amigo secreto!`
    });
};

// Fisher-Yates: sort com Math.random e enviesado e mutava o array do documento.
const embaralhar = (lista) => {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
};

const resumoDeEnvio = (config, envios, pares) => {
    const errors = envios
        .map((envio, i) => (envio.status === "rejected"
            ? { user: pares[i].name, error: envio.reason && envio.reason.message }
            : null))
        .filter(Boolean);

    return {
        transport: config.transporte,
        configured: config.configurado,
        sent: envios.filter((envio) => envio.status === "fulfilled").length,
        failed: errors.length,
        errors,
        skipped: false,
    };
};

const sorteio = async (secretSanta, { enviarEmail = true } = {}) => {
    const sortUsers = embaralhar(secretSanta.users.map((user) => ({
        name: user.name,
        email: user.email
    })));

    const paresAleatorios = sortUsers.map((pessoa, i) => {
        // rotacao: cada um tira o proximo da lista embaralhada, ninguem tira a si mesmo
        const amigoOculto = sortUsers[(i + 1) % sortUsers.length];

        return {
            name: pessoa.name,
            email: pessoa.email,
            amigoOculto: {
                name: amigoOculto.name,
                email: amigoOculto.email,
            }
        };
    });

    const salvo = await repository.createSortResult({
        secretSantaName: secretSanta.name,
        pairs: paresAleatorios,
    });

    const config = configuracaoEmail.ler();

    // Sorteio sem envio: o organizador ve os pares na tela e repassa como quiser
    if (!enviarEmail) {
        return {
            result: salvo,
            mail: {
                transport: config.transporte,
                configured: config.configurado,
                sent: 0,
                failed: 0,
                errors: [],
                skipped: true,
                motivo: "sorteio sem envio de e-mail",
            }
        };
    }

    // Sem e-mail configurado o sorteio continua valido, mas nada e enviado — e isso
    // precisa aparecer na resposta, nao virar silencio.
    if (!config.configurado) {
        const errors = paresAleatorios.map((par) => ({
            user: par.name,
            error: "envio de e-mail nao configurado",
        }));
        console.warn(`[aviso] sorteio "${secretSanta.name}" sem e-mail configurado: nenhum aviso foi enviado`);

        return {
            result: salvo,
            mail: {
                transport: config.transporte,
                configured: false,
                sent: 0,
                failed: errors.length,
                errors,
                skipped: false,
            }
        };
    }

    const envios = await Promise.allSettled(
        paresAleatorios.map((par) => sendMail(config, secretSanta, par, par.amigoOculto.name))
    );

    const mail = resumoDeEnvio(config, envios, paresAleatorios);
    if (mail.failed) {
        console.warn(`[aviso] ${mail.failed} e-mail(s) não foram enviados no sorteio "${secretSanta.name}"`);
    }

    return { result: salvo, mail };
};

module.exports = {
    sorteio,
    sendMail
};
