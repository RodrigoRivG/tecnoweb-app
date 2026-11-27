import { nombreFactor16Pf } from '../utilidades/glosario16pf.js'

const MARGEN = { arriba: 28, derecha: 16, abajo: 38, izquierda: 48 }
const ALTO_GRAFICO = 280

function valorEnEje(valor) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return null
  return Math.max(0, Math.min(10, Number(valor)))
}

export default function GraficoLineas16Pf({ filas, aproximacion = null, personalidadCompleta = false }) {
  const datos = filas.filter((fila) => fila.esten_real != null || fila.esten_ideal != null)
  if (!datos.length) {
    return <p className="informe-ejecutivo__sin-grafico">Sin datos de personalidad para el gráfico.</p>
  }

  const ancho = Math.max(760, datos.length * 46 + MARGEN.izquierda + MARGEN.derecha)
  const alto = ALTO_GRAFICO
  const anchoUtil = ancho - MARGEN.izquierda - MARGEN.derecha
  const altoUtil = alto - MARGEN.arriba - MARGEN.abajo
  const pasoX = datos.length > 1 ? anchoUtil / (datos.length - 1) : 0

  function coordenadaY(valor) {
    const v = valorEnEje(valor)
    if (v === null) return null
    return MARGEN.arriba + altoUtil - (v / 10) * altoUtil
  }

  function puntosSerie(clave) {
    return datos
      .map((fila, indice) => {
        const y = coordenadaY(fila[clave])
        if (y === null) return null
        const x = MARGEN.izquierda + pasoX * indice
        return `${x},${y}`
      })
      .filter(Boolean)
      .join(' ')
  }

  function marcasSerie(clave, clase) {
    return datos.map((fila, indice) => {
      const y = coordenadaY(fila[clave])
      if (y === null) return null
      const x = MARGEN.izquierda + pasoX * indice
      const valor = Number(fila[clave]).toFixed(1)
      const titulo = nombreFactor16Pf(fila)

      return (
        <circle
          key={`${clave}-${fila.codigo ?? indice}`}
          cx={x}
          cy={y}
          r={4}
          className={`informe-ejecutivo__punto informe-ejecutivo__punto--${clase}`}
        >
          <title>{`${titulo}: ${clave === 'esten_ideal' ? 'Ideal' : 'Real'} ${valor}`}</title>
        </circle>
      )
    })
  }

  const ideal = puntosSerie('esten_ideal')
  const real = puntosSerie('esten_real')
  const valoresIdeales = datos.map((f) => f.esten_ideal).filter((v) => v != null)
  const valoresReales = datos.map((f) => f.esten_real).filter((v) => v != null)
  const curvaPlana =
    valoresIdeales.length > 1
    && valoresReales.length > 1
    && new Set(valoresIdeales.map((v) => Number(v).toFixed(1))).size <= 2
    && new Set(valoresReales.map((v) => Number(v).toFixed(1))).size <= 2

  const rejilla = [0, 2, 4, 6, 8, 10]
  const yMediaAlto = coordenadaY(7)
  const yMediaBajo = coordenadaY(4)

  return (
    <figure className="informe-ejecutivo__grafico" aria-labelledby="titulo-perfil-lineas">
      <div className="informe-ejecutivo__grafico-cabecera">
        <figcaption id="titulo-perfil-lineas" className="informe-ejecutivo__grafico-titulo">
          Perfil de personalidad
        </figcaption>
        {personalidadCompleta && aproximacion != null && (
          <span className="informe-ejecutivo__grafico-badge">Coincidencia {aproximacion}%</span>
        )}
        {!personalidadCompleta && (
          <span className="informe-ejecutivo__grafico-badge informe-ejecutivo__grafico-badge--pendiente">
            Coincidencia pendiente
          </span>
        )}
      </div>
      {curvaPlana && (
        <p className="informe-ejecutivo__aviso-curva" role="note">
          Las curvas casi no varían entre factores: revisá que el candidato haya rendido el 16PF completo
          y que el perfil ideal no sea uniforme (común en datos de prueba).
        </p>
      )}
      <div className="informe-ejecutivo__grafico-leyenda">
        <span><i className="informe-ejecutivo__muestra informe-ejecutivo__muestra--ideal" aria-hidden /> Perfil ideal</span>
        <span><i className="informe-ejecutivo__muestra informe-ejecutivo__muestra--real" aria-hidden /> Perfil real</span>
        <span className="informe-ejecutivo__leyenda-media">Eje vertical: estenes 0–10 · sombreado = promedio 4–7</span>
      </div>
      <div className="informe-ejecutivo__grafico-scroll">
        <svg
          className="informe-ejecutivo__svg"
          viewBox={`0 0 ${ancho} ${alto}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Gráfico de líneas del perfil 16PF, escala 0 a 10"
        >
          {yMediaAlto != null && yMediaBajo != null && (
            <rect
              x={MARGEN.izquierda}
              y={yMediaAlto}
              width={anchoUtil}
              height={yMediaBajo - yMediaAlto}
              className="informe-ejecutivo__zona-media"
            />
          )}
          {rejilla.map((marca) => {
            const y = coordenadaY(marca)
            return (
              <g key={marca}>
                <line
                  x1={MARGEN.izquierda}
                  y1={y}
                  x2={ancho - MARGEN.derecha}
                  y2={y}
                  className="informe-ejecutivo__rejilla"
                />
                <text x={MARGEN.izquierda - 12} y={y + 4} textAnchor="end" className="informe-ejecutivo__eje-y">
                  {marca}
                </text>
              </g>
            )
          })}
          {ideal && <polyline points={ideal} className="informe-ejecutivo__curva informe-ejecutivo__curva--ideal" />}
          {real && <polyline points={real} className="informe-ejecutivo__curva informe-ejecutivo__curva--real" />}
          {marcasSerie('esten_ideal', 'ideal')}
          {marcasSerie('esten_real', 'real')}
          {datos.map((fila, indice) => {
            const x = MARGEN.izquierda + pasoX * indice
            const rotulo = fila.codigo ?? String(indice + 1)
            return (
              <text key={fila.codigo ?? indice} x={x} y={alto - 12} textAnchor="middle" className="informe-ejecutivo__eje-x">
                <title>{nombreFactor16Pf(fila)}</title>
                {rotulo}
              </text>
            )
          })}
          <text
            x={(ancho + MARGEN.izquierda - MARGEN.derecha) / 2}
            y={alto - 1}
            className="informe-ejecutivo__eje-etiqueta"
            textAnchor="middle"
          >
            Factores
          </text>
        </svg>
      </div>
      <details className="informe-ejecutivo__glosario-detalle no-print">
        <summary>Nombres de los 16 factores</summary>
        <ul className="informe-ejecutivo__glosario">
          {datos.map((fila) => (
            <li key={fila.codigo}>
              <strong>{fila.codigo}</strong> {nombreFactor16Pf(fila)}
            </li>
          ))}
        </ul>
      </details>
    </figure>
  )
}