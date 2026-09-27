import { useCallback, useEffect, useState } from "react";
import * as api from "./api.js";
import { baseDaApi } from "./api.js";
import ListaGrupos from "./components/ListaGrupos.jsx";
import DetalheGrupo from "./components/DetalheGrupo.jsx";
import ConfiguracaoEmail from "./components/ConfiguracaoEmail.jsx";

// se a pessoa fecha o aviso de primeira execucao, nao insistimos a cada abertura
const CHAVE_DISPENSA = "secretsanta.configuracao.dispensada";

export default function App() {
  const [grupos, setGrupos] = useState([]);
  const [busca, setBusca] = useState("");
  const [grupo, setGrupo] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [mail, setMail] = useState(null);
  const [estado, setEstado] = useState("carregando");
  const [erro, setErro] = useState("");
  const [configuracao, setConfiguracao] = useState(null);
  const [mostrarConfiguracao, setMostrarConfiguracao] = useState(false);
  const [primeiraVezConfig, setPrimeiraVezConfig] = useState(false);

  const executar = useCallback(async (acao) => {
    setErro("");
    try {
      return await acao();
    } catch (e) {
      setErro(e.message);
      return null;
    }
  }, []);

  const carregarLista = useCallback(async (nome = "") => {
    setEstado("carregando");
    setErro("");
    try {
      setGrupos(await api.listarGrupos(nome));
      setEstado("ok");
    } catch (e) {
      setErro(e.message);
      setEstado("erro");
    }
  }, []);

  const carregarConfiguracao = useCallback(async () => {
    const config = await executar(() => api.obterConfiguracaoEmail());
    if (config) setConfiguracao(config);
    return config;
  }, [executar]);

  useEffect(() => {
    carregarLista();
  }, [carregarLista]);

  // primeira execucao numa maquina sem e-mail configurado: abre o aviso
  useEffect(() => {
    let dispensada = null;
    try {
      dispensada = localStorage.getItem(CHAVE_DISPENSA);
    } catch {
      dispensada = null;
    }

    (async () => {
      const config = await carregarConfiguracao();
      if (config && !config.configurado && !dispensada) {
        setPrimeiraVezConfig(true);
        setMostrarConfiguracao(true);
      }
    })();
  }, [carregarConfiguracao]);

  const abrirConfiguracao = () => {
    setPrimeiraVezConfig(false);
    setMostrarConfiguracao(true);
  };

  const fecharConfiguracao = () => {
    setMostrarConfiguracao(false);
    if (primeiraVezConfig) {
      try {
        localStorage.setItem(CHAVE_DISPENSA, "1");
      } catch {
        // sem localStorage o aviso volta na proxima abertura: incomodo, nao erro
      }
      setPrimeiraVezConfig(false);
    }
  };

  const salvarConfiguracao = async (dados) => {
    const salvo = await executar(() => api.salvarConfiguracaoEmail(dados));
    if (!salvo) return false;
    setConfiguracao(salvo);
    try {
      localStorage.removeItem(CHAVE_DISPENSA);
    } catch {
      // irrelevante
    }
    setPrimeiraVezConfig(false);
    return true;
  };

  const limparConfiguracao = async () => {
    const limpo = await executar(() => api.limparConfiguracaoEmail());
    if (limpo) setConfiguracao(limpo);
  };

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

  const sortear = async (enviarEmail) => {
    const resposta = await executar(() => api.sortear(grupo._id, { enviarEmail }));
    if (resposta && resposta.data) {
      setResultado(resposta.data);
      setMail(resposta.mail || null);
    }
  };

  const emailConfigurado = Boolean(configuracao && configuracao.configurado);

  return (
    <div className="app">
      <header className="topo">
        <div>
          <h1>SecretSanta</h1>
          <p className="subtitulo">
            API: <code>{baseDaApi}</code>
          </p>
        </div>
        <div className="topo-acoes">
          <button type="button" className={"secundario pequeno" + (emailConfigurado ? "" : " atencao")} onClick={abrirConfiguracao}>
            {emailConfigurado ? "E-mail: " + configuracao.emailMascarado : "Configurar e-mail"}
          </button>
          <span className={"selo selo--" + estado}>
            {estado === "ok" ? "conectado" : estado === "erro" ? "sem conexão" : "carregando"}
          </span>
        </div>
      </header>

      {erro && <p className="erro">{erro}</p>}

      {grupo ? (
        <DetalheGrupo
          grupo={grupo}
          resultado={resultado}
          mail={mail}
          configuracao={configuracao}
          onVoltar={voltar}
          onRenomear={renomearGrupo}
          onAdicionar={adicionarParticipante}
          onEditar={editarParticipante}
          onRemover={removerParticipante}
          onSortear={sortear}
          onAbrirConfiguracao={abrirConfiguracao}
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

      {mostrarConfiguracao && (
        <ConfiguracaoEmail
          configuracao={configuracao}
          primeiraVez={primeiraVezConfig}
          onSalvar={salvarConfiguracao}
          onLimpar={limparConfiguracao}
          onFechar={fecharConfiguracao}
        />
      )}
    </div>
  );
}
