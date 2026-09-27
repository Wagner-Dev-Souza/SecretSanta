import { useCallback, useEffect, useState } from "react";
import * as api from "./api.js";
import { baseDaApi } from "./api.js";
import ListaGrupos from "./components/ListaGrupos.jsx";
import DetalheGrupo from "./components/DetalheGrupo.jsx";

export default function App() {
  const [grupos, setGrupos] = useState([]);
  const [busca, setBusca] = useState("");
  const [grupo, setGrupo] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [mail, setMail] = useState(null);
  const [estado, setEstado] = useState("carregando");
  const [erro, setErro] = useState("");

  const executar = useCallback(async (acao) => {
    setErro("");
    try {
      return await acao();
    } catch (e) {
      setErro(e.message);
      return null;
    }
  }, []);

  const carregarLista = useCallback(
    async (nome = "") => {
      setEstado("carregando");
      setErro("");
      try {
        setGrupos(await api.listarGrupos(nome));
        setEstado("ok");
      } catch (e) {
        setErro(e.message);
        setEstado("erro");
      }
    },
    []
  );

  useEffect(() => {
    carregarLista();
  }, [carregarLista]);

  const recarregarGrupo = async (id) => {
    const atualizado = await executar(() => api.buscarGrupo(id));
    if (atualizado) setGrupo(atualizado);
  };

  const abrirGrupo = async (id) => {
    const encontrado = await executar(() => api.buscarGrupo(id));
    if (encontrado) {
      setGrupo(encontrado);
      setResultado(null);
      setMail(null);
    }
  };

  const voltar = () => {
    setGrupo(null);
    setResultado(null);
    setMail(null);
    carregarLista(busca.trim());
  };

  const criarGrupo = async (nome) => {
    const criado = await executar(() => api.criarGrupo(nome));
    if (!criado) return false;
    await carregarLista(busca.trim());
    setGrupo(criado);
    return true;
  };

  const renomearGrupo = async (nome) => {
    const atualizado = await executar(() => api.renomearGrupo(grupo._id, nome));
    if (atualizado) setGrupo(atualizado);
    return Boolean(atualizado);
  };

  const excluirGrupo = async (alvo) => {
    const ok = await executar(async () => {
      await api.excluirGrupo(alvo._id);
      return true;
    });
    if (ok) {
      if (grupo && grupo._id === alvo._id) setGrupo(null);
      carregarLista(busca.trim());
    }
  };

  const adicionarParticipante = async (dados) => {
    const criado = await executar(() => api.adicionarParticipante(grupo._id, dados));
    if (!criado) return false;
    await recarregarGrupo(grupo._id);
    return true;
  };

  const editarParticipante = async (userId, dados) => {
    const salvo = await executar(() => api.editarParticipante(grupo._id, userId, dados));
    if (!salvo) return false;
    await recarregarGrupo(grupo._id);
    return true;
  };

  const removerParticipante = async (userId) => {
    const ok = await executar(async () => {
      await api.removerParticipante(grupo._id, userId);
      return true;
    });
    if (ok) await recarregarGrupo(grupo._id);
  };

  const sortear = async () => {
    const resposta = await executar(() => api.sortear(grupo._id));
    if (resposta && resposta.data) {
      setResultado(resposta.data);
      setMail(resposta.mail || null);
    }
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

      {erro && <p className="erro">{erro}</p>}

      {grupo ? (
        <DetalheGrupo
          grupo={grupo}
          resultado={resultado}
          mail={mail}
          onVoltar={voltar}
          onRenomear={renomearGrupo}
          onAdicionar={adicionarParticipante}
          onEditar={editarParticipante}
          onRemover={removerParticipante}
          onSortear={sortear}
        />
      ) : (
        <ListaGrupos
          grupos={grupos}
          busca={busca}
          estado={estado}
          onBusca={(valor) => {
            setBusca(valor);
            carregarLista(valor);
          }}
          onCriar={criarGrupo}
          onAbrir={abrirGrupo}
          onExcluir={excluirGrupo}
        />
      )}
    </div>
  );
}
