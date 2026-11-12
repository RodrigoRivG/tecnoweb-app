import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { descargarDocumentoPostulacion, obtenerDetallePostulacion, obtenerResultadoFinal, subirDocumentoPostulacion } from '../api/egresado.js'
import { aprobarRequisitos } from '../api/evaluador.js'
import { ErrorCarga, Esqueleto } from '../componentes/Estado.jsx'
import ModalCuadroHonor from '../componentes/ModalCuadroHonor.jsx'
import ModalEvaluacionCv from '../componentes/ModalEvaluacionCv.jsx'
import ModalEvaluacionEntrevista from '../componentes/ModalEvaluacionEntrevista.jsx'
import { useSesion } from '../sesion/SesionContext.jsx'
import { formatearFecha, formatearTamano } from '../utilidades/formato.js'
import { useConsulta } from '../utilidades/useConsulta.js'

export default function DetallePostulacion() {
  const { id } = useParams()
  const navigate = useNavigate()
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

  const consulta = useConsulta(obtenerDetallePostulacion, id)
  const esEvaluador = usuario?.rol?.codigo === 'ADMIN' || usuario?.rol?.codigo === 'AYUDANTE'
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
  if (esEvaluador && !esEnPanel) {
    return <Navigate to={`/panel/postulaciones/${id}`} replace />
  }

  if (consulta.error) {
    return (
      <div className={esEnPanel ? '' : 'contenedor seccion'}>
        <p>
          <Link to={esEvaluador ? '/panel/postulaciones' : '/mi-cuenta'}>
            {esEvaluador ? '← Volver al listado de postulaciones' : '← Volver a mi cuenta'}
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
          <Link to={esEvaluador ? '/panel/postulaciones' : '/mi-cuenta'}>
            {esEvaluador ? '← Volver al listado de postulaciones' : '← Volver a mi cuenta'}
          </Link>
        </p>
        <Esqueleto cantidad={3} />
      </div>
    )
  }

  const postulacion = consulta.datos
  const convocatoria = postulacion.convocatoria
  const etapaRequisitos = postulacion.etapas?.find((e) => e.codigo === 'REQUISITOS')
  const etapaPsicologica = postulacion.etapas?.find((e) => e.codigo === 'EVALUACION_PSICOLOGICA')
  const etapaHabilidadesBlandas = postulacion.etapas?.find((e) => e.codigo === 'HABILIDADES_BLANDAS')
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
      setAviso({ tipo: 'exito', mensaje: '¡Documento subido y registrado exitosamente!' })
      setArchivosSeleccionados({ ...archivosSeleccionados, [tipoDocumento]: undefined })
      setReemplazandoTipo({ ...reemplazandoTipo, [tipoDocumento]: false })
      consulta.reintentar()
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

  async function handleAprobarRequisitos() {
    try {
      setAprobandoRequisitos(true)
      await aprobarRequisitos(postulacion.id)
      setAviso({ tipo: 'exito', mensaje: 'Requisitos validados y aprobados exitosamente. La Etapa 4 (Evaluación Psicológica) ha sido habilitada.' })
      consulta.reintentar()
    } catch (err) {
      setAviso({ tipo: 'error', mensaje: err.mensaje || 'Error al aprobar requisitos.' })
    } finally {
      setAprobandoRequisitos(false)
    }
  }

  return (
    <div className={esEnPanel ? '' : 'contenedor seccion'}>
      <nav aria-label="Navegación secundaria" style={{ marginBottom: '1.25rem' }}>
        <Link to={esEvaluador ? '/panel/postulaciones' : '/mi-cuenta'} className="enlace-accion" style={{ fontSize: '0.95rem' }}>
          {esEvaluador ? '← Volver al listado de postulaciones' : '← Volver a mi cuenta'}
        </Link>
      </nav>

      <header className="seccion__cabecera" style={{ marginBottom: '1.5rem' }}>
        <div>
          <p className="convocatoria__facultad">{convocatoria.facultad}</p>
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
            {convocatoria.nombre} · {convocatoria.carrera} (Gestión {convocatoria.gestion})
          </p>
        </div>
        <div>
          <span className="insignia insignia--pendiente" style={{ fontSize: '0.95rem', padding: '0.35rem 0.8rem' }}>
            {postulacion.estado}
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
      <section aria-labelledby="titulo-requisitos" style={{ marginTop: '2.5rem' }}>
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
              <strong>✓ Documentación completa:</strong> Has subido todos los documentos obligatorios requeridos.
              Tu postulación ha pasado a estado <strong>En Revisión</strong>.
            </p>
          </div>
        ) : (
          <div className="aviso aviso--error" role="status">
            <p>
              <strong>Requisitos pendientes:</strong> Faltan uno o más documentos obligatorios para que tu postulación pueda ser revisada.
            </p>
          </div>
        )}

        {esEvaluador && !requisitosAprobados && postulacion.requisitos_completos && (
          <div
            style={{
              marginTop: '1rem',
              marginBottom: '1rem',
              padding: '1rem 1.25rem',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <strong style={{ color: '#1e40af' }}>Revisión de Documentación (Comisión / Evaluador):</strong>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#1e3a8a' }}>
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
          {postulacion.requisitos?.map((req) => {
            const tieneDocumento = req.documento !== null
            const doc = req.documento
            const estaReemplazando = reemplazandoTipo[req.tipo_documento]
            const esFoto = req.tipo_documento === 'FOTOGRAFIA'
            const extensiones = esFoto ? '.jpg,.jpeg,.png' : '.pdf,.jpg,.jpeg,.png'

            return (
              <li key={req.tipo_documento} className="requisito-card">
                <div className="requisito-card__cabecera">
                  <div className="requisito-card__info">
                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{req.nombre}</h3>
                    {req.obligatorio ? (
                      <span className="insignia insignia--error" style={{ fontSize: '0.75rem' }}>Obligatorio</span>
                    ) : (
                      <span className="insignia insignia--neutro" style={{ fontSize: '0.75rem' }}>Opcional</span>
                    )}
                  </div>

                  <div>
                    {tieneDocumento ? (
                      <span className="insignia insignia--exito">
                        ✓ {doc.estado === 'PENDIENTE' ? 'Cargado (En revisión)' : doc.estado === 'VALIDADO' ? 'Validado y Aprobado' : doc.estado}
                      </span>
                    ) : (
                      <span className="insignia insignia--alerta">Falta subir</span>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--texto-suave)', margin: '0 0 0.75rem' }}>
                  Formatos permitidos: {esFoto ? 'JPG, PNG' : 'PDF, JPG, PNG'} (Hasta 5 MB).
                </p>

                {/* Si ya tiene documento subido */}
                {tieneDocumento && !estaReemplazando && (
                  <div className="requisito-card__archivo-subido">
                    <div>
                      <p style={{ margin: 0, fontWeight: 600 }}>📄 {doc.nombre_archivo}</p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--texto-suave)' }}>
                        {formatearTamano(doc.tamano_bytes)} · Subido el {formatearFecha(doc.subido_en)}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="boton boton--secundario boton--chico"
                        onClick={() => descargarArchivo(doc.id, doc.nombre_archivo)}
                      >
                        Descargar
                      </button>
                      {!requisitosAprobados && (
                        <button
                          type="button"
                          className="boton boton--secundario boton--chico"
                          onClick={() => setReemplazandoTipo({ ...reemplazandoTipo, [req.tipo_documento]: true })}
                        >
                          Reemplazar archivo
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Si no tiene documento o eligió reemplazar */}
                {(!tieneDocumento || estaReemplazando) && (
                  <div className="requisito-card__subida-form">
                    <input
                      type="file"
                      accept={extensiones}
                      onChange={(e) => seleccionarArchivo(req.tipo_documento, e)}
                      disabled={subiendoTipo === req.tipo_documento}
                    />

                    <button
                      type="button"
                      className="boton boton--chico"
                      disabled={subiendoTipo === req.tipo_documento || !archivosSeleccionados[req.tipo_documento]}
                      onClick={() => enviarDocumento(req.tipo_documento)}
                    >
                      {subiendoTipo === req.tipo_documento ? 'Subiendo…' : 'Subir archivo'}
                    </button>

                    {estaReemplazando && (
                      <button
                        type="button"
                        className="boton boton--secundario boton--chico"
                        onClick={() => setReemplazandoTipo({ ...reemplazandoTipo, [req.tipo_documento]: false })}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {/* Bloque 3: Paso 4 - Tests Psicotécnicos */}
      {etapaPsicologica?.estado === 'PENDIENTE' && (
        <section aria-labelledby="titulo-paso4" className="tarjeta" style={{ marginTop: '2.5rem', borderLeft: '4px solid var(--primario)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="insignia insignia--exito" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>✓ Etapa Habilitada</span>
              <h2 id="titulo-paso4" style={{ fontSize: '1.25rem', margin: '0.2rem 0' }}>Paso 4: Evaluación Psicológica</h2>
              <p className="seccion__descripcion" style={{ margin: 0 }}>
                Tus requisitos fueron aprobados. La siguiente etapa consiste en rendir la evaluación psicológica en línea (16PF).
              </p>
            </div>
            <button
              type="button"
              className="boton boton--primario"
              onClick={() => navigate(`/postulaciones/${postulacion.id}/test`)}
              style={{ whiteSpace: 'nowrap' }}
            >
              Rendir Evaluación Psicológica →
            </button>
          </div>
        </section>
      )}

      {etapaPsicologica?.estado === 'APROBADA' && (
        <section aria-labelledby="titulo-paso4-aprobado" className="tarjeta" style={{ marginTop: '2.5rem', borderLeft: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="insignia insignia--exito" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>✓ Evaluación Aprobada</span>
              <h2 id="titulo-paso4-aprobado" style={{ fontSize: '1.25rem', margin: '0.2rem 0' }}>Paso 4: Evaluación Psicológica (Completada)</h2>
              <p className="seccion__descripcion" style={{ margin: 0 }}>
                Has completado satisfactoriamente las 6 pruebas psicométricas y de aptitud. Tu postulación ha avanzado a las siguientes etapas.
              </p>
            </div>
            <button
              type="button"
              className="boton boton--secundario"
              onClick={() => navigate(`/postulaciones/${postulacion.id}/test`)}
              style={{ whiteSpace: 'nowrap' }}
            >
              Ver Resumen de Resultados
            </button>
          </div>
        </section>
      )}

      {/* Bloque 4: Paso 5 - Habilidades Blandas */}
      {etapaHabilidadesBlandas?.estado === 'PENDIENTE' && (
        <section aria-labelledby="titulo-paso5" className="tarjeta" style={{ marginTop: '1.5rem', borderLeft: '4px solid var(--primario)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="insignia insignia--exito" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>✓ Etapa Habilitada</span>
              <h2 id="titulo-paso5" style={{ fontSize: '1.25rem', margin: '0.2rem 0' }}>Paso 5: Medición de Habilidades Blandas</h2>
              <p className="seccion__descripcion" style={{ margin: 0 }}>
                Evalúa tus competencias interpersonales: comunicación asertiva, trabajo en equipo, resolución de conflictos, adaptabilidad y liderazgo.
              </p>
            </div>
            <button
              type="button"
              className="boton boton--primario"
              onClick={() => navigate(`/postulaciones/${postulacion.id}/test`)}
              style={{ whiteSpace: 'nowrap' }}
            >
              Rendir Test de Habilidades Blandas →
            </button>
          </div>
        </section>
      )}

      {etapaHabilidadesBlandas?.estado === 'APROBADA' && (
        <section aria-labelledby="titulo-paso5-aprobado" className="tarjeta" style={{ marginTop: '1.5rem', borderLeft: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="insignia insignia--exito" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>✓ Habilidades Blandas Aprobadas</span>
              <h2 id="titulo-paso5-aprobado" style={{ fontSize: '1.25rem', margin: '0.2rem 0' }}>Paso 5: Medición de Habilidades Blandas (Completada)</h2>
              <p className="seccion__descripcion" style={{ margin: 0 }}>
                Has completado la evaluación de habilidades blandas con calificación sobresaliente.
              </p>
            </div>
            <button
              type="button"
              className="boton boton--secundario"
              onClick={() => navigate(`/postulaciones/${postulacion.id}/test`)}
              style={{ whiteSpace: 'nowrap' }}
            >
              Ver Perfil de Competencias
            </button>
          </div>
        </section>
      )}

      {/* Bloque 5: Paso 6 - Análisis de CV */}
      {etapaAnalisisCv?.estado === 'PENDIENTE' && (
        <section aria-labelledby="titulo-paso6" className="tarjeta" style={{ marginTop: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="insignia insignia--advertencia" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>⏳ En Revisión por la Comisión</span>
              <h2 id="titulo-paso6" style={{ fontSize: '1.25rem', margin: '0.2rem 0' }}>Paso 6: Análisis de CV y Méritos</h2>
              <p className="seccion__descripcion" style={{ margin: 0 }}>
                Tu currículum vitae y certificados están siendo revisados y calificados por la comisión evaluadora mediante la rúbrica institucional (Formación, Experiencia, Habilidades y Presentación).
              </p>
            </div>
            {esEvaluador && (
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

      {etapaAnalisisCv?.estado === 'APROBADA' && (
        <section aria-labelledby="titulo-paso6-aprobado" className="tarjeta" style={{ marginTop: '1.5rem', borderLeft: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="insignia insignia--exito" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>✓ Análisis de CV Aprobado</span>
              <h2 id="titulo-paso6-aprobado" style={{ fontSize: '1.25rem', margin: '0.2rem 0' }}>Paso 6: Análisis de CV (Calificado)</h2>
              <p className="seccion__descripcion" style={{ margin: 0 }}>
                El expediente y currículum han sido evaluados y aprobados con la rúbrica institucional.
              </p>
            </div>
            {esEvaluador && (
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
      {etapaEntrevista?.estado === 'PENDIENTE' && (
        <section aria-labelledby="titulo-paso7" className="tarjeta" style={{ marginTop: '1.5rem', borderLeft: '4px solid var(--primario)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="insignia insignia--primario" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>🎤 Entrevista en Curso</span>
              <h2 id="titulo-paso7" style={{ fontSize: '1.25rem', margin: '0.2rem 0' }}>Paso 7: Entrevista Personal</h2>
              <p className="seccion__descripcion" style={{ margin: 0 }}>
                El postulante ha sido convocado ante el tribunal de entrevistas para evaluar su dominio técnico, comunicación, motivación y resolución de casos.
              </p>
            </div>
            {esEvaluador && (
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

      {etapaEntrevista?.estado === 'APROBADA' && (
        <section aria-labelledby="titulo-paso7-aprobado" className="tarjeta" style={{ marginTop: '1.5rem', borderLeft: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="insignia insignia--exito" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>✓ Entrevista Aprobada</span>
              <h2 id="titulo-paso7-aprobado" style={{ fontSize: '1.25rem', margin: '0.2rem 0' }}>Paso 7: Entrevista Personal (Calificada)</h2>
              <p className="seccion__descripcion" style={{ margin: 0 }}>
                La entrevista personal ha sido evaluada y aprobada satisfactoriamente con la rúbrica institucional.
              </p>
            </div>
            {esEvaluador && (
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

      {/* Bloque 7: Paso 8 - Selección */}
      {etapaSeleccion?.estado === 'PENDIENTE' && (
        <section aria-labelledby="titulo-paso8-pendiente" className="tarjeta" style={{ marginTop: '1.5rem', borderLeft: '4px solid #eab308' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="insignia insignia--advertencia" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>⏳ En Proceso de Selección Final</span>
              <h2 id="titulo-paso8-pendiente" style={{ fontSize: '1.25rem', margin: '0.2rem 0' }}>Paso 8: Selección Final y Adjudicación</h2>
              <p className="seccion__descripcion" style={{ margin: 0 }}>
                Se están consolidando las ponderaciones de todas las etapas para conformar el Cuadro de Honor y adjudicar las plazas institucionales.
              </p>
            </div>
            <button
              type="button"
              className="boton boton--primario"
              onClick={() => setMostrarModalRanking(true)}
              style={{ whiteSpace: 'nowrap' }}
            >
              🏆 Ver Cuadro de Honor y Ranking
            </button>
          </div>
        </section>
      )}

      {etapaSeleccion?.estado === 'APROBADA' && (
        <section aria-labelledby="titulo-paso8" className="tarjeta" style={{ marginTop: '1.5rem', borderLeft: '4px solid #eab308', background: '#fefce8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="insignia insignia--exito" style={{ marginBottom: '0.5rem', display: 'inline-block', backgroundColor: '#eab308', color: '#713f12' }}>
                🏆 ¡Plaza Adjudicada!
              </span>
              <h2 id="titulo-paso8" style={{ fontSize: '1.35rem', margin: '0.2rem 0', color: '#713f12' }}>
                Paso 8: Selección y Adjudicación (Completada con Éxito)
              </h2>
              <p style={{ margin: '0.3rem 0', color: '#854d0e', fontSize: '0.92rem' }}>
                ¡Felicitaciones! Has superado todas las etapas del proceso de Talento Universitario con calificación de honor y obtenido la adjudicación del puesto.
              </p>
              {resultadoFinal && (
                <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ background: '#ffffff', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #fde047' }}>
                    <span style={{ fontSize: '0.78rem', color: '#854d0e', display: 'block' }}>Puntaje Total Ponderado</span>
                    <strong style={{ fontSize: '1.1rem', color: '#713f12' }}>{resultadoFinal.puntaje_total} / 100 pts</strong>
                  </div>
                  <div style={{ background: '#ffffff', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #fde047' }}>
                    <span style={{ fontSize: '0.78rem', color: '#854d0e', display: 'block' }}>Lugar en el Ranking</span>
                    <strong style={{ fontSize: '1.1rem', color: '#713f12' }}>#{resultadoFinal.posicion} (Terna de Honor)</strong>
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              className="boton boton--primario"
              onClick={() => setMostrarModalRanking(true)}
              style={{ whiteSpace: 'nowrap' }}
            >
              🏆 Ver Cuadro de Honor Oficial
            </button>
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
          esEvaluador={esEvaluador}
        />
      )}
    </div>
  )
}
