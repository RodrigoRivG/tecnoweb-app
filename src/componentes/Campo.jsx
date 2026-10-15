import { useId } from 'react'

/**
 * Etiqueta + control + ayuda o error. El control recibe id y aria-* por render prop.
 */
export default function Campo({ etiqueta, error, ayuda, opcional = false, className = '', children }) {
  const id = useId()
  const idDescripcion = `${id}-descripcion`
  const descripcion = error || ayuda

  return (
    <div className={`campo ${error ? 'campo--error' : ''} ${className}`}>
      <label htmlFor={id} className="campo__etiqueta">
        {etiqueta}
        {opcional && <span className="campo__opcional"> (opcional)</span>}
      </label>

      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': descripcion ? idDescripcion : undefined,
      })}

      {descripcion && (
        <p id={idDescripcion} className={error ? 'campo__error' : 'campo__ayuda'}>{descripcion}</p>
      )}
    </div>
  )
}
