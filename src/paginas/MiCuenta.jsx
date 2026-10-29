import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { obtenerConvocatoriasEgresado, obtenerMisPostulaciones, postularAConvocatoria } from '../api/egresado.js'
import { ErrorCarga, Esqueleto, Vacio } from '../componentes/Estado.jsx'
import { useSesion } from '../sesion/SesionContext.jsx'
import { formatearFecha, formatearPuntaje } from '../utilidades/formato.js'
import { useConsulta } from '../utilidades/useConsulta.js'

export default function MiCuenta() {
  const { usuario, cargando } = useSesion()
  const { state } = useLocation()

  const [postulandoId, setPostulandoId] = useState(null)
  const [avisoAccion, setAvisoAccion] = useState(null)

  const convocatoriasConsulta = useConsulta(obtenerConvocatoriasEgresado)
  const postulacionesConsulta = useConsulta(obtenerMisPostulaciones)

  if (cargando) {
    return <p className="contenedor seccion">Cargando tu cuenta…</p>
  }

  if (!usuario) {
    return <Navigate to="/iniciar-sesion" replace state={{ desde: '/mi-cuenta' }} />
  }

  const persona = usuario.persona
  const nombreCompleto = [persona?.nombres, persona?.apellido_paterno, persona?.apellido_materno].filter(Boolean).join(' ')
  const egresadoPrincipal = persona?.egresados?.[0]
  const egresadoPpa = egresadoPrincipal?.ppa

  async function manejarPostulacion(procesoId, nombreConvocatoria) {
    setPostulandoId(procesoId)
    setAvisoAccion(null)

    try {
      const nuevaPostulacion = await postularAConvocatoria(procesoId)
      setAvisoAccion({
        tipo: 'exito',
        mensaje: `¡Postulación exitosa a "${nombreConvocatoria}"! Se te ha asignado el código seudónimo: ${nuevaPostulacion.codigo}.`,
      })
      convocatoriasConsulta.reintentar()
      postulacionesConsulta.reintentar()
    } catch (error) {
      setAvisoAccion({
        tipo: 'error',
        mensaje: error.message || 'No se pudo completar la postulación.',
      })
    } finally {
      setPostulandoId(null)
    }
  }

  return (
    <div className="contenedor seccion">
      {state?.recienRegistrado && (
        <div className="aviso aviso--exito" role="status">
          <p>¡Tu cuenta está lista! Ya puedes postular a las convocatorias de tu carrera.</p>
        </div>
      )}

      {avisoAccion && (
        <div className={`aviso aviso--${avisoAccion.tipo}`} role="alert">
          <p>{avisoAccion.mensaje}</p>
        </div>
      )}

      <header className="seccion__cabecera" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="titulo-pagina">Hola, {persona?.nombres ?? usuario.correo}</h1>
          {nombreCompleto && <p className="seccion__descripcion">{nombreCompleto} · {usuario.correo}</p>}
        </div>
      </header>

      {/* Perfil académico del egresado */}
      {persona?.egresados?.map((egresado) => (
        <section key={egresado.id} className="tarjeta perfil-academico" aria-label="Perfil académico" style={{ marginBottom: '2rem' }}>
          <p className="convocatoria__facultad">{egresado.facultad.nombre}</p>
          <h2 style={{ fontSize: '1.25rem', margin: '0.25rem 0' }}>{egresado.carrera.nombre}</h2>
          <dl className="datos datos--columnas">
            <div>
              <dt>Registro universitario</dt>
              <dd>{egresado.registro_universitario}</dd>
            </div>
            <div>
              <dt>Año de egreso</dt>
              <dd>{egresado.anio_egreso}</dd>
            </div>
            <div>
              <dt>PPA Declarado</dt>
              <dd>
                <strong style={{ fontSize: '1.1rem', color: 'var(--primario)' }}>
                  {formatearPuntaje(egresado.ppa)}
                </strong>
              </dd>
            </div>
            <div>
              <dt>Área de preferencia</dt>
              <dd>{egresado.area_preferencia?.nombre ?? 'Sin preferencia'}</dd>
            </div>
          </dl>
        </section>
      ))}

      {/* PASO 2: Convocatorias abiertas y Filtro Eliminatorio de PPA */}
      <section className="seccion" aria-labelledby="titulo-convocatorias-abiertas">
        <div className="seccion__cabecera">
          <div>
            <h2 id="titulo-convocatorias-abiertas" style={{ fontSize: '1.4rem' }}>
              Paso 2: Convocatorias disponibles para tu carrera
            </h2>
            <p className="seccion__descripcion">
              Selecciona una convocatoria abierta. Para postular, el sistema aplica un <strong>filtro eliminatorio estricto</strong>:
              tu PPA debe ser igual o superior al mínimo exigido por la facultad.
            </p>
          </div>
        </div>

        {convocatoriasConsulta.error && (
          <ErrorCarga error={convocatoriasConsulta.error} onReintentar={convocatoriasConsulta.reintentar} />
        )}

        {convocatoriasConsulta.cargando && !convocatoriasConsulta.datos && <Esqueleto cantidad={2} />}

        {convocatoriasConsulta.datos?.length === 0 && (
          <Vacio titulo="No hay convocatorias abiertas para tu carrera en este momento">
            Revisa periódicamente o consulta en la <Link to="/">página principal</Link>.
          </Vacio>
        )}

        {convocatoriasConsulta.datos?.length > 0 && (
          <ul className="rejilla" style={{ marginTop: '1rem' }}>
            {convocatoriasConsulta.datos.map((convocatoria) => {
              const cumplePpa = convocatoria.cumple_ppa
              const yaPostulado = convocatoria.ya_postulado

              return (
                <li key={convocatoria.proceso_id} className="tarjeta convocatoria">
                  <p className="convocatoria__facultad">{convocatoria.facultad.nombre}</p>
                  <h3>{convocatoria.nombre}</h3>
                  <p className="convocatoria__carrera">{convocatoria.carrera.nombre}</p>

                  <dl className="datos">
                    <div>
                      <dt>Gestión</dt>
                      <dd>{convocatoria.gestion}{convocatoria.numero ? ` · N.º ${convocatoria.numero}` : ''}</dd>
                    </div>
                    <div>
                      <dt>Periodo de postulación</dt>
                      <dd>
                        {convocatoria.fecha_cierre
                          ? `Hasta el ${formatearFecha(convocatoria.fecha_cierre)}`
                          : `Desde el ${formatearFecha(convocatoria.fecha_apertura)}`}
                      </dd>
                    </div>
                  </dl>

                  {/* Comparativa del Filtro Eliminatorio de PPA */}
                  <div className={`filtro-ppa ${cumplePpa ? 'filtro-ppa--cumple' : 'filtro-ppa--rechazo'}`}>
                    <div className="filtro-ppa__comparacion">
                      <span>Mínimo exigido: {formatearPuntaje(convocatoria.ppa_minimo)}</span>
                      <span>Tu PPA: {formatearPuntaje(egresadoPpa)}</span>
                    </div>

                    {cumplePpa ? (
                      <p className="filtro-ppa__estado">
                        <span aria-hidden="true">✓</span> Calificas con el PPA mínimo exigido.
                      </p>
                    ) : (
                      <div className="filtro-ppa__estado" style={{ display: 'block' }}>
                        <p style={{ margin: 0, fontWeight: 600 }}>
                          ⛔ Tu PPA ({formatearPuntaje(egresadoPpa)}) no alcanza el mínimo de {formatearPuntaje(convocatoria.ppa_minimo)} exigido por la facultad.
                        </p>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', opacity: 0.9 }}>
                          Filtro eliminatorio: no cumples el requisito académico para postular a este proceso.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="convocatoria__pie">
                    {yaPostulado ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="insignia insignia--exito">✓ Postulado</span>
                        {convocatoria.postulacion_id && (
                          <Link to={`/postulaciones/${convocatoria.postulacion_id}`} className="boton boton--secundario boton--chico">
                            Ver documentos →
                          </Link>
                        )}
                      </div>
                    ) : cumplePpa ? (
                      <button
                        type="button"
                        className="boton"
                        disabled={postulandoId === convocatoria.proceso_id}
                        onClick={() => manejarPostulacion(convocatoria.proceso_id, convocatoria.nombre)}
                      >
                        {postulandoId === convocatoria.proceso_id ? 'Procesando postulación…' : 'Postularme a esta convocatoria'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="boton boton--secundario"
                        disabled
                        title="Tu PPA no alcanza el mínimo exigido por la facultad"
                      >
                        PPA insuficiente para postular
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Mis Postulaciones Activas */}
      {postulacionesConsulta.datos?.length > 0 && (
        <section className="seccion" aria-labelledby="titulo-mis-postulaciones" style={{ marginTop: '3rem' }}>
          <h2 id="titulo-mis-postulaciones" style={{ fontSize: '1.4rem' }}>
            Mis Postulaciones Activas
          </h2>
          <p className="seccion__descripcion">
            Procesos a los que ya te has postulado. El identificador mostrado es tu <strong>código seudónimo</strong> para proteger tu privacidad.
          </p>

          <div className="rejilla" style={{ marginTop: '1rem' }}>
            {postulacionesConsulta.datos.map((postulacion) => (
              <div key={postulacion.id} className="tarjeta postulacion-item">
                <div className="postulacion-item__cabecera">
                  <span className="codigo" style={{ fontSize: '1.1rem', color: 'var(--primario)' }}>
                    {postulacion.codigo}
                  </span>
                  <span className="insignia insignia--pendiente">
                    {postulacion.estado}
                  </span>
                </div>

                <h3 style={{ margin: '0.25rem 0' }}>{postulacion.convocatoria.nombre}</h3>
                <p className="convocatoria__carrera">{postulacion.convocatoria.carrera}</p>

                <p style={{ fontSize: '0.85rem', color: 'var(--texto-suave)', margin: 0 }}>
                  Postulación registrada el {formatearFecha(postulacion.creada_en)}
                </p>

                <div className="postulacion-item__etapas">
                  <span className="etapa-chip etapa-chip--aprobada">
                    ✓ 1. Inscripción
                  </span>
                  <span className="etapa-chip etapa-chip--aprobada">
                    ✓ 2. Evaluación Técnica (PPA)
                  </span>
                  <span className="etapa-chip etapa-chip--pendiente">
                    ⏳ 3. Requisitos Documentales
                  </span>
                </div>


                <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--borde)' }}>
                  <Link to={`/postulaciones/${postulacion.id}`} className="boton boton--secundario boton--chico" style={{ width: '100%' }}>
                    Subir y gestionar documentos →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
