import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { descargarDocumentoPostulacion, obtenerDetallePostulacion, subirDocumentoPostulacion } from '../api/egresado.js'
import { ErrorCarga, Esqueleto } from '../componentes/Estado.jsx'
import { useSesion } from '../sesion/SesionContext.jsx'
import { formatearFecha, formatearTamano } from '../utilidades/formato.js'
import { useConsulta } from '../utilidades/useConsulta.js'

export default function DetallePostulacion() {
  const { id } = useParams()
  const { usuario, cargando: cargandoSesion } = useSesion()

  const [archivosSeleccionados, setArchivosSeleccionados] = useState({})
  const [subiendoTipo, setSubiendoTipo] = useState(null)
  const [reemplazandoTipo, setReemplazandoTipo] = useState({})
  const [aviso, setAviso] = useState(null)

  const consulta = useConsulta(() => obtenerDetallePostulacion(id), [id])

  if (cargandoSesion) {
    return <p className="contenedor seccion">Cargando…</p>
  }

  if (!usuario) {
    return <Navigate to="/iniciar-sesion" replace state={{ desde: `/postulaciones/${id}` }} />
  }

  if (consulta.error) {
    return (
      <div className="contenedor seccion">
        <p><Link to="/mi-cuenta">← Volver a mi cuenta</Link></p>
        <ErrorCarga error={consulta.error} onReintentar={consulta.reintentar} />
      </div>
    )
  }

  if (!consulta.datos) {
    return (
      <div className="contenedor seccion">
        <p><Link to="/mi-cuenta">← Volver a mi cuenta</Link></p>
        <Esqueleto cantidad={3} />
      </div>
    )
  }

  const postulacion = consulta.datos
  const convocatoria = postulacion.convocatoria

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

  return (
    <div className="contenedor seccion">
      <nav aria-label="Navegación secundaria" style={{ marginBottom: '1.25rem' }}>
        <Link to="/mi-cuenta" className="enlace-accion" style={{ fontSize: '0.95rem' }}>
          ← Volver a mi cuenta
        </Link>
      </nav>

      <header className="seccion__cabecera" style={{ marginBottom: '1.5rem' }}>
        <div>
          <p className="convocatoria__facultad">{convocatoria.facultad}</p>
          <h1 className="titulo-pagina" style={{ margin: '0.25rem 0' }}>
            Postulación <span className="codigo" style={{ color: 'var(--primario)' }}>{postulacion.codigo}</span>
          </h1>
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
            const esBloqueada = etapa.estado === 'BLOQUEADA'

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

        {postulacion.requisitos_completos ? (
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
                        ✓ {doc.estado === 'PENDIENTE' ? 'Cargado (Pendiente de revisión)' : doc.estado}
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
                      <button
                        type="button"
                        className="boton boton--secundario boton--chico"
                        onClick={() => setReemplazandoTipo({ ...reemplazandoTipo, [req.tipo_documento]: true })}
                      >
                        Reemplazar archivo
                      </button>
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
    </div>
  )
}
