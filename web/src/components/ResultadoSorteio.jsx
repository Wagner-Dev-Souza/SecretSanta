export default function ResultadoSorteio({ resultado, mail }) {
  if (!resultado) return null;

  const pares = resultado.pairs || [];
  const falhas = (mail && mail.errors) || [];

  return (
    <section className="resultado">
      <h2>Sorteio de {resultado.secretSantaName}</h2>

      <ul className="pares">
        {pares.map((par) => (
          <li key={par.name} className="par">
            <span className="quem">{par.name}</span>
            <span className="seta">→</span>
            <strong className="tirou">{par.amigoOculto && par.amigoOculto.name}</strong>
          </li>
        ))}
      </ul>

      {mail && (
        <p className={"relatorio-mail" + (mail.failed ? " relatorio-mail--falha" : "")}>
          Envio: {mail.sent} e-mail(s) enviado(s), {mail.failed} falha(s)
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
