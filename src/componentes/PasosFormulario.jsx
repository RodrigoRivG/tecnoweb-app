/**
 * Pasos clicables: el padre decide validación al saltar hacia adelante (ver cambiarPaso).
 */
export default function PasosFormulario({ pasos, pasoActual, onIrAPaso, deshabilitado = false }) {
  return (
    <>
      <nav aria-label="Pasos del formulario">
        <ol className="registro-pasos">
          {pasos.map((item, indice) => {
            const estado =
              indice < pasoActual
                ? 'registro-pasos__item--hecho'
                : indice === pasoActual
                  ? 'registro-pasos__item--activo'
                  : ''
            return (
              <li key={item.titulo ?? indice}>
                <button
                  type="button"
                  className={`registro-pasos__item registro-pasos__boton ${estado}`}
                  aria-current={indice === pasoActual ? 'step' : undefined}
                  aria-label={`${item.titulo}${indice < pasoActual ? ', completado' : ''}${indice === pasoActual ? ', paso actual' : ''}`}
                  disabled={deshabilitado}
                  onClick={() => onIrAPaso(indice)}
                >
                  <span className="registro-pasos__numero" aria-hidden>
                    {indice < pasoActual ? '✓' : indice + 1}
                  </span>
                  <span className="registro-pasos__titulo">{item.titulo}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>
      <p className="registro-pasos__leyenda">
        Paso {pasoActual + 1} de {pasos.length}: <strong>{pasos[pasoActual].titulo}</strong>
        {pasos[pasoActual].descripcion ? ` — ${pasos[pasoActual].descripcion}` : ''}
      </p>
    </>
  )
}