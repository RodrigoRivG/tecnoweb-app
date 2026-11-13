import { useEffect, useMemo, useState } from 'react'
import { calificarEntrevista, obtenerFormularioEntrevista } from '../api/evaluador.js'

export default function ModalEvaluacionEntrevista({ postulacionId, alCerrar, alCalificar }) {
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [datosForm, setDatosForm] = useState(null)
  const [calificaciones, setCalificaciones] = useState({})
  const [observaciones, setObservaciones] = useState('')

  useEffect(() => {
    let activo = true

    obtenerFormularioEntrevista(postulacionId)
      .then((data) => {
        if (!activo) return
        setDatosForm(data)

        // Inicializar puntajes si ya existía calificación previa o en valores razonables por defecto
        const iniciales = {}
        const prevCalifs = data.resultado?.calificaciones || []

        data.criterios?.forEach((c) => {
          const encontrada = prevCalifs.find((p) => p.criterio_id === c.id)
          iniciales[c.id] = {
            puntaje: encontrada ? encontrada.puntaje : (c.puntaje_maximo * 0.85),
            comentario: encontrada ? encontrada.comentario || '' : '',
          }
        })

        setCalificaciones(iniciales)
        setObservaciones(data.resultado?.observaciones || '')
      })
      .catch((err) => {
        if (activo) setError(err.mensaje || 'Error al cargar formulario de entrevista.')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [postulacionId])

  // Cálculo de totales en vivo
  const { puntajeTotal, puntajeMaximo, porcentaje, esAprobatoria } = useMemo(() => {
    if (!datosForm?.criterios?.length) {
      return { puntajeTotal: 0, puntajeMaximo: 0, porcentaje: 0, esAprobatoria: false }
    }

    let total = 0
    let maximo = 0

    datosForm.criterios.forEach((c) => {
      maximo += c.puntaje_maximo
      const val = parseFloat(calificaciones[c.id]?.puntaje || 0)
      total += isNaN(val) ? 0 : val
    })

    const pct = maximo > 0 ? (total / maximo) * 100 : 0
    return {
      puntajeTotal: Math.round(total * 100) / 100,
      puntajeMaximo: Math.round(maximo * 100) / 100,
      porcentaje: Math.round(pct * 10) / 10,
      esAprobatoria: pct >= 50,
    }
  }, [datosForm, calificaciones])

  const handlePuntajeChange = (criterioId, valor, max) => {
    const num = Math.max(0, Math.min(max, parseFloat(valor) || 0))
    setCalificaciones((prev) => ({
      ...prev,
      [criterioId]: {
        ...prev[criterioId],
        puntaje: num,
      },
    }))
  }

  const handleComentarioChange = (criterioId, comentario) => {
    setCalificaciones((prev) => ({
      ...prev,
      [criterioId]: {
        ...prev[criterioId],
        comentario,
      },
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setGuardando(true)
      setError(null)

      const payload = {
        calificaciones: Object.entries(calificaciones).map(([criterioId, item]) => ({
          criterio_id: parseInt(criterioId, 10),
          puntaje: parseFloat(item.puntaje) || 0,
          comentario: item.comentario?.trim() || null,
        })),
        observaciones: observaciones?.trim() || null,
      }

      const res = await calificarEntrevista(postulacionId, payload)

      alCerrar()
      if (alCalificar) {
        alCalificar(res.data)
      }
    } catch (err) {
      const mensaje =
        err.mensaje ||
        (err.errors ? Object.values(err.errors).flat().join('. ') : null) ||
        err.message ||
        'Error al guardar calificación de la entrevista.'
      setError(mensaje)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-entrevista"
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
          maxWidth: '780px',
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
              Etapa 7: Tribunal de Entrevistas
            </span>
            <h2 id="titulo-modal-entrevista" style={{ fontSize: '1.4rem', margin: '0.2rem 0', color: 'var(--texto, #0f172a)' }}>
              Evaluación de Entrevista Personal
            </h2>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--texto-suave, #64748b)' }}>
              Rúbrica de desenvolvimiento, dominio técnico, motivación y capacidad resolutiva en vivo.
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
            Cargando rúbrica de entrevista y datos del postulante…
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Banner del expediente */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: 'var(--texto, #0f172a)', fontSize: '1rem' }}>
                  {datosForm?.postulacion?.postulante?.nombre_completo || 'Postulante'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--texto-suave, #64748b)' }}>
                  {datosForm?.postulacion?.convocatoria?.carrera} &bull; Código: {datosForm?.postulacion?.codigo}
                </div>
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#1e293b' }}>
                <span className="insignia insignia--exito">✓ CV Aprobado</span>
                <span className="insignia insignia--primario">🎤 Entrevista Activa</span>
              </div>
            </div>

            {/* Listado de Criterios de la Rúbrica */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.75rem' }}>
              {datosForm?.criterios?.map((criterio) => {
                const puntajeActual = calificaciones[criterio.id]?.puntaje ?? 0
                const comentarioActual = calificaciones[criterio.id]?.comentario ?? ''

                return (
                  <div
                    key={criterio.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '1.25rem',
                      background: '#ffffff',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <label htmlFor={`criterio-${criterio.id}`} style={{ fontWeight: 700, fontSize: '1.02rem', color: 'var(--texto, #0f172a)' }}>
                        {criterio.orden}. {criterio.nombre}
                      </label>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--primario, #2563eb)' }}>
                        Máximo: {criterio.puntaje_maximo} pts
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <input
                        type="range"
                        id={`slider-${criterio.id}`}
                        min="0"
                        max={criterio.puntaje_maximo}
                        step="0.5"
                        value={puntajeActual}
                        onChange={(e) => handlePuntajeChange(criterio.id, e.target.value, criterio.puntaje_maximo)}
                        style={{ flex: 1, accentColor: 'var(--primario, #2563eb)' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <input
                          type="number"
                          id={`criterio-${criterio.id}`}
                          min="0"
                          max={criterio.puntaje_maximo}
                          step="0.1"
                          value={puntajeActual}
                          onChange={(e) => handlePuntajeChange(criterio.id, e.target.value, criterio.puntaje_maximo)}
                          style={{
                            width: '72px',
                            padding: '0.4rem 0.6rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontWeight: 700,
                            textAlign: 'center',
                          }}
                        />
                        <span style={{ fontSize: '0.85rem', color: 'var(--texto-suave)' }}>pts</span>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder={`Comentarios u observaciones de la entrevista en ${criterio.nombre.toLowerCase()}…`}
                      value={comentarioActual}
                      onChange={(e) => handleComentarioChange(criterio.id, e.target.value)}
                      maxLength={500}
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )
              })}
            </div>

            {/* Observaciones generales */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="observaciones-entrevista" style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem', color: 'var(--texto)' }}>
                Dictamen Final del Tribunal de Entrevista:
              </label>
              <textarea
                id="observaciones-entrevista"
                rows={3}
                placeholder="Apreciación colegiada de la entrevista, fortalezas, áreas de oportunidad y recomendación para selección…"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                maxLength={1000}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Totalizador de puntaje y barra de resumen */}
            <div
              style={{
                background: esAprobatoria ? '#f0fdf4' : '#fffbeb',
                border: `1px solid ${esAprobatoria ? '#bbf7d0' : '#fef3c7'}`,
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    marginBottom: '0.35rem',
                    backgroundColor: esAprobatoria ? '#dcfce7' : '#fee2e2',
                    color: esAprobatoria ? '#166534' : '#991b1b',
                  }}
                >
                  {esAprobatoria ? '✓ Calificación Aprobatoria (≥ 50%)' : '✕ No Aprobatoria (< 50%)'}
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--texto, #0f172a)' }}>
                  Total: {puntajeTotal} / {puntajeMaximo} pts ({porcentaje}%)
                </div>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--texto-suave)', maxWidth: '300px' }}>
                Al guardar con calificación aprobatoria, la postulación avanzará a la <strong>Etapa 8: Selección Final y Adjudicación</strong>.
              </div>
            </div>

            {/* Acciones del formulario */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="boton boton--secundario"
                onClick={alCerrar}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="boton boton--primario"
                disabled={guardando}
                style={{ minWidth: '170px' }}
              >
                {guardando ? 'Guardando…' : '✓ Guardar Calificación'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

