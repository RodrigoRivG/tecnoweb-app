import { useMemo } from 'react'

export default function GraficoPerfilPsicologico({ dimensiones }) {
  // Dimensiones destacadas para interpretación
  const rasgosAltos = useMemo(
    () => (dimensiones || []).filter((d) => d.valor >= 7.5),
    [dimensiones]
  )
  const rasgosBajos = useMemo(
    () => (dimensiones || []).filter((d) => d.valor <= 3.5),
    [dimensiones]
  )

  if (!dimensiones || dimensiones.length === 0) {
    return null
  }

  return (
    <div className="grafico-perfil-card">
      <div className="grafico-perfil-cabecera">
        <div>
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem' }}>
            📊 Perfil Psicométrico de Personalidad (16PF - Cattell)
          </h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--texto-suave)' }}>
            Distribución del candidato en la escala estándar de decatipos (1 al 10).
          </p>
        </div>

        {/* Leyenda de la escala */}
        <div className="grafico-perfil-leyenda">
          <span className="leyenda-item">
            <span className="leyenda-color leyenda-color--bajo" /> 1–3 (Polo Izquierdo)
          </span>
          <span className="leyenda-item">
            <span className="leyenda-color leyenda-color--medio" /> 4–7 (Término Medio)
          </span>
          <span className="leyenda-item">
            <span className="leyenda-color leyenda-color--alto" /> 8–10 (Polo Derecho)
          </span>
        </div>
      </div>

      {/* Regla numérica superior (1 a 10) */}
      <div className="grafico-regla-numerica">
        <div className="columna-polo columna-polo--izq">Polo Bajo (1–3)</div>
        <div className="columna-escala">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <span key={num} className={`tick-numero ${num >= 4 && num <= 7 ? 'tick-medio' : ''}`}>
              {num}
            </span>
          ))}
        </div>
        <div className="columna-polo columna-polo--der">Polo Alto (8–10)</div>
      </div>

      {/* Filas de las 16 dimensiones */}
      <div className="grafico-dimensiones-lista">
        {dimensiones.map((dim) => {
          // Posición porcentual del valor en la escala (1 = 0%, 10 = 100%)
          const porcentaje = Math.max(0, Math.min(100, ((dim.valor - 1) / 9) * 100))
          const esAlto = dim.valor >= 7.5
          const esBajo = dim.valor <= 3.5

          return (
            <div key={dim.id || dim.codigo} className="fila-dimension">
              {/* Polo Izquierdo */}
              <div className="columna-polo columna-polo--izq" title={dim.polo_bajo}>
                <span className={`polo-texto ${esBajo ? 'polo-texto--activo' : ''}`}>
                  {dim.polo_bajo}
                </span>
              </div>

              {/* Pista de la escala con marcador */}
              <div className="columna-escala">
                <div className="pista-escala">
                  {/* Zona media sombreada (4 a 7) */}
                  <div className="zona-media" />

                  {/* Marcas de los 10 pasos */}
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <div
                      key={n}
                      className="marca-paso"
                      style={{ left: `${((n - 1) / 9) * 100}%` }}
                    />
                  ))}

                  {/* Marcador del candidato */}
                  <div
                    className={`marcador-candidato ${esAlto ? 'marcador--alto' : esBajo ? 'marcador--bajo' : ''}`}
                    style={{ left: `${porcentaje}%` }}
                    title={`${dim.nombre}: ${dim.valor}`}
                  >
                    {dim.valor}
                  </div>
                </div>
              </div>

              {/* Polo Derecho */}
              <div className="columna-polo columna-polo--der" title={dim.polo_alto}>
                <span className={`polo-texto ${esAlto ? 'polo-texto--activo' : ''}`}>
                  {dim.polo_alto}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Resumen interpretativo al pie */}
      {(rasgosAltos.length > 0 || rasgosBajos.length > 0) && (
        <div className="grafico-interpretacion">
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', color: 'var(--texto)' }}>
            Interpretación de Tendencias Principales:
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--texto-suave)', lineHeight: 1.6 }}>
            {rasgosAltos.map((r) => (
              <li key={r.codigo}>
                <strong>Tendencia alta en {r.nombre} ({r.valor}/10):</strong> Manifiesta inclinación hacia <em>{r.polo_alto}</em>.
              </li>
            ))}
            {rasgosBajos.map((r) => (
              <li key={r.codigo}>
                <strong>Tendencia baja en {r.nombre} ({r.valor}/10):</strong> Manifiesta inclinación hacia <em>{r.polo_bajo}</em>.
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
