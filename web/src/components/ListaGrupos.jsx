import { useState } from "react";
import Modal from "./Modal.jsx";

export default function ListaGrupos({ grupos, busca, onBusca, onCriar, onAbrir, onExcluir, estado }) {
  const [nome, setNome] = useState("");
  const [termo, setTermo] = useState("");
  const [paraExcluir, setParaExcluir] = useState(null);

  const criar = async (evento) => {
    evento.preventDefault();
    const limpo = nome.trim();
    if (!limpo) return;
    if (await onCriar(limpo)) setNome("");
  };

  const confirmarExclusao = async () => {
    const alvo = paraExcluir;
    setParaExcluir(null);
    await onExcluir(alvo);
  };

  return (
    <section>
      <form className="busca" onSubmit={(e) => { e.preventDefault(); onBusca(termo.trim()); }}>
        <input
          value={termo}
          onChange={(evento) => setTermo(evento.target.value)}
          placeholder="Buscar grupo pelo nome exato"
          aria-label="Buscar grupo"
        />
        <button type="submit">Buscar</button>
      </form>

      <form className="novo-grupo" onSubmit={criar}>
        <input
          value={nome}
          onChange={(evento) => setNome(evento.target.value)}
          placeholder="Nome do novo grupo"
          aria-label="Nome do novo grupo"
        />
        <button type="submit">Criar grupo</button>
      </form>

      {estado === "ok" && grupos.length === 0 && <p className="vazio">Nenhum grupo encontrado.</p>}

      <ul className="grupos">
        {grupos.map((grupo) => (
          <li key={grupo._id} className="grupo">
            <button type="button" className="grupo-nome" onClick={() => onAbrir(grupo._id)}>
              <strong>{grupo.name}</strong>
              <span className="id">{grupo._id}</span>
            </button>
            <span className="contagem">{(grupo.users && grupo.users.length) || 0} participante(s)</span>
            <button type="button" className="secundario pequeno" onClick={() => setParaExcluir(grupo)}>
              Excluir
            </button>
          </li>
        ))}
      </ul>

      {paraExcluir && (
        <Modal
          titulo="Excluir grupo"
          texto={"Apagar \"" + paraExcluir.name + "\" e todos os participantes dele? Essa ação não pode ser desfeita."}
          confirmar="Excluir grupo"
          perigo
          onConfirmar={confirmarExclusao}
          onCancelar={() => setParaExcluir(null)}
        />
      )}
    </section>
  );
}
