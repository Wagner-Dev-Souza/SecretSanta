import { useState } from "react";

const PASSOS_AJUDA = [
  "Crie uma conta Gmail só para o projeto. Não use sua conta pessoal.",
  "Ative a verificação em duas etapas em myaccount.google.com/security — o Google só libera senha de app para contas com 2FA ativa.",
  "Acesse myaccount.google.com/apppasswords.",
  "Dê um nome à senha (ex.: amigo-secreto) e clique em Criar.",
  "O Google mostra 16 caracteres. Copie na hora — ele não mostra de novo.",
  "Cole aqui em Senha de app, sem espaços, e salve.",
];

export default function ConfiguracaoEmail({ configuracao, primeiraVez, onSalvar, onLimpar, onFechar }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [ajuda, setAjuda] = useState(primeiraVez === true);
  const [salvando, setSalvando] = useState(false);

  const jaConfigurado = Boolean(configuracao && configuracao.configurado);

  const enviar = async (evento) => {
    evento.preventDefault();
    setSalvando(true);
    // o Gmail mostra a senha em grupos de 4 ("abcd efgh ijkl mnop"): colar com espaço
    // e o caso comum, entao os espacos saem aqui
    const ok = await onSalvar({ email: email.trim(), senha: senha.replace(/\s+/g, "") });
    setSalvando(false);
    if (ok) {
      setEmail("");
      setSenha("");
    }
  };

  return (
    <div className="fundo-modal" role="dialog" aria-modal="true" aria-label="Envio de e-mail">
      <div className="modal modal--config">
        <h2>{primeiraVez ? "Configurar o envio de e-mail" : "Envio de e-mail"}</h2>

        <p className="texto-suave">
          {primeiraVez
            ? "O sorteio avisa cada participante por e-mail. Para isso funcionar nesta máquina, informe a conta que envia."
            : "Conta usada para enviar o resultado do sorteio."}
        </p>

        {jaConfigurado && (
          <p className="config-atual">
            Configurado: <strong>{configuracao.emailMascarado}</strong>
            {configuracao.origem === "env" ? " (definido no arquivo de ambiente)" : ""}
          </p>
        )}

        <form onSubmit={enviar}>
          <label className="campo">
            <span>E-mail que envia</span>
            <input
              type="email"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              placeholder="projeto@gmail.com"
              aria-label="E-mail que envia"
            />
          </label>

          <label className="campo">
            <span>Senha de app (16 caracteres, sem espaços)</span>
            <input
              type="password"
              value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
              placeholder="ex.: abcd efgh ijkl mnop"
              aria-label="Senha de app"
            />
          </label>

          <div className="modal-acoes">
            <button type="button" className="secundario" onClick={onFechar}>
              Fechar
            </button>
            <button type="button" className="secundario" onClick={() => setAjuda(!ajuda)}>
              {ajuda ? "Ocultar ajuda" : "Ajuda"}
            </button>
            <button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>

        {ajuda && (
          <div className="ajuda">
            <h3>Como criar a senha de app do Gmail</h3>
            <ol>
              {PASSOS_AJUDA.map((passo) => (
                <li key={passo}>{passo}</li>
              ))}
            </ol>
            <p className="texto-suave">
              A senha fica guardada só nesta máquina, cifrada, fora do repositório. Ninguém recebe ela
              de volta pela API — se precisar trocar, é só salvar de novo aqui.
            </p>
          </div>
        )}

        {jaConfigurado && (
          <button type="button" className="secundario pequeno perigo-texto" onClick={onLimpar}>
            Remover configuração desta máquina
          </button>
        )}
      </div>
    </div>
  );
}
