import { useState } from "react";

export default function ResultadoSorteio({ resultado, mail }) {
  const [revelados, setRevelados] = useState({});

  if (!resultado) return null;

  const pares = resultado.pairs || [];
  const falhas = (mail && mail.errors) || [];
  const todosRevelados = pares.length > 0 && pares.every((_, indice) => revelados[indice]);

  const alternar = (indice) => setRevelados({ ...revelados, [indice]: !revelados[indice] });
  const revelarTudo = (valor) =>
    setRevelados(Object.fromEntries(pares.map((_, indice) => [indice, valor])));

  return (
    <section className="resultado">
      <h2>Sorteio de {resultado.secretSantaName}</h2>

      <div className="resultado-topo">
        <p className="texto-suave">
          Os pares vêm ocultos: clique em cada um para revelar.
        </p>
        <button type="button" className="secundario pequeno" onClick={() => revelarTudo(!todosRevelados)}>
          {todosRevelados ? "Ocultar tudo" : "Revelar tudo"}
        </button>
      </div>

      <ul className="pares">
        {pares.map((par, indice) => {
          const revelado = Boolean(revelados[indice]);
          return (
            <li key={par.name}>
              <button
                type="button"
                className={"par" + (revelado ? " par--revelado" : "")}
                aria-pressed={revelado}
                onClick={() => alternar(indice)}
              >
                <span className="quem">{par.name}</span>
                <span className="seta">→</span>
                <span className={"tirou" + (revelado ? "" : " tirou--oculto")}>
                  {revelado ? (par.amigoOculto && par.amigoOculto.name) || "-" : "•••••"}
                </span>
                <span className="par-acao">{revelado ? "ocultar" : "mostrar"}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {mail && (
        <p className={"relatorio-mail" + (mail.skipped || mail.failed ? " relatorio-mail--atencao" : "")}>
          {mail.skipped
            ? "Nenhum e-mail foi enviado: este sorteio foi só para ver os pares."
            : "Envio: " + mail.sent + " e-mail(s) enviado(s), " + mail.failed + " falha(s)"}
        </p>
      )}

      {falhas.length > 0 && (
        <ul className="falhas">
          {falhas.map((falha) => (
            <li key={falha.user}>
              {falha.user}: {falha.error}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
