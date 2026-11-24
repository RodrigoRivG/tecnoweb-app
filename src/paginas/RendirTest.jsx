import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import GraficoPerfilPsicologico from '../componentes/GraficoPerfilPsicologico.jsx'
import GraficoPerfilEmocional from '../componentes/GraficoPerfilEmocional.jsx'
import GraficoPerfilLectura from '../componentes/GraficoPerfilLectura.jsx'
import GraficoPerfilPurdue from '../componentes/GraficoPerfilPurdue.jsx'
import GraficoPerfilHabilidadesBlandas from '../componentes/GraficoPerfilHabilidadesBlandas.jsx'
import {
  finalizarEvaluacion,
  iniciarEvaluacion,
  obtenerEvaluacionActiva,
  obtenerPreguntasIntento,
  responderPregunta,
} from '../api/egresado.js'
import { useConsulta } from '../utilidades/useConsulta.js'

function formatearTiempo(segundos) {
  if (segundos === null || segundos === undefined || segundos < 0) return '00:00'
  const mins = Math.floor(segundos / 60)
  const segs = segundos % 60
  return `${String(mins).padStart(2, '0')}:${String(segs).padStart(2, '0')}`
}

export default function RendirTest() {
  const { id } = useParams()
  const [parametros] = useSearchParams()
  const navigate = useNavigate()
  const cierrePedido = useRef(false)
  const vencimientoPedido = useRef(null)

  const desdeUrl = parametros.get('proceso_prueba_id')
  const [procesoPruebaId, setProcesoPruebaId] = useState(desdeUrl ? Number(desdeUrl) : null)

  // 1. Consultar estado general de la evaluación
  const consultarEvaluacionCallback = useCallback(
    (params) => obtenerEvaluacionActiva(params.id, params.procesoPruebaId),
    []
  )
  const paramsEvaluacion = useMemo(() => ({ id, procesoPruebaId }), [id, procesoPruebaId])
  const {
    datos: evaluacion,
    cargando: cargandoEvaluacion,
    error: errorEvaluacion,
    reintentar,
  } = useConsulta(consultarEvaluacionCallback, paramsEvaluacion)

  // Estados locales para nuevo intento o finalización reciente
  const [intentoIniciado, setIntentoIniciado] = useState(null)
  const [iniciando, setIniciando] = useState(false)
  const [respuestasManuales, setRespuestasManuales] = useState({})
  const [mostrarModalFinalizar, setMostrarModalFinalizar] = useState(false)
  const [finalizando, setFinalizando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [resultadoReciente, setResultadoReciente] = useState(null)
  const [errorAccion, setErrorAccion] = useState(null)

  // Intento y resultado efectivos (derivados)
  const intentoId = intentoIniciado?.intento_id ?? evaluacion?.intento_activo?.id ?? null
  const resultadoFinal = resultadoReciente ?? evaluacion?.resultado ?? null

  // Consultar preguntas del intento si hay intento activo y aún no ha finalizado
  const consultarPreguntasCallback = useCallback(
    (intId) => (intId && !resultadoFinal ? obtenerPreguntasIntento(intId) : Promise.resolve(null)),
    [resultadoFinal]
  )
  const { datos: datosPreguntas, cargando: cargandoPreguntas, error: errorPreguntas, reintentar: recargarPreguntas } = useConsulta(
    consultarPreguntasCallback,
    intentoId
  )

  const preguntas = useMemo(() => datosPreguntas?.preguntas ?? [], [datosPreguntas])

  // Respuestas combinadas (precargadas del backend + selecciones del usuario en curso)
  const respuestas = useMemo(() => {
    const mapa = {}
    preguntas.forEach((p) => {
      if (p.opcion_seleccionada_id) {
        mapa[p.id] = p.opcion_seleccionada_id
      }
    })
    return { ...mapa, ...respuestasManuales }
  }, [preguntas, respuestasManuales])

  const segundosServidor = datosPreguntas?.intento?.segundos_restantes ?? null
  const preguntaEnCurso = datosPreguntas?.preguntas?.[0]?.id ?? null
  const firmaReloj = `${preguntaEnCurso ?? ''}:${segundosServidor ?? ''}`
  const [firmaVista, setFirmaVista] = useState(firmaReloj)
  const [segundosTranscurridos, setSegundosTranscurridos] = useState(0)
  if (firmaReloj !== firmaVista) {
    setFirmaVista(firmaReloj)
    setSegundosTranscurridos(0)
  }

  useEffect(() => {
    if (segundosServidor === null || resultadoFinal) return undefined

    const timer = setInterval(() => {
      setSegundosTranscurridos((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [segundosServidor, preguntaEnCurso, resultadoFinal])

  const tiempoRestante =
    segundosServidor !== null ? Math.max(0, segundosServidor - segundosTranscurridos) : null

  // Comenzar intento
  const handleComenzar = async () => {
    try {
      setIniciando(true)
      setErrorAccion(null)
      const res = await iniciarEvaluacion(id, evaluacion?.proceso_prueba_id)
      setIntentoIniciado(res)
    } catch (err) {
      setErrorAccion(err.message || 'No se pudo iniciar el test.')
    } finally {
      setIniciando(false)
    }
  }

  // Marcar una respuesta
  const handleSeleccionarOpcion = async (preguntaId, opcionId) => {
    if (finalizando || resultadoFinal || guardando) return

    setGuardando(true)
    setErrorAccion(null)

    try {
      await responderPregunta(intentoId, preguntaId, opcionId)
      recargarPreguntas()
      setGuardando(false)
    } catch (err) {
      setGuardando(false)
      setErrorAccion(err.message || 'No se pudo guardar tu respuesta. Verifica tu conexión.')
    }
  }

  // Entregar y calificar el examen
  const handleFinalizar = async () => {
    try {
      setFinalizando(true)
      setErrorAccion(null)
      const res = await finalizarEvaluacion(intentoId)
      setResultadoReciente(res)
      setMostrarModalFinalizar(false)
      reintentar()
    } catch (err) {
      setErrorAccion(err.message || 'Ocurrió un error al entregar tu examen.')
    } finally {
      setFinalizando(false)
    }
  }

  // Cambiar de prueba dentro de la etapa
  const handleCambiarPrueba = (ppId) => {
    if (intentoId && !resultadoFinal) {
      if (!window.confirm('Tienes un intento en curso. ¿Deseas cambiar de prueba?')) return
    }
    setProcesoPruebaId(ppId)
    setIntentoIniciado(null)
    setResultadoReciente(null)
    setRespuestasManuales({})
    setErrorAccion(null)
  }

  // Progreso general
  const progreso = datosPreguntas?.progreso
  const totalPreguntas = progreso?.total ?? preguntas.length
  const totalRespondidas = progreso?.respondidas ?? Object.keys(respuestas).length
  const porcentajeProgreso =
    totalPreguntas > 0 ? Math.round((totalRespondidas / totalPreguntas) * 100) : 0
  const preguntaActual = preguntas[0] ?? null
  const numeroVisible = Math.min(totalPreguntas || 1, totalRespondidas + 1)

  useEffect(() => {
    if (tiempoRestante !== 0 || !preguntaActual || resultadoFinal) return
    if (vencimientoPedido.current === preguntaActual.id) return
    vencimientoPedido.current = preguntaActual.id
    recargarPreguntas()
  }, [tiempoRestante, preguntaActual, resultadoFinal, recargarPreguntas])

  useEffect(() => {
    if (cierrePedido.current || resultadoFinal || !intentoId) return

    const completo = totalPreguntas > 0 && totalRespondidas >= totalPreguntas && !preguntaActual
    const cerradoEnServidor = datosPreguntas?.cerrado_por_tiempo

    if (!completo && !cerradoEnServidor) return

    cierrePedido.current = true
    finalizarEvaluacion(intentoId)
      .then((res) => {
        setResultadoReciente(res)
        reintentar()
      })
      .catch((err) => {
        cierrePedido.current = false
        setErrorAccion(err.message || 'No se pudo cerrar la evaluación.')
      })
  }, [totalPreguntas, totalRespondidas, preguntaActual, datosPreguntas, intentoId, resultadoFinal, reintentar])

  // Siguiente prueba pendiente en esta misma etapa (si existe)
  const siguientePruebaPendiente = useMemo(() => {
    if (!evaluacion?.pruebas_etapa) return null
    return (
      evaluacion.pruebas_etapa.find(
        (p) => p.id !== evaluacion.proceso_prueba_id && !p.completada
      ) ?? null
    )
  }, [evaluacion])

  // Tipos de prueba
  const codigoPrueba = evaluacion?.prueba?.codigo
  const esTestInteligencia = codigoPrueba === 'ES_USTED_MUY_HABIL'
  const esTestEmocional = codigoPrueba === 'TMMS_24'
  const esTestPersonalidad = codigoPrueba === '16PF_FORMA_A' || codigoPrueba === '16PF_FORMA_B'
  const esTestLectura = codigoPrueba === 'TEST_LECTURA_COMPRENSIVA'
  const esTestPurdue = codigoPrueba === 'TEST_PURDUE_NO_VERBAL'
  const esTestHabilidadesBlandas = codigoPrueba === 'TEST_HABILIDADES_BLANDAS'
  const esLikert = esTestEmocional || esTestHabilidadesBlandas

  // =========================================================================
  // RENDER: Estados de carga y error
  // =========================================================================
  if (cargandoEvaluacion && !evaluacion) {
    return (
      <div className="evaluacion-contenedor">
        <div className="tarjeta cargando-bloque" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <p style={{ fontSize: '1.2rem', color: 'var(--texto-suave)' }}>Cargando evaluación psicométrica…</p>
        </div>
      </div>
    )
  }

  if (errorEvaluacion) {
    return (
      <div className="evaluacion-contenedor">
        <div className="tarjeta aviso aviso--error">
          <p>
            <strong>Error:</strong> {errorEvaluacion.message || 'No se pudo cargar la evaluación.'}
          </p>
          <button
            type="button"
            className="boton boton--secundario"
            onClick={reintentar}
            style={{ marginTop: '1rem' }}
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // Selector de pestañas para pruebas de la misma etapa
  const selectorPruebas = evaluacion?.pruebas_etapa?.length > 1 && !intentoId && (
    <div className="selector-pruebas-etapa" role="tablist" aria-label="Pruebas disponibles en esta etapa">
      {evaluacion.pruebas_etapa.map((p) => {
        const estaActiva = (procesoPruebaId ?? evaluacion.proceso_prueba_id) === p.id
        return (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={estaActiva}
            className={`pestana-prueba-item ${estaActiva ? 'pestana-prueba-item--activa' : ''}`}
            onClick={() => handleCambiarPrueba(p.id)}
          >
            <span>{p.nombre}</span>
            {p.completada && (
              <span className="pestana-insignia-estado pestana-insignia-estado--completada">
                {p.aprobada ? '✓ Aprobado' : 'Completado'}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )

  // =========================================================================
  // RENDER: Pantalla de resultado final (si ya rindió)
  // =========================================================================
  if (resultadoFinal) {
    return (
      <div className="evaluacion-contenedor">
        {selectorPruebas}

        <div className="tarjeta" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <span className="insignia insignia--exito" style={{ fontSize: '1rem', padding: '0.4rem 1rem' }}>
            ✓ {resultadoFinal.aprobada ? 'Evaluación Aprobada' : 'Evaluación Completada'}
          </span>

          <h1 style={{ fontSize: '1.75rem', margin: '1rem 0 0.5rem' }}>
            {evaluacion?.prueba?.nombre || 'Test Psicométrico'}
          </h1>

          <p style={{ color: 'var(--texto-suave)', maxWidth: '580px', margin: '0 auto 2rem' }}>
            Tu evaluación ha sido registrada y calificada de forma satisfactoria por el sistema.
            Los datos psicométricos fueron almacenados en tu perfil de postulación.
          </p>

          <div
            style={{
              display: 'inline-flex',
              gap: '2rem',
              padding: '1.25rem 2.5rem',
              background: 'var(--superficie-destacada)',
              borderRadius: '8px',
              marginBottom: '2rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--texto-suave)' }}>Puntaje Obtenido</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primario)' }}>
                {resultadoFinal.puntaje_bruto ?? '—'} / {resultadoFinal.puntaje_maximo ?? '—'}
              </div>
            </div>
            <div style={{ borderLeft: '1px solid var(--borde)' }} />
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--texto-suave)' }}>Porcentaje Normalizado</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>
                {resultadoFinal.puntaje_normalizado ? `${resultadoFinal.puntaje_normalizado}%` : '100%'}
              </div>
            </div>
          </div>

          {/* Tarjeta de Diagnóstico de Coeficiente Intelectual (CI) si corresponde */}
          {resultadoFinal.diagnostico_inteligencia && (
            <div className="tarjeta-diagnostico-ci">
              <div className="ci-badge-grande">
                <span className="ci-badge-grande__numero">
                  {resultadoFinal.diagnostico_inteligencia.ci_estimado}
                </span>
                <span className="ci-badge-grande__label">Coeficiente Intelectual (CI)</span>
              </div>

              <div className="ci-grid-metricas">
                <div>
                  <div className="ci-metrica-titulo">Rango Diagnóstico</div>
                  <div className="ci-metrica-valor">
                    {resultadoFinal.diagnostico_inteligencia.rango_cualitativo}
                  </div>
                </div>
                <div>
                  <div className="ci-metrica-titulo">Percentil Poblacional</div>
                  <div className="ci-metrica-valor">
                    Percentil {resultadoFinal.diagnostico_inteligencia.percentil}
                  </div>
                </div>
                <div>
                  <div className="ci-metrica-titulo">Aciertos Directos</div>
                  <div className="ci-metrica-valor">
                    {resultadoFinal.diagnostico_inteligencia.aciertos} de{' '}
                    {resultadoFinal.diagnostico_inteligencia.total}
                  </div>
                </div>
              </div>

              <p className="ci-interpretacion-texto">
                &ldquo;{resultadoFinal.diagnostico_inteligencia.interpretacion}&rdquo;
              </p>
            </div>
          )}

          {/* Tarjeta de Diagnóstico de Inteligencia Emocional (TMMS-24) si corresponde */}
          {resultadoFinal.diagnostico_emocional && (
            <GraficoPerfilEmocional diagnostico={resultadoFinal.diagnostico_emocional} />
          )}

          {/* Tarjeta de Diagnóstico de Comprensión Lectora si corresponde */}
          {resultadoFinal.diagnostico_lectura && (
            <GraficoPerfilLectura diagnostico={resultadoFinal.diagnostico_lectura} />
          )}

          {/* Tarjeta de Diagnóstico Test No Verbal de Purdue si corresponde */}
          {resultadoFinal.diagnostico_purdue && (
            <GraficoPerfilPurdue diagnostico={resultadoFinal.diagnostico_purdue} />
          )}

          {/* Tarjeta de Diagnóstico de Habilidades Blandas si corresponde */}
          {resultadoFinal.diagnostico_habilidades_blandas && (
            <GraficoPerfilHabilidadesBlandas diagnostico={resultadoFinal.diagnostico_habilidades_blandas} />
          )}

          {/* Gráfico Oficial de Perfil Psicométrico (16PF - Cattell) */}
          {esTestPersonalidad && (
            <GraficoPerfilPsicologico
              dimensiones={
                resultadoFinal.perfil_dimensiones || evaluacion?.resultado?.perfil_dimensiones
              }
            />
          )}

          <div
            style={{
              marginTop: '2.5rem',
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {siguientePruebaPendiente && (
              <button
                type="button"
                className="boton boton--primario"
                onClick={() => handleCambiarPrueba(siguientePruebaPendiente.id)}
              >
                Rendir Siguiente Test ({siguientePruebaPendiente.nombre}) →
              </button>
            )}
            <button
              type="button"
              className="boton boton--secundario"
              onClick={() => navigate(`/postulaciones/${id}`)}
            >
              Volver al Detalle de mi Postulación
            </button>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // RENDER: Pantalla previa con instrucciones antes de iniciar
  // =========================================================================
  if (!intentoId) {
    return (
      <div className="evaluacion-contenedor">
        <div style={{ marginBottom: '1rem' }}>
          <Link
            to={`/postulaciones/${id}`}
            style={{ textDecoration: 'none', color: 'var(--primario)' }}
          >
            ← Volver a mi postulación
          </Link>
        </div>

        {selectorPruebas}

        <div className="tarjeta">
          <span
            className="insignia insignia--exito"
            style={{ marginBottom: '0.5rem', display: 'inline-block' }}
          >
            Paso 4: Evaluación Psicológica
          </span>
          <h1 style={{ fontSize: '1.85rem', margin: '0.25rem 0 1rem' }}>
            {evaluacion?.prueba?.nombre || 'Test de Evaluación Psicométrica'}
          </h1>

          <p
            style={{
              color: 'var(--texto-suave)',
              lineHeight: 1.6,
              fontSize: '1rem',
              margin: '0 0 1.5rem',
            }}
          >
            {evaluacion?.prueba?.descripcion ||
              'Esta evaluación mide capacidades clave de tu perfil profesional mediante preguntas psicotécnicas.'}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              margin: '1.5rem 0 2rem',
            }}
          >
            <div className="tarjeta" style={{ background: 'var(--superficie-destacada)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--texto-suave)' }}>Total de Preguntas</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {evaluacion?.configuracion?.total_preguntas || 24} preguntas
              </div>
            </div>
            <div className="tarjeta" style={{ background: 'var(--superficie-destacada)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--texto-suave)' }}>Tiempo por pregunta</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {evaluacion?.configuracion?.tiempo_pregunta_seg ?? 60} segundos
              </div>
            </div>
            <div className="tarjeta" style={{ background: 'var(--superficie-destacada)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--texto-suave)' }}>Intentos Permitidos</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {evaluacion?.configuracion?.max_intentos || 1} intento
              </div>
            </div>
          </div>

          <div className="aviso aviso--advertencia" style={{ marginBottom: '2rem' }}>
            <p>
              {esTestPurdue ? (
                <>
                  <strong>Instrucciones para el Test No Verbal de Purdue:</strong> En cada una de las 48 series se presentan 5 dibujos. Cuatro de ellos guardan una característica lógica común y uno es diferente. Tu tarea consiste en identificar la figura diferente y marcar la opción correspondiente (A, B, C, D o E). Cada pregunta tiene su propio tiempo.
                </>
              ) : esTestLectura ? (
                <>
                  <strong>Instrucciones para Habilidades y Aptitudes Específicas:</strong> Lee con detenimiento cada pasaje y responde a la pregunta de razonamiento analítico seleccionando la alternativa más precisa. Cada pregunta tiene su propio tiempo.
                </>
              ) : esTestInteligencia ? (
                <>
                  <strong>Instrucciones:</strong> Analiza cada matriz lógica de 3x3 y selecciona cuál de los 8 mosaicos completa la secuencia geométrica correctamente. Cada pregunta tiene su propio tiempo.
                </>
              ) : (
                <>
                  <strong>Recomendaciones:</strong> Responde con espontaneidad y sinceridad según tus
                  preferencias y hábitos personales. No hay respuestas correctas o incorrectas. Una vez
                  iniciado, deberás responder cada pregunta dentro de su tiempo. Si llega a cero, pasa a la siguiente.
                </>
              )}
            </p>
          </div>

          {errorAccion && (
            <div className="aviso aviso--error" style={{ marginBottom: '1.5rem' }}>
              <p>{errorAccion}</p>
            </div>
          )}

          <div style={{ textAlign: 'right' }}>
            <button
              type="button"
              className="boton boton--primario"
              onClick={handleComenzar}
              disabled={iniciando}
              style={{ padding: '0.85rem 2rem', fontSize: '1.1rem' }}
            >
              {iniciando ? 'Iniciando test…' : 'Comenzar Evaluación Ahora →'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // RENDER: Pantalla activa de examen en curso
  // =========================================================================
  return (
    <div className="evaluacion-contenedor">
      {/* Cabecera del Examen */}
      <div className="evaluacion-cabecera">
        <div>
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
            {evaluacion?.prueba?.nombre || 'Test de Evaluación'}
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--texto-suave)' }}>
            Pregunta {numeroVisible} de {totalPreguntas} ({porcentajeProgreso}% respondido)
          </span>
        </div>

        {tiempoRestante !== null && (
          <div
            className={`evaluacion-reloj ${tiempoRestante <= 10 ? 'evaluacion-reloj--alerta' : ''}`}
          >
            <span>Esta pregunta</span>
            <span>{formatearTiempo(tiempoRestante)}</span>
          </div>
        )}
      </div>

      {/* Barra de Progreso */}
      <div className="barra-progreso-contenedor">
        <div className="barra-progreso-relleno" style={{ width: `${porcentajeProgreso}%` }} />
      </div>

      {errorPreguntas && (
        <div className="aviso aviso--error" style={{ marginBottom: '1.5rem' }}>
          <p>{errorPreguntas.message || 'Error al cargar las preguntas.'}</p>
        </div>
      )}

      {cargandoPreguntas ? (
        <div className="tarjeta cargando-bloque" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Cargando preguntas de la evaluación…</p>
        </div>
      ) : preguntaActual ? (
        <div className="tarjeta-pregunta">
          <div className="pregunta-meta">
            <span>PREGUNTA #{preguntaActual.orden}</span>
            {preguntaActual.dimension && (
              <span className="insignia insignia--neutro">Factor: {preguntaActual.dimension}</span>
            )}
            {esTestInteligencia && (
              <span className="insignia insignia--primario">Razonamiento Abstracto</span>
            )}
            {esTestEmocional && (
              <span className="insignia insignia--primario">Inteligencia Emocional</span>
            )}
            {esTestHabilidadesBlandas && (
              <span className="insignia insignia--primario">Habilidades Blandas</span>
            )}
            {esTestLectura && (
              <span className="insignia insignia--primario">Habilidades y Aptitudes Específicas</span>
            )}
          </div>

          {(() => {
            if (esTestLectura && preguntaActual.enunciado?.includes('\n\n')) {
              const partes = preguntaActual.enunciado.split('\n\n')
              const pasajeTexto = partes.slice(0, -1).join('\n\n')
              const preguntaTexto = partes[partes.length - 1]
              return (
                <>
                  <div className="tarjeta-pasaje-lectura">
                    <div className="pasaje-lectura-cabecera">
                      <span className="pasaje-icono">📖</span>
                      <span className="pasaje-titulo">Texto de Lectura para Análisis</span>
                    </div>
                    <p className="pasaje-lectura-cuerpo">{pasajeTexto}</p>
                  </div>
                  <div className="pregunta-enunciado">{preguntaTexto}</div>
                </>
              )
            }
            return <div className="pregunta-enunciado">{preguntaActual.enunciado}</div>
          })()}

          {/* Si la pregunta incluye lámina gráfica (Test de Inteligencia) */}
          {preguntaActual.imagen_url && (
            <div className="tarjeta-matriz-visual">
              <img
                src={preguntaActual.imagen_url}
                alt={`Lámina Matriz Pregunta #${preguntaActual.orden}`}
                className="matriz-visual-imagen"
              />
            </div>
          )}

          {/* Renderizado de opciones según el tipo de test */}
          {esTestInteligencia || esTestPurdue ? (
            <div>
              <div
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--texto-suave)',
                  marginBottom: '0.5rem',
                  fontWeight: 600,
                }}
              >
                {esTestPurdue
                  ? 'Selecciona la figura diferente (A, B, C, D o E):'
                  : 'Selecciona la figura faltante:'}
              </div>
              <div
                className="opciones-letras-grid"
                role="radiogroup"
                aria-label="Opciones de respuesta"
              >
                {preguntaActual.opciones?.map((opc) => {
                  const estaSeleccionada = respuestas[preguntaActual.id] === opc.id
                  return (
                    <button
                      key={opc.id}
                      type="button"
                      className={`boton-opcion-letra ${
                        estaSeleccionada ? 'boton-opcion-letra--seleccionada' : ''
                      }`}
                      onClick={() => handleSeleccionarOpcion(preguntaActual.id, opc.id)}
                      role="radio"
                      aria-checked={estaSeleccionada}
                    >
                      <span className="letra-indicador-grande">{opc.etiqueta}</span>
                      <span className="letra-subtitulo">Opción {opc.etiqueta}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : esLikert ? (
            <div>
              <div
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--texto-suave)',
                  marginBottom: '0.5rem',
                  fontWeight: 600,
                }}
              >
                Indica tu grado de acuerdo:
              </div>
              <div
                className="opciones-likert-grid"
                role="radiogroup"
                aria-label="Opciones de escala Likert"
              >
                {preguntaActual.opciones?.map((opc) => {
                  const estaSeleccionada = respuestas[preguntaActual.id] === opc.id
                  return (
                    <button
                      key={opc.id}
                      type="button"
                      className={`boton-opcion-likert ${
                        estaSeleccionada ? 'boton-opcion-likert--seleccionada' : ''
                      }`}
                      onClick={() => handleSeleccionarOpcion(preguntaActual.id, opc.id)}
                      role="radio"
                      aria-checked={estaSeleccionada}
                    >
                      <span className="likert-numero">{opc.etiqueta}</span>
                      <span className="likert-texto">{opc.texto}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="opciones-lista" role="radiogroup" aria-label="Opciones de respuesta">
              {preguntaActual.opciones?.map((opc) => {
                const estaSeleccionada = respuestas[preguntaActual.id] === opc.id
                return (
                  <div
                    key={opc.id}
                    className={`opcion-item ${
                      estaSeleccionada ? 'opcion-item--seleccionada' : ''
                    }`}
                    onClick={() => handleSeleccionarOpcion(preguntaActual.id, opc.id)}
                    role="radio"
                    aria-checked={estaSeleccionada}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault()
                        handleSeleccionarOpcion(preguntaActual.id, opc.id)
                      }
                    }}
                  >
                    <div className="opcion-letra">{opc.etiqueta}</div>
                    <div style={{ flex: 1, fontSize: '1.05rem' }}>{opc.texto}</div>
                    {estaSeleccionada && (
                      <span style={{ color: 'var(--primario)', fontSize: '1.25rem' }}>✓</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Botones de Navegación */}
          <div className="evaluacion-acciones" style={{ marginTop: '2rem' }}>
            <p style={{ margin: 0, color: 'var(--texto-suave)' }}>
              {guardando
                ? 'Guardando respuesta…'
                : 'Al elegir una opción avanzas. Esa respuesta queda bloqueada.'}
            </p>
          </div>
        </div>
      ) : null}

      {/* Modal de confirmación para entregar */}
      {mostrarModalFinalizar && (
        <div className="modal-superposicion">
          <div className="modal-contenido" style={{ maxWidth: '480px' }}>
            <h3 style={{ margin: '0 0 1rem' }}>¿Deseas entregar tu evaluación?</h3>
            <p style={{ color: 'var(--texto-suave)', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
              Has respondido {totalRespondidas} de {totalPreguntas} preguntas (
              {totalPreguntas - totalRespondidas} pendientes). Al confirmar, tus respuestas serán
              calificadas y se registrará tu resultado final.
            </p>

            {errorAccion && (
              <div className="aviso aviso--error" style={{ marginBottom: '1rem' }}>
                <p>{errorAccion}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="boton boton--secundario"
                onClick={() => setMostrarModalFinalizar(false)}
                disabled={finalizando}
              >
                Continuar respondiendo
              </button>
              <button
                type="button"
                className="boton boton--primario"
                onClick={handleFinalizar}
                disabled={finalizando}
                style={{ background: '#16a34a', borderColor: '#16a34a' }}
              >
                {finalizando ? 'Calificando…' : 'Sí, Entregar Evaluación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
