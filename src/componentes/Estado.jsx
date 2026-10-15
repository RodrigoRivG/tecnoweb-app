/** Mensaje de error con botón para reintentar. */
export function ErrorCarga({ error, onReintentar }) {
  return (
    <div className="aviso aviso--error" role="alert">
      <p>{error.message}</p>
      <button type="button" className="boton boton--secundario boton--chico" onClick={onReintentar}>Reintentar</button>
    </div>
  )
}

/** Tarjetas grises mientras llegan los datos. */
export function Esqueleto({ cantidad = 3 }) {
  return (
    <div className="rejilla" aria-hidden="true">
      {Array.from({ length: cantidad }, (_, i) => <div key={i} className="tarjeta tarjeta--esqueleto" />)}
    </div>
  )
}

export function Vacio({ titulo, children }) {
  return (
    <div className="vacio">
      <p className="vacio__titulo">{titulo}</p>
      {children && <p>{children}</p>}
    </div>
  )
}
