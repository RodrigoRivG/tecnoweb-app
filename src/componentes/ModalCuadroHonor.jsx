import { useEffect, useState } from 'react'
import { adjudicarSeleccionProceso, obtenerRankingProceso } from '../api/evaluador.js'

export default function ModalCuadroHonor({ procesoId, alCerrar, alAdjudicar, esEvaluador }) {
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [datosRanking, setDatosRanking] = useState(null)
  const [expandidoId, setExpandidoId] = useState(null)

  useEffect(() => {
    let activo = true

    obtenerRankingProceso(procesoId)
      .then((data) => {
        if (!activo) return
        setDatosRanking(data)
      })
      .catch((err) => {
        if (!activo) return
        setError(err.mensaje || 'Error al cargar el cuadro de honor y ranking.')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [procesoId])

  const handleAdjudicar = async () => {
    if (!window.confirm('¿Deseas adjudicar las plazas y publicar el ranking oficial definitivo? Esta acción consolidará el proceso y aprobará a los seleccionados.')) {
      return
    }

    try {
      setGuardando(true)
      setError(null)
      await adjudicarSeleccionProceso(procesoId)
      const data = await obtenerRankingProceso(procesoId)
      setDatosRanking(data)
      if (alAdjudicar) alAdjudicar()
    } catch (err) {
      setError(err.mensaje || err.message || 'Error al adjudicar las plazas.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-ranking"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        className="tarjeta"
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <span className="insignia insignia--primario" style={{ marginBottom: '0.4rem', display: 'inline-block' }}>
              Etapa 8: Selección Final y Adjudicación
            </span>
            <h2 id="titulo-modal-ranking" style={{ fontSize: '1.4rem', margin: '0.2rem 0', color: 'var(--texto, #0f172a)' }}>
              🏆 Cuadro de Honor y Ranking Ponderado
            </h2>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--texto-suave, #64748b)' }}>
              {datosRanking?.proceso?.carrera} &bull; Convocatoria {datosRanking?.proceso?.gestion}
            </p>
          </div>
          <button
            type="button"
            onClick={alCerrar}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              lineHeight: 1,
              cursor: 'pointer',
              color: 'var(--texto-suave)',
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.88rem',
            }}
          >
            {error}
          </div>
        )}

        {cargando ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--texto-suave)' }}>
            Calculando cuadro de honor y ponderaciones finales…
          </div>
        ) : (
          <div>
            {/* Banner de Estado de Publicación */}
            <div
              style={{
                background: datosRanking?.publicado ? '#f0fdf4' : '#fffbeb',
                border: `1px solid ${datosRanking?.publicado ? '#bbf7d0' : '#fef3c7'}`,
                borderRadius: '10px',
                padding: '0.85rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <span style={{ fontWeight: 700, color: datosRanking?.publicado ? '#166534' : '#b45309', fontSize: '0.95rem' }}>
                  {datosRanking?.publicado ? '✓ Ranking Oficial Publicado y Adjudicado' : '⏳ Cuadro de Honor en Borrador / Pre-adjudicación'}
                </span>
                <div style={{ fontSize: '0.82rem', color: 'var(--texto-suave)' }}>
                  Top {datosRanking?.proceso?.top_n || 5} candidatos obtienen adjudicación preferente institucional.
                </div>
              </div>

              {esEvaluador && !datosRanking?.publicado && (
                <button
                  type="button"
                  className="boton boton--primario"
                  onClick={handleAdjudicar}
                  disabled={guardando}
                  style={{ fontSize: '0.88rem', padding: '0.45rem 1rem' }}
                >
                  {guardando ? 'Adjudicando…' : '🏆 Adjudicar y Publicar Selección'}
                </button>
              )}
            </div>

            {/* Listado de Candidatos en Orden de Mérito */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
              {datosRanking?.candidatos?.map((cand) => {
                const esTop = cand.es_top
                const esPrimero = cand.posicion === 1
                const expandido = expandidoId === cand.postulacion_id

                const medalla = cand.posicion === 1 ? '🥇' : cand.posicion === 2 ? '🥈' : cand.posicion === 3 ? '🥉' : `#${cand.posicion}`

                return (
                  <div
                    key={cand.postulacion_id}
                    style={{
                      border: esPrimero ? '2px solid #eab308' : esTop ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                      borderRadius: '12px',
                      background: esPrimero ? '#fefce8' : esTop ? '#f8fafc' : '#ffffff',
                      padding: '1rem 1.25rem',
                      boxShadow: esPrimero ? '0 4px 6px -1px rgba(234, 179, 8, 0.15)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div
                          style={{
                            fontSize: cand.posicion <= 3 ? '1.8rem' : '1.1rem',
                            fontWeight: 800,
                            minWidth: '40px',
                            textAlign: 'center',
                            color: cand.posicion <= 3 ? 'inherit' : '#64748b',
                          }}
                        >
                          {medalla}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--texto, #0f172a)' }}>
                            {cand.postulante?.nombre_completo || 'Postulante'}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--texto-suave)' }}>
                            Código: {cand.codigo_postulacion} &bull; CI: {cand.postulante?.ci || 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primario, #2563eb)' }}>
                            {cand.puntaje_total} pts
                          </div>
                          <span
                            className={`insignia ${esTop ? 'insignia--exito' : 'insignia--secundario'}`}
                            style={{ fontSize: '0.75rem' }}
                          >
                            {esTop ? 'Terna / Cuadro de Honor' : 'Elegible'}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="boton boton--secundario"
                          onClick={() => setExpandidoId(expandido ? null : cand.postulacion_id)}
                          style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                        >
                          {expandido ? 'Ocultar Desglose' : 'Ver Desglose'}
                        </button>
                      </div>
                    </div>

                    {/* Desglose Ponderado Expandible */}
                    {expandido && (
                      <div
                        style={{
                          marginTop: '1rem',
                          paddingTop: '0.85rem',
                          borderTop: '1px solid #e2e8f0',
                        }}
                      >
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--texto-suave)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                          Ponderaciones por Prueba y Rúbrica:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem' }}>
                          {cand.desglose?.map((d) => (
                            <div
                              key={d.prueba_id}
                              style={{
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                padding: '0.5rem 0.75rem',
                                fontSize: '0.82rem',
                              }}
                            >
                              <div style={{ fontWeight: 600, color: 'var(--texto)' }}>{d.nombre}</div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--texto-suave)', marginTop: '0.2rem' }}>
                                <span>{d.puntaje_normalizado}% (Peso {d.peso}%)</span>
                                <strong style={{ color: 'var(--primario)' }}>+{d.aporte_ponderado} pts</strong>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Botón de cierre */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="boton boton--secundario"
                onClick={alCerrar}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
