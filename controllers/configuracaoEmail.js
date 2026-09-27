const servico = require("../services/configuracaoEmail");

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const obter = (req, res) => {
  res.json({ data: servico.status() });
};

const salvar = (req, res) => {
  const { email, senha } = req.body || {};

  if (!email || !FORMATO_EMAIL.test(String(email).trim())) {
    return res.status(400).json({ message: "Informe um e-mail válido" });
  }

  const senhaLimpa = String(senha || "").replace(/\s+/g, "");
  if (senhaLimpa.length < 8) {
    return res.status(400).json({
      message: "Informe a senha de app do Gmail (16 caracteres, sem espaços)",
    });
  }

  res.json({ data: servico.salvar({ email: String(email).trim(), senha: senhaLimpa }) });
};

const limpar = (req, res) => {
  res.json({ data: servico.limpar() });
};

module.exports = {
  obter,
  salvar,
  limpar,
};
