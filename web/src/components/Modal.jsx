export default function Modal({ titulo, texto, confirmar, onConfirmar, onCancelar, perigo }) {
  return (
    <div className="fundo-modal" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="modal">
        <h2>{titulo}</h2>
        <p>{texto}</p>
        <div className="modal-acoes">
          <button type="button" className="secundario" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="button" className={perigo ? "perigo" : ""} onClick={onConfirmar}>
            {confirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
