export default function GraficoPerfilHabilidadesBlandas({ diagnostico }) {
  if (!diagnostico || !diagnostico.dimensiones?.length) {
    return null
  }

  const { dimensiones, puntaje_total, puntaje_maximo, porcentaje_global, nivel_global, resumen } = diagnostico

  return (
    <section aria-label="Perfil de Habilidades Blandas y Competencias Socioemocionales" className="tarjeta-perfil-blandas">
      <div className="perfil-blandas-cabecera">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🌟</span>
            <h2 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--texto, #0f172a)' }}>
              Perfil de Medición de Habilidades Blandas
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--texto-suave, #64748b)' }}>
            {resumen}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="badge-blandas-global">
            {nivel_global}
          </span>
          <div style={{ fontSize: '0.85rem', color: 'var(--texto-suave, #64748b)', marginTop: '0.35rem' }}>
            Puntuación Global: <strong>{puntaje_total} / {puntaje_maximo} ({porcentaje_global}%)</strong>
          </div>
        </div>
      </div>

      <div className="perfil-blandas-grid">
        {dimensiones.map((dim) => {
          const esSobresaliente = dim.nivel === 'Sobresaliente'
          const esAvanzado = dim.nivel === 'Avanzado'
          const esCompetente = dim.nivel === 'Competente'

          const badgeClass = esSobresaliente
            ? 'badge-blandas--sobresaliente'
            : esAvanzado
            ? 'badge-blandas--avanzado'
            : esCompetente
            ? 'badge-blandas--competente'
            : 'badge-blandas--desarrollo'

          const barraColor = esSobresaliente
            ? 'linear-gradient(90deg, #6366f1, #4f46e5)'
            : esAvanzado
            ? 'linear-gradient(90deg, #10b981, #059669)'
            : esCompetente
            ? 'linear-gradient(90deg, #3b82f6, #2563eb)'
            : 'linear-gradient(90deg, #f59e0b, #d97706)'

          return (
            <div key={dim.codigo} className="tarjeta-dimension-blanda">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.02rem', margin: 0, fontWeight: 700, color: 'var(--texto, #0f172a)' }}>
                    {dim.nombre}
                  </h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--texto-suave, #64748b)' }}>
                    {dim.descripcion}
                  </p>
                </div>
                <span className={`badge-blandas ${badgeClass}`}>{dim.nivel}</span>
              </div>

              {/* Barra de progreso */}
              <div className="pista-barra-blandas" style={{ marginTop: '0.75rem' }}>
                <div
                  className="relleno-barra-blandas"
                  style={{
                    width: `${dim.porcentaje}%`,
                    background: barraColor,
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--texto-suave)', margin: '0.5rem 0 0.75rem' }}>
                <span>Nivel de competencia</span>
                <strong>
                  {dim.puntaje} / {dim.puntaje_maximo} pts ({dim.porcentaje}%)
                </strong>
              </div>

              <p className="blandas-interpretacion-texto">{dim.interpretacion}</p>
            </div>
          )
        })}
      </div>

      <div className="resumen-blandas-pie">
        <strong>Dictamen de Talento Organizacional:</strong> La evaluación refleja una integración armónica de competencias interpersonales, capacidad de adaptación, comunicación constructiva y liderazgo participativo, factores determinantes para el desempeño profesional en equipos multidisciplinarios.
      </div>
    </section>
  )
}

