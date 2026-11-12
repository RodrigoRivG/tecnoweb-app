export default function GraficoPerfilLectura({ diagnostico }) {
  if (!diagnostico) {
    return null
  }

  const { aciertos, total, porcentaje, rango_cualitativo, percentil, interpretacion } = diagnostico

  return (
    <section aria-label="Diagnóstico de Comprensión Lectora" className="tarjeta-diagnostico-ci">
      <div className="ci-badge-grande">
        <span className="ci-badge-grande__numero">{percentil}</span>
        <span className="ci-badge-grande__label">Percentil Poblacional</span>
      </div>

      <div className="ci-grid-metricas">
        <div>
          <div className="ci-metrica-titulo">Rango Diagnóstico</div>
          <div className="ci-metrica-valor">{rango_cualitativo}</div>
        </div>
        <div>
          <div className="ci-metrica-titulo">Preguntas Acertadas</div>
          <div className="ci-metrica-valor">
            {aciertos} de {total} ({porcentaje}%)
          </div>
        </div>
        <div>
          <div className="ci-metrica-titulo">Aptitud Evaluada</div>
          <div className="ci-metrica-valor">Comprensión e Inferencia</div>
        </div>
      </div>

      {/* Barra de Percentil */}
      <div style={{ margin: '1.25rem 0 0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--texto-suave)', marginBottom: '0.35rem' }}>
          <span>Escala Percentil (1 - 99)</span>
          <strong>P{percentil}</strong>
        </div>
        <div className="pista-barra-emocional" style={{ height: '10px' }}>
          <div
            className="relleno-barra-emocional"
            style={{
              width: `${Math.max(5, Math.min(100, percentil))}%`,
              backgroundColor: percentil >= 75 ? '#2563eb' : percentil >= 50 ? '#16a34a' : '#f59e0b',
            }}
          />
        </div>
      </div>

      <p className="ci-interpretacion-texto">&ldquo;{interpretacion}&rdquo;</p>
    </section>
  )
}

