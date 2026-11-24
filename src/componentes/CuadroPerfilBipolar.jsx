const ESTENES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

function posicion(valor) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return null
  const acotado = Math.max(1, Math.min(10, Number(valor)))
  return ((acotado - 1) / 9) * 100
}

function segmentos(filas, clave) {
  const trozos = []
  let actual = []

  filas.forEach((fila, indice) => {
    const x = posicion(fila[clave])
    if (x === null) {
      if (actual.length > 0) trozos.push(actual.join(' '))
      actual = []
      return
    }
    actual.push(`${x},${indice + 0.5}`)
  })

  if (actual.length > 0) trozos.push(actual.join(' '))
  return trozos
}

function marca(valor, tipo) {
  const left = posicion(valor)
  if (left === null) return null

  return (
    <span
      className={`perfil-bipolar__marca perfil-bipolar__marca--${tipo}`}
      style={{ left: `${left}%` }}
    />
  )
}

export default function CuadroPerfilBipolar({
  titulo,
  descripcion,
  filas,
  editable = false,
  onCambiarIdeal,
  mostrarBruto = false,
  porcentaje = null,
}) {
  const curvaIdeal = segmentos(filas, 'esten_ideal')
  const curvaReal = segmentos(filas, 'esten_real')

  return (
    <section className="perfil-bipolar">
      <header className="perfil-bipolar__cabecera">
        <div>
          <h3>{titulo}</h3>
          {descripcion && <p>{descripcion}</p>}
        </div>
        <div className="perfil-bipolar__leyenda">
          <span><i className="perfil-bipolar__muestra perfil-bipolar__muestra--ideal" /> Curva ideal</span>
          {!editable && <span><i className="perfil-bipolar__muestra perfil-bipolar__muestra--real" /> Curva real</span>}
          {porcentaje !== null && porcentaje !== undefined && (
            <strong>Aproximación {porcentaje}%</strong>
          )}
        </div>
      </header>

      <div className={`perfil-bipolar__tabla ${mostrarBruto ? 'perfil-bipolar__tabla--con-bruto' : ''}`}>
        <span className="perfil-bipolar__regla">Factor</span>
        {mostrarBruto && <span className="perfil-bipolar__regla">Bruto</span>}
        <span className="perfil-bipolar__regla perfil-bipolar__regla--derecha">Polo bajo</span>
        <span className="perfil-bipolar__regla perfil-bipolar__escala-numeros">
          {ESTENES.map((esten) => <span key={esten}>{esten}</span>)}
        </span>
        <span className="perfil-bipolar__regla">Polo alto</span>

        <svg
          className="perfil-bipolar__curvas"
          viewBox={`0 0 100 ${Math.max(filas.length, 1)}`}
          preserveAspectRatio="none"
          style={{ gridRow: `2 / span ${Math.max(filas.length, 1)}` }}
          aria-hidden="true"
        >
          {curvaIdeal.map((puntos) => (
            <polyline key={puntos} points={puntos} className="perfil-bipolar__curva perfil-bipolar__curva--ideal" />
          ))}
          {curvaReal.map((puntos) => (
            <polyline key={puntos} points={puntos} className="perfil-bipolar__curva perfil-bipolar__curva--real" />
          ))}
        </svg>

        {filas.map((fila) => (
          <div className="perfil-bipolar__fila" key={fila.dimension_id ?? fila.codigo}>
            <span className="perfil-bipolar__factor">{fila.codigo}</span>
            {mostrarBruto && <span className="perfil-bipolar__bruto">{fila.bruto ?? '—'}</span>}
            <span className="perfil-bipolar__polo perfil-bipolar__polo--bajo" title={fila.polo_bajo}>{fila.polo_bajo}</span>
            <div className="perfil-bipolar__pista">
              {ESTENES.map((esten) => {
                const activo = Number(fila.esten_ideal) === esten
                if (!editable) return <span key={esten} className="perfil-bipolar__paso" />
                return (
                  <button
                    key={esten}
                    type="button"
                    className={`perfil-bipolar__paso perfil-bipolar__paso--boton ${activo ? 'perfil-bipolar__paso--activo' : ''}`}
                    aria-label={`${fila.nombre}: esten ideal ${esten}`}
                    aria-pressed={activo}
                    onClick={() => onCambiarIdeal?.(fila.dimension_id, activo ? null : esten)}
                  />
                )
              })}
              {marca(fila.esten_ideal, 'ideal')}
              {marca(fila.esten_real, 'real')}
            </div>
            <span className="perfil-bipolar__polo" title={fila.polo_alto}>{fila.polo_alto}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
