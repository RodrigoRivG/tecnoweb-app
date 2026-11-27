import { useEffect } from 'react'

export default function ConfirmacionDialog({
  abierto,
  titulo,
  children,
  etiquetaConfirmar = 'Aceptar',
  etiquetaCancelar = 'Cancelar',
  onConfirmar,
  onCancelar,
  confirmarPeligroso = false,
  confirmando = false,
  estiloCapa = undefined,
}) {
  useEffect(() => {
    if (!abierto) return
    function onTecla(evento) {
      if (evento.key === 'Escape' && !confirmando) onCancelar?.()
    }
    document.addEventListener('keydown', onTecla)
    return () => document.removeEventListener('keydown', onTecla)
  }, [abierto, confirmando, onCancelar])

  if (!abierto) return null

  return (
    <div
      className="banco__dialogo"
      style={estiloCapa}
      role="presentation"
      onClick={confirmando ? undefined : onCancelar}
    >
      <div
        className="banco__dialogo-caja confirmacion-dialogo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmacion-dialogo-titulo"
        onClick={(evento) => evento.stopPropagation()}
      >
        <h2 id="confirmacion-dialogo-titulo">{titulo}</h2>
        <div className="confirmacion-dialogo__cuerpo">{children}</div>
        <div className="banco__dialogo-acciones confirmacion-dialogo__acciones">
          <button type="button" className="boton boton--secundario" onClick={onCancelar} disabled={confirmando}>
            {etiquetaCancelar}
          </button>
          <button
            type="button"
            className={confirmarPeligroso ? 'boton boton--peligro' : 'boton boton--primario'}
            onClick={onConfirmar}
            disabled={confirmando}
          >
            {confirmando ? 'Un momento…' : etiquetaConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}