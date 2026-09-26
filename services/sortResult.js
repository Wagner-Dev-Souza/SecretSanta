const repository = require('../repositories/secretSantaUsers');
const nodemailer = require("nodemailer");
const EMAIL = process.env.MAILER_EMAIL;
const PASS = process.env.MAILER_PASS;

// MAILER_TRANSPORT escolhe o transporte de e-mail:
//   ausente ou "gmail" -> envio real pelo Gmail (comportamento padrao)
//   "json"             -> nao envia nada; devolve a mensagem serializada (testes e CI)
const TRANSPORT = (process.env.MAILER_TRANSPORT || "gmail").toLowerCase();

// Configuração obrigatória: sem estas duas variáveis o Gmail recusa a autenticação
// e nenhum e-mail do sorteio sai. Avisa alto na subida, em vez de falhar calado.
if (TRANSPORT === "gmail" && (!EMAIL || !PASS)) {
    console.warn(
        "[aviso] MAILER_EMAIL e/ou MAILER_PASS não estão definidos no .env — " +
        "o envio de e-mail do sorteio NÃO vai funcionar. " +
        "Veja a seção 'Mensageria' do README para gerar a senha de app do Gmail."
    );
}

const transporter = TRANSPORT === "json"
    ? nodemailer.createTransport({ jsonTransport: true })
    : nodemailer.createTransport({
        service: "gmail",
        secure: false,
        auth: {
            user: EMAIL,
            pass: PASS
        }
    });

const mailerConfigurado = TRANSPORT === "json" || Boolean(EMAIL && PASS);

// Sem try/catch: a falha sobe para quem chamou. Antes o erro era engolido com um
// console.log e o sorteio respondia sucesso mesmo sem nenhum e-mail ter saido.
const sendMail = async (secretSanta, user, amigoSecreto) => {
    return await transporter.sendMail({
        from: EMAIL || "no-reply@secretsanta.local",
        to: user.email,
        subject: `Sorteio ${secretSanta.name}`,
        text: `Olá ${user.name}, você sorteou ${amigoSecreto} como seu amigo secreto!`
    });
};

// Fisher-Yates: a versao anterior (sort(() => Math.random() - 0.5)) e enviesada
// e embaralhava o proprio array do documento carregado do banco.
const embaralhar = (lista) => {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
};

const sorteio = async (secretSanta) => {
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

    const result = {
        secretSantaName: secretSanta.name,
        pairs: paresAleatorios,
    };

    const salvo = await repository.createSortResult(result);

    // Envio aguardado (await) e falha reportada na resposta.
    const envios = await Promise.allSettled(
        paresAleatorios.map((par) => sendMail(secretSanta, par, par.amigoOculto.name))
    );

    const errors = envios
        .map((envio, i) => (envio.status === "rejected"
            ? { user: paresAleatorios[i].name, error: envio.reason && envio.reason.message }
            : null))
        .filter(Boolean);

    if (errors.length) {
        console.warn(`[aviso] ${errors.length} e-mail(s) não foram enviados no sorteio "${secretSanta.name}"`);
    }

    return {
        result: salvo,
        mail: {
            transport: TRANSPORT,
            configured: mailerConfigurado,
            sent: envios.filter((envio) => envio.status === "fulfilled").length,
            failed: errors.length,
            errors,
        }
    };
};

module.exports = {
    sorteio,
    sendMail
};
