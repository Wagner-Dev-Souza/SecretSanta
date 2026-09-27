import { useState } from "react";
import Modal from "./Modal.jsx";
import ResultadoSorteio from "./ResultadoSorteio.jsx";

export default function DetalheGrupo({
  grupo,
  resultado,
  mail,
  onVoltar,
  onRenomear,
  onAdicionar,
  onEditar,
  onRemover,
  onSortear,
}) {
  const [nomeGrupo, setNomeGrupo] = useState(grupo.name);
  const [novo, setNovo] = useState({ name: "", email: "" });
  const [emEdicao, setEmEdicao] = useState(null);
  const [confirmandoSorteio, setConfirmandoSorteio] = useState(false);

  const participantes = grupo.users || [];
  const podeSortear = participantes.length >= 2;

  const renomear = async (evento) => {
    evento.preventDefault();
    const limpo = nomeGrupo.trim();
    if (limpo && limpo !== grupo.name) await onRenomear(limpo);
  };

  const adicionar = async (evento) => {
    evento.preventDefault();
    const nome = novo.name.trim();
    const email = novo.email.trim();
    if (!nome || !email) return;
    if (await onAdicionar({ name: nome, email })) setNovo({ name: "", email: "" });
  };

  const salvarEdicao = async (evento) => {
    evento.preventDefault();
    if (await onEditar(emEdicao._id, { name: emEdicao.name.trim(), email: emEdicao.email.trim() })) {
      setEmEdicao(null);
    }
  };

  const sortear = async () => {
    setConfirmandoSorteio(false);
    await onSortear();
  };

  return (
    <section>
      <button type="button" className="secundario pequeno" onClick={onVoltar}>
        ← Voltar
      </button>

      <form className="renomear" onSubmit={renomear}>
        <input value={nomeGrupo} onChange={(e) => setNomeGrupo(e.target.value)} aria-label="Nome do grupo" />
        <button type="submit">Renomear</button>
      </form>

      <h2>Participantes ({participantes.length})</h2>

      <form className="adicionar" onSubmit={adicionar}>
        <input
          value={novo.name}
          onChange={(e) => setNovo({ ...novo, name: e.target.value })}
          placeholder="Nome"
          aria-label="Nome do participante"
        />
        <input
          value={novo.email}
          onChange={(e) => setNovo({ ...novo, email: e.target.value })}
          placeholder="E-mail"
          aria-label="E-mail do participante"
        />
        <button type="submit">Adicionar</button>
      </form>

      {participantes.length === 0 && <p className="vazio">Nenhum participante ainda.</p>}

      <ul className="participantes">
        {participantes.map((pessoa) =>
          emEdicao && emEdicao._id === pessoa._id ? (
            <li key={pessoa._id} className="participante">
              <form className="editar" onSubmit={salvarEdicao}>
                <input
                  value={emEdicao.name}
                  onChange={(e) => setEmEdicao({ ...emEdicao, name: e.target.value })}
                  aria-label="Editar nome"
                />
                <input
                  value={emEdicao.email}
                  onChange={(e) => setEmEdicao({ ...emEdicao, email: e.target.value })}
                  aria-label="Editar e-mail"
                />
                <button type="submit">Salvar</button>
                <button type="button" className="secundario pequeno" onClick={() => setEmEdicao(null)}>
                  Cancelar
                </button>
              </form>
            </li>
          ) : (
            <li key={pessoa._id} className="participante">
              <div className="grupo-info">
                <strong>{pessoa.name}</strong>
                <span className="id">{pessoa.email}</span>
              </div>
              <button type="button" className="secundario pequeno" onClick={() => setEmEdicao({ ...pessoa })}>
                Editar
              </button>
              <button type="button" className="secundario pequeno perigo-texto" onClick={() => onRemover(pessoa._id)}>
                Remover
              </button>
            </li>
          )
        )}
      </ul>

      <div className="area-sorteio">
        <button type="button" onClick={() => setConfirmandoSorteio(true)} disabled={!podeSortear}>
          Sortear
        </button>
        {!podeSortear && <p className="vazio">São necessários ao menos 2 participantes.</p>}
        {podeSortear && (
          <p className="vazio">
            O sorteio envia 1 e-mail por participante ({participantes.length} no total).
          </p>
        )}
      </div>

      {confirmandoSorteio && (
        <Modal
          titulo="Confirmar sorteio"
          texto={
            "Serão sorteados " +
            participantes.length +
            " pares e enviados " +
            participantes.length +
            " e-mails reais para os endereços cadastrados. Não tem como desfazer."
          }
          confirmar="Sortear e enviar e-mails"
          onConfirmar={sortear}
          onCancelar={() => setConfirmandoSorteio(false)}
        />
      )}

      <ResultadoSorteio resultado={resultado} mail={mail} />
    </section>
  );
}
