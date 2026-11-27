import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router'
import { obtenerBlobDocumento } from '../api/cliente.js'
import { descargarDocumentoPostulacion, obtenerDetallePostulacion, obtenerResultadoFinal, subirDocumentoPostulacion } from '../api/egresado.js'
import { aprobarRequisitos } from '../api/evaluador.js'
import { ErrorCarga, Esqueleto } from '../componentes/Estado.jsx'
import ModalCuadroHonor from '../componentes/ModalCuadroHonor.jsx'
import ModalEvaluacionCv from '../componentes/ModalEvaluacionCv.jsx'
import InformeCandidato from '../componentes/InformeCandidato.jsx'
import ModulosEvaluacion from '../componentes/ModulosEvaluacion.jsx'
import VistaPreviaDocumento from '../componentes/VistaPreviaDocumento.jsx'
import ModalEvaluacionEntrevista from '../componentes/ModalEvaluacionEntrevista.jsx'
import { useSesion } from '../sesion/SesionContext.jsx'
import { formatearFecha, formatearTamano } from '../utilidades/formato.js'
import { useConsulta } from '../utilidades/useConsulta.js'
import { esCandidatoExterno, puedeEntrarAlPanel, tienePermiso } from '../utilidades/roles.js'

export default function DetallePostulacion() {
  const { id } = useParams()
  const { pathname } = useLocation()
  const { usuario, cargando: cargandoSesion } = useSesion()

  const [archivosSeleccionados, setArchivosSeleccionados] = useState({})
  const [subiendoTipo, setSubiendoTipo] = useState(null)
  const [reemplazandoTipo, setReemplazandoTipo] = useState({})
  const [aviso, setAviso] = useState(null)
  const [mostrarModalCv, setMostrarModalCv] = useState(false)
  const [mostrarModalEntrevista, setMostrarModalEntrevista] = useState(false)
  const [mostrarModalRanking, setMostrarModalRanking] = useState(false)
  const [resultadoFinal, setResultadoFinal] = useState(null)
  const [aprobandoRequisitos, setAprobandoRequisitos] = useState(false)

  const [modulosRefresco, setModulosRefresco] = useState(0)
  const consulta = useConsulta(obtenerDetallePostulacion, id)
  const enPanel = puedeEntrarAlPanel(usuario)
  const esCandidato = esCandidatoExterno(usuario)
  const puedeRequisitos = tienePermiso(usuario, 'requisitos.aprobar')
  const puedeCv = tienePermiso(usuario, 'cv.calificar')
  const puedeEntrevista = tienePermiso(usuario, 'entrevista.calificar')
  const puedeInforme = tienePermiso(usuario, 'postulaciones.ver')
  const puedeRanking = tienePermiso(usuario, 'ranking.adjudicar')
  const esEnPanel = pathname.startsWith('/panel')
  const etapaSeleccionEstado = consulta.datos?.etapas?.find((e) => e.codigo === 'SELECCION')?.estado

  useEffect(() => {
    if (id && (etapaSeleccionEstado === 'APROBADA' || etapaSeleccionEstado === 'PENDIENTE')) {
      obtenerResultadoFinal(id)
        .then((res) => setResultadoFinal(res))
        .catch(() => {})
    }
  }, [id, etapaSeleccionEstado])

  if (cargandoSesion) {
    return <p className={esEnPanel ? 'seccion' : 'contenedor seccion'}>Cargando…</p>
  }

  if (!usuario) {
    return <Navigate to="/iniciar-sesion" replace state={{ desde: pathname }} />
  }

  // Si el usuario es administrador/evaluador y abrió /postulaciones/:id, redirigir a /panel/postulaciones/:id
  if (enPanel && !esEnPanel) {
    return <Navigate to={`/panel/postulaciones/${id}`} replace />
  }

  if (consulta.error) {
    return (
      <div className={esEnPanel ? '' : 'contenedor seccion'}>
        <p>
          <Link to={enPanel ? '/panel/postulaciones' : '/mi-cuenta'}>
            {enPanel ? '← Volver al listado de postulaciones' : '← Volver a mi cuenta'}
          </Link>
        </p>
        <ErrorCarga error={consulta.error} onReintentar={consulta.reintentar} />
      </div>
    )
  }

  if (!consulta.datos) {
    return (
      <div className={esEnPanel ? '' : 'contenedor seccion'}>
        <p>
          <Link to={enPanel ? '/panel/postulaciones' : '/mi-cuenta'}>
            {enPanel ? '← Volver al listado de postulaciones' : '← Volver a mi cuenta'}
          </Link>
        </p>
        <Esqueleto cantidad={3} />
      </div>
    )
  }

  const postulacion = consulta.datos
  const convocatoria = postulacion.convocatoria
  const etapaRequisitos = postulacion.etapas?.find((e) => e.codigo === 'REQUISITOS')
  const etapaAnalisisCv = postulacion.etapas?.find((e) => e.codigo === 'ANALISIS_CV')
  const etapaEntrevista = postulacion.etapas?.find((e) => e.codigo === 'ENTREVISTA')
  const etapaSeleccion = postulacion.etapas?.find((e) => e.codigo === 'SELECCION')
  const requisitosAprobados = etapaRequisitos?.estado === 'APROBADA'

  function seleccionarArchivo(tipoDocumento, evento) {
    const archivo = evento.target.files?.[0]
    setArchivosSeleccionados({ ...archivosSeleccionados, [tipoDocumento]: archivo })
    setAviso(null)
  }

  async function enviarDocumento(tipoDocumento) {
    const archivo = archivosSeleccionados[tipoDocumento]
    if (!archivo) {
      setAviso({ tipo: 'error', mensaje: 'Por favor selecciona un archivo antes de presionar subir.' })
      return
    }

    if (archivo.size > 5 * 1024 * 1024) {
      setAviso({ tipo: 'error', mensaje: 'El archivo excede el tamaño máximo permitido de 5 MB.' })
      return
    }

    setSubiendoTipo(tipoDocumento)
    setAviso(null)

    try {
      await subirDocumentoPostulacion(postulacion.id, tipoDocumento, archivo)
      consulta.reintentar()
      setModulosRefresco((n) => n + 1)
      const detalle = await obtenerDetallePostulacion(postulacion.id)
      setAviso({
        tipo: 'exito',
        mensaje: detalle.requisitos_completos
          ? '¡Documentación completa! Tus pruebas ya están habilitadas — pulsa Siguiente en el paso 4.'
          : `«${archivo.name}» guardado correctamente.`,
      })
      if (detalle.requisitos_completos) {
        requestAnimationFrame(() => {
          document.getElementById('titulo-modulos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      }
      setArchivosSeleccionados({ ...archivosSeleccionados, [tipoDocumento]: undefined })
      setReemplazandoTipo({ ...reemplazandoTipo, [tipoDocumento]: false })
    } catch (error) {
      setAviso({ tipo: 'error', mensaje: error.message || 'Error al subir el documento.' })
    } finally {
      setSubiendoTipo(null)
    }
  }

  async function descargarArchivo(documentoId, nombreOriginal) {
    try {
      await descargarDocumentoPostulacion(documentoId, nombreOriginal)
    } catch (error) {
      setAviso({ tipo: 'error', mensaje: error.message || 'No se pudo descargar el archivo.' })
    }
  }

  async function verArchivo(documentoId) {
    try {
      const blob = await obtenerBlobDocumento(`/documentos/${documentoId}/archivo`)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (error) {
      setAviso({ tipo: 'error', mensaje: error.message || 'No se pudo abrir el archivo.' })
    }
  }

  async function handleAprobarRequisitos() {
    try {
      setAprobandoRequisitos(true)
      await aprobarRequisitos(postulacion.id)
      setAviso({ tipo: 'exito', mensaje: 'Requisitos validados y aprobados exitosamente. La Etapa 4 (Evaluación Psicológica) ha sido habilitada.' })
      consulta.reintentar()
      setModulosRefresco((n) => n + 1)
    } catch (err) {
      setAviso({ tipo: 'error', mensaje: err.mensaje || 'Error al aprobar requisitos.' })
    } finally {
      setAprobandoRequisitos(false)
    }
  }

  function renderRequisito(req) {
    const tieneDocumento = req.documento !== null
    const doc = req.documento
    const estaReemplazando = reemplazandoTipo[req.tipo_documento]
    const esFoto = req.tipo_documento === 'FOTOGRAFIA'
    const extensiones = esFoto ? '.jpg,.jpeg,.png' : '.pdf,.jpg,.jpeg,.png'
    const archivoLocal = archivosSeleccionados[req.tipo_documento]
    const mostrarSubida = (!tieneDocumento || estaReemplazando) && !enPanel

    return (
      <li key={req.tipo_documento} className="requisito-card">
        <div className="requisito-card__cabecera">
          <div className="requisito-card__info">
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{req.nombre}</h3>
            {req.obligatorio ? (
              <span className="insignia insignia--error" style={{ fontSize: '0.75rem' }}>
                Obligatorio
              </span>
            ) : (
              <span className="insignia insignia--neutro" style={{ fontSize: '0.75rem' }}>
                Opcional
              </span>
            )}
          </div>

          <div>
            {tieneDocumento && !estaReemplazando ? (
              <span className="insignia insignia--exito">
                ✓{' '}
                {doc.estado === 'PENDIENTE' ? 'Cargado' : doc.estado === 'VALIDADO' ? 'Validado' : doc.estado}
              </span>
            ) : archivoLocal ? (
              <span className="insignia insignia--advertencia">Listo para enviar</span>
            ) : (
              <span className="insignia insignia--alerta">Falta subir</span>
            )}
          </div>
        </div>

        {!requisitosAprobados && (
          <p style={{ fontSize: '0.85rem', color: 'var(--texto-suave)', margin: '0 0 0.75rem' }}>
            Formatos: {esFoto ? 'JPG, PNG' : 'PDF, JPG, PNG'} · máx. 5 MB. Elige el archivo y pulsa{' '}
            <strong>Subir archivo</strong>.
          </p>
        )}

        {tieneDocumento && !estaReemplazando && (
          <>
            <VistaPreviaDocumento documentoServidor={doc} />
            <div className="requisito-card__archivo-subido">
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--texto-suave)' }}>
                Subido el {formatearFecha(doc.subido_en)}
              </p>
              <div className="requisito-card__acciones">
                <button type="button" className="boton boton--secundario boton--chico" onClick={() => verArchivo(doc.id)}>
                  Ver
                </button>
                <button
                  type="button"
                  className="boton boton--secundario boton--chico"
                  onClick={() => descargarArchivo(doc.id, doc.nombre_archivo)}
                >
                  Descargar
                </button>
                {!requisitosAprobados && !enPanel && (
                  <button
                    type="button"
                    className="boton boton--secundario boton--chico"
                    onClick={() => setReemplazandoTipo({ ...reemplazandoTipo, [req.tipo_documento]: true })}
                  >
                    Reemplazar
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {mostrarSubida && (
          <>
            {archivoLocal && <VistaPreviaDocumento archivoLocal={archivoLocal} etiqueta="Vista antes de subir" />}
            <div className="requisito-card__subida-form">
              <label className="requisito-card__file">
                <span className="requisito-card__file-text">{archivoLocal ? 'Cambiar archivo' : 'Elegir archivo'}</span>
                <input
                  type="file"
                  accept={extensiones}
                  onChange={(e) => seleccionarArchivo(req.tipo_documento, e)}
                  disabled={subiendoTipo === req.tipo_documento}
                />
              </label>

              <button
                type="button"
                className="boton boton--chico"
                disabled={subiendoTipo === req.tipo_documento || !archivoLocal}
                onClick={() => enviarDocumento(req.tipo_documento)}
              >
                {subiendoTipo === req.tipo_documento ? 'Subiendo…' : 'Subir archivo'}
              </button>

              {estaReemplazando && (
                <button
                  type="button"
                  className="boton boton--secundario boton--chico"
                  onClick={() => {
                    setReemplazandoTipo({ ...reemplazandoTipo, [req.tipo_documento]: false })
                    setArchivosSeleccionados({ ...archivosSeleccionados, [req.tipo_documento]: undefined })
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </>
        )}
      </li>
    )
  }

  return (
    <div className={esEnPanel ? '' : 'contenedor seccion'}>
      <nav aria-label="Navegación secundaria" style={{ marginBottom: '1.25rem' }}>
        <Link to={enPanel ? '/panel/postulaciones' : '/mi-cuenta'} className="enlace-accion" style={{ fontSize: '0.95rem' }}>
          {enPanel ? '← Volver al listado de postulaciones' : '← Volver a mi cuenta'}
        </Link>
      </nav>

      <header className="seccion__cabecera" style={{ marginBottom: '1.5rem' }}>
        <div>
          {!esCandidato && <p className="convocatoria__facultad">{convocatoria.facultad}</p>}
          <h1 className="titulo-pagina" style={{ margin: '0.25rem 0' }}>
            Postulación <span className="codigo" style={{ color: 'var(--primario)' }}>{postulacion.codigo}</span>
          </h1>
          {postulacion.postulante && (
            <p style={{ margin: '0.25rem 0', fontWeight: 600 }}>
              Postulante: <span style={{ color: 'var(--primario)' }}>{postulacion.postulante.nombre_completo}</span>
              {postulacion.postulante.ci && <span style={{ color: 'var(--texto-suave)', fontWeight: 'normal' }}> · CI: {postulacion.postulante.ci}</span>}
              {postulacion.postulante.correo && <span style={{ color: 'var(--texto-suave)', fontWeight: 'normal' }}> · {postulacion.postulante.correo}</span>}
            </p>
          )}
          <p className="seccion__descripcion">
            {convocatoria.nombre} · {convocatoria.carrera}
            {convocatoria.gestion ? ` (Gestión ${convocatoria.gestion})` : ''}
          </p>
        </div>
        <div>
          <span
            className={`insignia ${
              postulacion.estado === 'APROBADA'
                ? 'insignia--exito'
                : postulacion.estado === 'NO_APROBADA'
                ? 'insignia--error'
                : postulacion.estado === 'EN_PROCESO'
                ? 'insignia--pendiente'
                : 'insignia--neutro'
            }`}
            style={{ fontSize: '0.95rem', padding: '0.35rem 0.8rem' }}
          >
            {postulacion.estado === 'EN_PROCESO'
              ? 'En Proceso'
              : postulacion.estado === 'APROBADA'
              ? 'Aprobada'
              : postulacion.estado === 'NO_APROBADA'
              ? 'No Aprobada'
              : postulacion.estado}
          </span>
        </div>
      </header>

      {aviso && (
        <div className={`aviso aviso--${aviso.tipo}`} role="alert">
          <p>{aviso.mensaje}</p>
        </div>
      )}

      {/* Bloque 1: Progreso de las Etapas */}
      <section aria-labelledby="titulo-etapas">
        <h2 id="titulo-etapas" style={{ fontSize: '1.3rem' }}>Progreso de la Postulación</h2>
        <p className="seccion__descripcion">
          Tu avance en el embudo de selección. Cada etapa debe ser superada para habilitar la siguiente.
        </p>

        <div className="etapas-rejilla">
          {postulacion.etapas?.map((etapa) => {
            const esAprobada = etapa.estado === 'APROBADA'
            const esRevision = etapa.estado === 'EN_REVISION'
            const esPendiente = etapa.estado === 'PENDIENTE'

            const claseModificadora = esAprobada
              ? 'etapa-tarjeta--aprobada'
              : esRevision
              ? 'etapa-tarjeta--en-revision'
              : esPendiente
              ? 'etapa-tarjeta--pendiente'
              : 'etapa-tarjeta--bloqueada'

            return (
              <div key={etapa.codigo} className={`etapa-tarjeta ${claseModificadora}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--texto-suave)' }}>
                    ETAPA {etapa.orden}
                  </span>
                  <span
                    className={`insignia ${
                      esAprobada ? 'insignia--exito' : esRevision ? 'insignia--pendiente' : 'insignia--neutro'
                    }`}
                  >
                    {esAprobada ? '✓ Superada' : esRevision ? '🔍 En revisión' : esPendiente ? '⏳ Pendiente' : '🔒 Bloqueada'}
                  </span>
                </div>
                <h3 style={{ fontSize: '1rem', margin: '0.25rem 0 0' }}>{etapa.nombre}</h3>
              </div>
            )
          })}
        </div>
      </section>

      {/* Bloque 2: Paso 3 - Requisitos Documentales */}
      {!esCandidato && postulacion.requisitos?.length > 0 && (
        <section
          aria-labelledby="titulo-requisitos"
          className={requisitosAprobados && !enPanel ? 'requisitos-paso' : undefined}
          style={{ marginTop: '2.5rem' }}
        >
          {requisitosAprobados && !enPanel ? (
            <details className="requisitos-paso__details">
              <summary id="titulo-requisitos" className="requisitos-paso__summary">
                Paso 3: Documentación <span className="insignia insignia--exito">Completada</span>
              </summary>
              <p className="seccion__descripcion" style={{ marginTop: '0.75rem' }}>
                Tus documentos obligatorios ya fueron validados. Expande esta sección para ver o descargar cada archivo.
              </p>
              <ul className="requisitos-lista">
                {postulacion.requisitos?.map((req) => renderRequisito(req))}
              </ul>
            </details>
          ) : (
            <>
              <h2 id="titulo-requisitos" style={{ fontSize: '1.3rem' }}>
                Paso 3: Carga de Requisitos Documentales
              </h2>
              <p className="seccion__descripcion">
                Para que el equipo evaluador pueda iniciar la revisión de tu postulación, debes subir los documentos
                obligatorios solicitados en formato PDF o imagen (máximo 5 MB por archivo).
              </p>

              {requisitosAprobados ? (
                <div className="aviso aviso--exito" role="status">
                  <p>
                    <strong>✓ Documentación aprobada:</strong> El equipo evaluador ha validado todos tus documentos obligatorios.
                    La Etapa 3 ha sido superada exitosamente.
                  </p>
                </div>
              ) : postulacion.requisitos_completos ? (
                <div className="aviso aviso--exito" role="status">
                  <p>
                    <strong>✓ Documentación completa:</strong> Has subido todos los documentos obligatorios.
                    {requisitosAprobados
                      ? ' La etapa de requisitos quedó aprobada.'
                      : ' El sistema validó tu expediente automáticamente; puedes continuar con las evaluaciones.'}
                  </p>
                </div>
              ) : (
                <div className="aviso aviso--error" role="status">
                  <p>
                    <strong>Requisitos pendientes:</strong> Faltan uno o más documentos obligatorios para que tu postulación pueda ser revisada.
                  </p>
                </div>
              )}

              {puedeRequisitos && !requisitosAprobados && postulacion.requisitos_completos && (
                <div
                  style={{
                    marginTop: '1rem',
                    marginBottom: '1rem',
                    padding: '1rem 1.25rem',
                    background: 'var(--info-suave)',
                    border: '1px solid var(--info-borde)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--info)' }}>Revisión de Documentación (Comisión / Evaluador):</strong>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--info)' }}>
                      Todos los documentos obligatorios han sido presentados. Puedes validar el expediente y habilitar la evaluación psicológica del postulante.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="boton boton--primario"
                    onClick={handleAprobarRequisitos}
                    disabled={aprobandoRequisitos}
                  >
                    {aprobandoRequisitos ? 'Aprobando…' : '✓ Validar y Aprobar Requisitos'}
                  </button>
                </div>
              )}

              <ul className="requisitos-lista">
                {postulacion.requisitos?.map((req) => renderRequisito(req))}
              </ul>
            </>
          )}
        </section>
      )}

      {!enPanel && (
        <ModulosEvaluacion
          postulacionId={postulacion.id}
          refresco={modulosRefresco}
          alCompletarEtapa={() => consulta.reintentar()}
        />
      )}

      {/* Bloque 5: Paso 6 - Análisis de CV */}
      {!esCandidato && etapaAnalisisCv?.estado === 'PENDIENTE' && (
        <section aria-labelledby="titulo-paso6" className="tarjeta" style={{ marginTop: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="insignia insignia--advertencia" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>⏳ En Revisión por la Comisión</span>
              <h2 id="titulo-paso6" style={{ fontSize: '1.25rem', margin: '0.2rem 0' }}>Paso 6: Análisis de CV y Méritos</h2>
              <p className="seccion__descripcion" style={{ margin: 0 }}>
                Tu currículum vitae y certificados están siendo revisados y calificados por la comisión evaluadora mediante la rúbrica institucional (Formación, Experiencia, Habilidades y Presentación).
              </p>
            </div>
            {puedeCv && (
              <button
                type="button"
                className="boton boton--primario"
                onClick={() => setMostrarModalCv(true)}
                style={{ whiteSpace: 'nowrap' }}
              >
                📝 Calificar Rúbrica de CV →
              </button>
            )}
          </div>
        </section>
      )}

      {!esCandidato && etapaAnalisisCv?.estado === 'APROBADA' && (
        <section aria-labelledby="titulo-paso6-aprobado" className="tarjeta" style={{ marginTop: '1.5rem', borderLeft: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="insignia insignia--exito" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>✓ Análisis de CV Aprobado</span>
              <h2 id="titulo-paso6-aprobado" style={{ fontSize: '1.25rem', margin: '0.2rem 0' }}>Paso 6: Análisis de CV (Calificado)</h2>
              <p className="seccion__descripcion" style={{ margin: 0 }}>
                El expediente y currículum han sido evaluados y aprobados con la rúbrica institucional.
              </p>
            </div>
            {puedeCv && (
              <button
                type="button"
                className="boton boton--secundario"
                onClick={() => setMostrarModalCv(true)}
                style={{ whiteSpace: 'nowrap' }}
              >
                Ver / Editar Calificación
              </button>
            )}
          </div>
        </section>
      )}

      {/* Bloque 6: Paso 7 - Entrevista */}
      {!esCandidato && etapaEntrevista?.estado === 'PENDIENTE' && (
        <section aria-labelledby="titulo-paso7" className="tarjeta" style={{ marginTop: '1.5rem', borderLeft: '4px solid var(--primario)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="insignia insignia--primario" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>🎤 Entrevista en Curso</span>
              <h2 id="titulo-paso7" style={{ fontSize: '1.25rem', margin: '0.2rem 0' }}>Paso 7: Entrevista Personal</h2>
              <p className="seccion__descripcion" style={{ margin: 0 }}>
                El postulante ha sido convocado ante el tribunal de entrevistas para evaluar su dominio técnico, comunicación, motivación y resolución de casos.
              </p>
            </div>
            {puedeEntrevista && (
              <button
                type="button"
                className="boton boton--primario"
                onClick={() => setMostrarModalEntrevista(true)}
                style={{ whiteSpace: 'nowrap' }}
              >
                🎤 Calificar Entrevista →
              </button>
            )}
          </div>
        </section>
      )}

      {!esCandidato && etapaEntrevista?.estado === 'APROBADA' && (
        <section aria-labelledby="titulo-paso7-aprobado" className="tarjeta" style={{ marginTop: '1.5rem', borderLeft: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="insignia insignia--exito" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>✓ Entrevista Aprobada</span>
              <h2 id="titulo-paso7-aprobado" style={{ fontSize: '1.25rem', margin: '0.2rem 0' }}>Paso 7: Entrevista Personal (Calificada)</h2>
              <p className="seccion__descripcion" style={{ margin: 0 }}>
                La entrevista personal ha sido evaluada y aprobada satisfactoriamente con la rúbrica institucional.
              </p>
            </div>
            {puedeEntrevista && (
              <button
                type="button"
                className="boton boton--secundario"
                onClick={() => setMostrarModalEntrevista(true)}
                style={{ whiteSpace: 'nowrap' }}
              >
                Ver / Editar Calificación
              </button>
            )}
          </div>
        </section>
      )}

      {puedeInforme && <InformeCandidato postulacionId={id} />}

      {/* Bloque 7: Paso 8 - Selección */}
      {!esCandidato && etapaSeleccion?.estado === 'PENDIENTE' && (
        <section aria-labelledby="titulo-paso8-pendiente" className="tarjeta" style={{ marginTop: '1.5rem', borderLeft: '4px solid #eab308' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="insignia insignia--advertencia" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>⏳ En Proceso de Selección Final</span>
              <h2 id="titulo-paso8-pendiente" style={{ fontSize: '1.25rem', margin: '0.2rem 0' }}>Paso 8: Selección Final y Adjudicación</h2>
              <p className="seccion__descripcion" style={{ margin: 0 }}>
                Se están consolidando las ponderaciones de todas las etapas para conformar el Cuadro de Honor y adjudicar las plazas institucionales.
              </p>
            </div>
            {(puedeRanking || !enPanel) && (
              <button
                type="button"
                className="boton boton--primario"
                onClick={() => setMostrarModalRanking(true)}
                style={{ whiteSpace: 'nowrap' }}
              >
                🏆 Ver Cuadro de Honor y Ranking
              </button>
            )}
          </div>
        </section>
      )}

      {!esCandidato && etapaSeleccion?.estado === 'APROBADA' && (
        <section aria-labelledby="titulo-paso8" className="tarjeta" style={{ marginTop: '1.5rem', borderLeft: '4px solid #eab308', background: 'var(--destacado-suave)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="insignia insignia--exito" style={{ marginBottom: '0.5rem', display: 'inline-block', backgroundColor: '#eab308', color: '#713f12' }}>
                🏆 ¡Plaza Adjudicada!
              </span>
              <h2 id="titulo-paso8" style={{ fontSize: '1.35rem', margin: '0.2rem 0', color: 'var(--destacado)' }}>
                Paso 8: Selección y Adjudicación (Completada con Éxito)
              </h2>
              <p style={{ margin: '0.3rem 0', color: 'var(--destacado)', fontSize: '0.92rem' }}>
                ¡Felicitaciones! Has superado todas las etapas del proceso de Talento Universitario con calificación de honor y obtenido la adjudicación del puesto.
              </p>
              {resultadoFinal && (
                <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ background: 'var(--superficie)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--destacado)' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--destacado)', display: 'block' }}>Puntaje Total Ponderado</span>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--destacado)' }}>{resultadoFinal.puntaje_total} / 100 pts</strong>
                  </div>
                  <div style={{ background: 'var(--superficie)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--destacado)' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--destacado)', display: 'block' }}>Lugar en el Ranking</span>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--destacado)' }}>#{resultadoFinal.posicion} (Terna de Honor)</strong>
                  </div>
                </div>
              )}
            </div>
            {(puedeRanking || !enPanel) && (
              <button
                type="button"
                className="boton boton--primario"
                onClick={() => setMostrarModalRanking(true)}
                style={{ whiteSpace: 'nowrap' }}
              >
                🏆 Ver Cuadro de Honor Oficial
              </button>
            )}
          </div>
        </section>
      )}

      {/* Modal de Calificación de CV para Evaluadores */}
      {mostrarModalCv && (
        <ModalEvaluacionCv
          postulacionId={postulacion.id}
          alCerrar={() => setMostrarModalCv(false)}
          alCalificar={() => consulta.refrescar()}
        />
      )}

      {/* Modal de Calificación de Entrevista para Evaluadores */}
      {mostrarModalEntrevista && (
        <ModalEvaluacionEntrevista
          postulacionId={postulacion.id}
          alCerrar={() => setMostrarModalEntrevista(false)}
          alCalificar={() => consulta.refrescar()}
        />
      )}

      {/* Modal de Cuadro de Honor y Adjudicación */}
      {mostrarModalRanking && (
        <ModalCuadroHonor
          procesoId={postulacion.convocatoria?.proceso_id || postulacion.proceso_id || 1}
          alCerrar={() => setMostrarModalRanking(false)}
          alAdjudicar={() => {
            consulta.refrescar()
            if (id) {
              obtenerResultadoFinal(id).then((res) => setResultadoFinal(res)).catch(() => {})
            }
          }}
          esEvaluador={puedeRanking}
        />
      )}
    </div>
  )
}
