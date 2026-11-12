export default function GraficoPerfilEmocional({ diagnostico }) {
  if (!diagnostico || !diagnostico.dimensiones?.length) {
    return null
  }

  const { dimensiones, genero, resumen } = diagnostico

  return (
    <section aria-label="Perfil de Inteligencia Emocional TMMS-24" className="tarjeta-perfil-emocional">
      <div className="perfil-emocional-cabecera">
        <div>
          <h2 style={{ fontSize: '1.35rem', margin: '0 0 0.35rem', color: 'var(--texto, #0f172a)' }}>
            Perfil de Inteligencia Emocional (TMMS-24)
          </h2>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--texto-suave, #64748b)' }}>
            {resumen} &bull; Baremo: <strong>{genero === 'F' ? 'Mujeres' : 'Hombres'}</strong>
          </p>
        </div>
        <span className="insignia insignia--primario" style={{ fontSize: '0.85rem' }}>
          Salovey &amp; Mayer
        </span>
      </div>

      <div className="perfil-emocional-grid">
        {dimensiones.map((dim) => {
          const esExcelente = dim.nivel === 'Excelente'
          const esAdecuada = dim.nivel === 'Adecuada'
          const colorClase = esExcelente
            ? 'badge-emocional--excelente'
            : esAdecuada
            ? 'badge-emocional--adecuada'
            : 'badge-emocional--alerta'

          const barraColor = esExcelente
            ? '#2563eb'
            : esAdecuada
            ? '#16a34a'
            : '#f59e0b'

          return (
            <div key={dim.codigo} className="tarjeta-dimension-emocional">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 700 }}>{dim.nombre}</h3>
                <span className={`badge-emocional ${colorClase}`}>{dim.nivel}</span>
              </div>

              {/* Barra de progreso */}
              <div className="pista-barra-emocional">
                <div
                  className="relleno-barra-emocional"
                  style={{
                    width: `${dim.porcentaje}%`,
                    backgroundColor: barraColor,
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--texto-suave)', margin: '0.5rem 0 0.85rem' }}>
                <span>Puntuación obtenida</span>
                <strong>
                  {dim.puntaje} / {dim.puntaje_maximo} pts ({dim.porcentaje}%)
                </strong>
              </div>

              <p className="dimension-interpretacion-texto">{dim.interpretacion}</p>
            </div>
          )
        })}
      </div>

      <div className="resumen-emocional-pie">
        <strong>Interpretación psicométrica:</strong> La inteligencia emocional percibida mide el equilibrio entre la autoobservación de los sentimientos y la capacidad de discernirlos y regularlos proactivamente en entornos profesionales de alta exigencia.
      </div>
    </section>
  )
}
