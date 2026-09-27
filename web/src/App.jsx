import { useCallback, useEffect, useState } from "react";
import { baseDaApi, listarGrupos } from "./api.js";

export default function App() {
  const [grupos, setGrupos] = useState([]);
  const [busca, setBusca] = useState("");
  const [estado, setEstado] = useState("carregando");
  const [erro, setErro] = useState("");

  const carregar = useCallback(async (nome = "") => {
    setEstado("carregando");
    try {
      setGrupos(await listarGrupos(nome));
      setEstado("ok");
      setErro("");
    } catch (e) {
      setEstado("erro");
      setErro(e.message);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const enviarBusca = (evento) => {
    evento.preventDefault();
    carregar(busca.trim());
  };

  const limpar = () => {
    setBusca("");
    carregar();
  };

  return (
    <div className="app">
      <header className="topo">
        <div>
          <h1>SecretSanta</h1>
          <p className="subtitulo">
            API: <code>{baseDaApi}</code>
          </p>
        </div>
        <span className={"selo selo--" + estado}>
          {estado === "ok" ? "conectado" : estado === "erro" ? "sem conexão" : "carregando"}
        </span>
      </header>

      <form className="busca" onSubmit={enviarBusca}>
        <input
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder="Buscar grupo pelo nome exato"
          aria-label="Buscar grupo"
        />
        <button type="submit">Buscar</button>
        <button type="button" className="secundario" onClick={limpar}>
          Limpar
        </button>
      </form>

      {estado === "erro" && (
        <p className="erro">Não foi possível falar com a API: {erro}</p>
      )}

      {estado === "ok" && grupos.length === 0 && (
        <p className="vazio">Nenhum grupo encontrado.</p>
      )}

      <ul className="grupos">
        {grupos.map((grupo) => (
          <li key={grupo._id} className="grupo">
            <div className="grupo-info">
              <strong>{grupo.name}</strong>
              <span className="id">{grupo._id}</span>
            </div>
            <span className="contagem">
              {(grupo.users && grupo.users.length) || 0} participante(s)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
