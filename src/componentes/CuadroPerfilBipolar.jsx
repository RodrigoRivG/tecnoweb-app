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

  const etiqueta = tipo === 'real' ? 'Real' : 'Ideal'
  const texto = `${etiqueta} ${Number(valor).toFixed(1)}`

  return (
    <span
      className={`perfil-bipolar__marca perfil-bipolar__marca--${tipo}`}
      style={{ left: `${left}%` }}
      title={texto}
      aria-label={texto}
    />
  )
}

function curvaEsPlana(filas, clave) {
  const valores = filas.map((fila) => fila[clave]).filter((v) => v != null && !Number.isNaN(Number(v)))
  if (valores.length < 2) return false

  const redondeados = new Set(valores.map((v) => Number(v).toFixed(1)))
  return redondeados.size <= 1
}

function etiquetaFactor(fila, variante) {
  if (variante === 'dimension') {
    return (
      <span className="perfil-bipolar__factor-dim">
        <span className="perfil-bipolar__factor-nombre">{fila.nombre}</span>
      </span>
    )
  }

  return <span className="perfil-bipolar__factor-letra">{fila.codigo}</span>
}

export default function CuadroPerfilBipolar({
  titulo,
  descripcion,
  filas,
  editable = false,
  onCambiarIdeal,
  mostrarBruto = false,
  porcentaje = null,
  variante = '16pf',
}) {
  const curvaIdeal = segmentos(filas, 'esten_ideal')
  const curvaReal = segmentos(filas, 'esten_real')
  const hayCurvaReal = filas.some((fila) => fila.esten_real != null)
  const hayCurvaIdeal = filas.some((fila) => fila.esten_ideal != null)
  const realPlana = hayCurvaReal && curvaEsPlana(filas, 'esten_real')
  const idealPlana = hayCurvaIdeal && curvaEsPlana(filas, 'esten_ideal')
  const columnas =
    variante === '16pf' && mostrarBruto
      ? 'perfil-bipolar__matriz--16pf-bruto'
      : variante === '16pf'
        ? 'perfil-bipolar__matriz--16pf'
        : 'perfil-bipolar__matriz--dimension'

  return (
    <section className="perfil-bipolar perfil-bipolar--clasico">
      <header className="perfil-bipolar__cabecera">
        <div>
          <h3>{titulo}</h3>
          {descripcion && <p>{descripcion}</p>}
        </div>
        <div className="perfil-bipolar__leyenda">
          <span><i className="perfil-bipolar__muestra perfil-bipolar__muestra--ideal" aria-hidden /> Curva ideal</span>
          {!editable && <span><i className="perfil-bipolar__muestra perfil-bipolar__muestra--real" aria-hidden /> Curva real</span>}
          {porcentaje !== null && porcentaje !== undefined && (
            <strong>Aproximación {porcentaje}%</strong>
          )}
        </div>
      </header>

      {!editable && !hayCurvaReal && (
        <p className="aviso informe__sin-curva" role="status">
          No hay puntuaciones en estenes para este bloque. El postulante debe <strong>rendir la batería</strong>{' '}
          o volver a ejecutar <code>php artisan talento:generar-candidatos-completos</code> en entornos de prueba.
        </p>
      )}

      {!editable && hayCurvaReal && !hayCurvaIdeal && (
        <p className="informe__sin-ideal" role="note">
          La convocatoria no tiene <strong>perfil ideal</strong> definido; solo se muestra la curva real (azul).
        </p>
      )}

      {!editable && (realPlana || idealPlana) && (
        <p className="informe__sin-ideal" role="note">
          Los puntos quedaron casi todos en el mismo decil (línea vertical). Eso suele pasar en{' '}
          <strong>datos de prueba</strong> cuando el candidato marca siempre las mismas opciones. Para evaluar a alguien,
          mirá si la curva <strong>ideal</strong> (dorada) y la <strong>real</strong> (azul) se parecen cuando exista perfil
          de convocatoria o de empresa.
        </p>
      )}

      {!editable && (
        <details className="perfil-bipolar__ayuda">
          <summary>¿Cómo leer esta tabla?</summary>
          <ul>
            {variante === '16pf' ? (
              <>
                <li>
                  Cada <strong>fila</strong> es un factor de personalidad del 16PF (A, B, C…). El texto a la izquierda y
                  derecha describe el polo bajo y el polo alto del factor.
                </li>
                <li>
                  La franja del <strong>1 al 10</strong> son <em>estenes</em> (como notas estandarizadas): 4–7 es rango
                  medio; 1–3 y 8–10 son extremos hacia un polo u otro.
                </li>
                <li>
                  El <strong>punto azul</strong> es el postulante; la <strong>línea dorada</strong>, si existe, es el perfil
                  que la convocatoria o la empresa marcó como deseado.
                </li>
              </>
            ) : (
              <>
                <li>
                  Cada fila es una <strong>dimensión</strong> de inteligencia emocional u otra habilidad blanda medida en
                  el test.
                </li>
                <li>
                  «Por desarrollar» y «Fortaleza» son los polos bajo y alto; el punto azul indica dónde quedó el candidato
                  en la escala 1–10.
                </li>
                <li>
                  Con <strong>perfil ideal</strong> de vacante, comparás si el azul (real) se acerca al dorado (ideal).
                </li>
                <li>
                  Un solo test de <strong>habilidades blandas</strong> con las <strong>8 dimensiones</strong> del perfil.
                </li>
              </>
            )}
          </ul>
        </details>
      )}

      <div
        className={`perfil-bipolar__matriz ${columnas}`}
        style={{ '--perfil-filas': filas.length }}
      >
        <div className="perfil-bipolar__fila perfil-bipolar__fila--cabecera" role="row">
          <span className="perfil-bipolar__celda perfil-bipolar__celda--factor">
            {variante === '16pf' ? 'Factor' : 'Dimensión'}
          </span>
          {mostrarBruto && <span className="perfil-bipolar__celda perfil-bipolar__celda--bruto">Bruto</span>}
          <span className="perfil-bipolar__celda perfil-bipolar__celda--baja">Baja puntuación</span>
          <div className="perfil-bipolar__celda perfil-bipolar__celda--escala">
            <span className="perfil-bipolar__titulo-escala">Puntuación en estenes</span>
            <div className="perfil-bipolar__regla-estenes" aria-hidden>
              {ESTENES.map((esten) => (
                <span
                  key={esten}
                  className={esten >= 4 && esten <= 7 ? 'perfil-bipolar__numero perfil-bipolar__numero--promedio' : 'perfil-bipolar__numero'}
                >
                  {esten}
                </span>
              ))}
            </div>
            {!editable && (
              <span className="perfil-bipolar__promedio-leyenda">Promedio (4–7)</span>
            )}
          </div>
          <span className="perfil-bipolar__celda perfil-bipolar__celda--alta">Alta puntuación</span>
        </div>

        {filas.map((fila, indice) => (
          <div
            key={fila.dimension_id ?? fila.codigo}
            className={`perfil-bipolar__fila${indice % 2 === 1 ? ' perfil-bipolar__fila--alt' : ''}`}
            role="row"
            title={fila.nombre}
          >
            <span className="perfil-bipolar__celda perfil-bipolar__celda--factor">
              {etiquetaFactor(fila, variante)}
            </span>
            {mostrarBruto && (
              <span className="perfil-bipolar__celda perfil-bipolar__celda--bruto">
                {fila.bruto ?? '—'}
              </span>
            )}
            <span className="perfil-bipolar__celda perfil-bipolar__celda--baja perfil-bipolar__polo">
              {variante === 'dimension' ? 'Por desarrollar' : fila.polo_bajo}
            </span>
            <div className="perfil-bipolar__celda perfil-bipolar__celda--pista">
              <div className="perfil-bipolar__pista">
                {ESTENES.map((esten) => {
                  const activo = Number(fila.esten_ideal) === esten
                  if (!editable) {
                    return <span key={esten} className="perfil-bipolar__paso" />
                  }
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
              {!editable && (
                <span className="perfil-bipolar__estenes-en-fila">
                  {fila.esten_real != null && (
                    <span className="perfil-bipolar__esten perfil-bipolar__esten--real">
                      Real {Number(fila.esten_real).toFixed(1)}
                    </span>
                  )}
                  {fila.esten_ideal != null && (
                    <span className="perfil-bipolar__esten perfil-bipolar__esten--ideal">
                      Ideal {Number(fila.esten_ideal).toFixed(1)}
                    </span>
                  )}
                </span>
              )}
            </div>
            <span className="perfil-bipolar__celda perfil-bipolar__celda--alta perfil-bipolar__polo">
              {variante === 'dimension' ? 'Fortaleza' : fila.polo_alto}
            </span>
          </div>
        ))}

        <div className="perfil-bipolar__grafico" aria-hidden>
          <svg
            className="perfil-bipolar__curvas"
            viewBox={`0 0 100 ${Math.max(filas.length, 1)}`}
            preserveAspectRatio="none"
          >
            {curvaIdeal.map((puntos) => (
              <polyline key={`i-${puntos}`} points={puntos} className="perfil-bipolar__curva perfil-bipolar__curva--ideal" />
            ))}
            {curvaReal.map((puntos) => (
              <polyline key={`r-${puntos}`} points={puntos} className="perfil-bipolar__curva perfil-bipolar__curva--real" />
            ))}
          </svg>
        </div>
      </div>
    </section>
  )
}