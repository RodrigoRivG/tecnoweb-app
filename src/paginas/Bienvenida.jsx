import { useState } from 'react'
import { Link } from 'react-router'
import { obtenerConvocatorias, obtenerFacultades, obtenerPerfiles } from '../api/publico.js'
import { ErrorCarga, Esqueleto, Vacio } from '../componentes/Estado.jsx'
import { useSesion } from '../sesion/SesionContext.jsx'
import { formatearFecha, formatearPuntaje } from '../utilidades/formato.js'
import { esAdmin, inicioDe } from '../utilidades/roles.js'
import { useConsulta } from '../utilidades/useConsulta.js'

const PASOS = [
  { titulo: 'Crea tu cuenta', texto: 'Regístrate con tus datos personales y académicos, incluido tu PPA.' },
  { titulo: 'Postula', texto: 'Elige una convocatoria abierta de tu carrera. Solo se exige alcanzar el PPA mínimo.' },
  { titulo: 'Sube tus documentos', texto: 'Carga tu CV, cédula, fotografía e histórico académico para pasar a revisión.' },
]

export default function Bienvenida() {
  const { usuario } = useSesion()
  const [filtros, setFiltros] = useState({ facultad_id: '', carrera_id: '' })
  const [pagina, setPagina] = useState(1)
  const [soloTop, setSoloTop] = useState(false)

  const facultades = useConsulta(obtenerFacultades)
  const convocatorias = useConsulta(obtenerConvocatorias, filtros)
  const perfiles = useConsulta(obtenerPerfiles, { ...filtros, solo_top: soloTop, page: pagina })

  const carreras = (facultades.datos ?? [])
    .filter((facultad) => !filtros.facultad_id || String(facultad.id) === filtros.facultad_id)
    .flatMap((facultad) => facultad.carreras)

  function cambiarFacultad(evento) {
    const facultadId = evento.target.value
    const facultad = facultades.datos?.find((f) => String(f.id) === facultadId)
    const carreraSigue = !facultad || facultad.carreras.some((c) => String(c.id) === filtros.carrera_id)

    setFiltros({ facultad_id: facultadId, carrera_id: carreraSigue ? filtros.carrera_id : '' })
    setPagina(1)
  }

  function cambiarCarrera(evento) {
    setFiltros({ ...filtros, carrera_id: evento.target.value })
    setPagina(1)
  }

  return (
    <>
      <section className="portada">
        <div className="contenedor portada__contenido">
          <p className="portada__antetitulo">Bolsa de talento para egresados</p>
          <h1>Tu primer paso profesional empieza aquí</h1>
          <p className="portada__texto">
            Postula a las convocatorias de tu carrera, demuestra lo que sabes y conecta con las empresas que buscan
            nuevos profesionales.
          </p>
          <div className="portada__acciones">
            {usuario ? (
              <Link to={inicioDe(usuario)} className="boton">{esAdmin(usuario) ? 'Ir al panel' : 'Ir a mi cuenta'}</Link>
            ) : (
              <>
                <Link to="/registro" className="boton">Registrarme como egresado</Link>
                <Link to="/iniciar-sesion" className="boton boton--secundario">Iniciar sesión</Link>
              </>
            )}
            <a href="#convocatorias" className="boton boton--secundario">Ver convocatorias</a>
          </div>
        </div>
      </section>

      <section className="contenedor seccion" aria-labelledby="titulo-pasos">
        <h2 id="titulo-pasos">Cómo funciona</h2>
        <ol className="pasos">
          {PASOS.map((paso, indice) => (
            <li key={paso.titulo} className="paso">
              <span className="paso__numero" aria-hidden="true">{indice + 1}</span>
              <h3>{paso.titulo}</h3>
              <p>{paso.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="contenedor">
        <form className="filtros" aria-label="Filtrar convocatorias y perfiles" onSubmit={(e) => e.preventDefault()}>
          <label className="filtros__campo">
            <span>Facultad</span>
            <select value={filtros.facultad_id} onChange={cambiarFacultad} disabled={!facultades.datos}>
              <option value="">Todas las facultades</option>
              {facultades.datos?.map((facultad) => (
                <option key={facultad.id} value={facultad.id}>{facultad.nombre}</option>
              ))}
            </select>
          </label>
          <label className="filtros__campo">
            <span>Carrera</span>
            <select value={filtros.carrera_id} onChange={cambiarCarrera} disabled={!facultades.datos}>
              <option value="">Todas las carreras</option>
              {carreras.map((carrera) => (
                <option key={carrera.id} value={carrera.id}>{carrera.nombre}</option>
              ))}
            </select>
          </label>
        </form>
        {facultades.error && <ErrorCarga error={facultades.error} onReintentar={facultades.reintentar} />}
      </div>

      <section id="convocatorias" className="contenedor seccion" aria-labelledby="titulo-convocatorias">
        <h2 id="titulo-convocatorias">Convocatorias abiertas</h2>

        {convocatorias.error && <ErrorCarga error={convocatorias.error} onReintentar={convocatorias.reintentar} />}

        {convocatorias.datos === null && !convocatorias.error && <Esqueleto />}

        {convocatorias.datos?.length === 0 && (
          <Vacio titulo="No hay convocatorias abiertas con estos filtros">Vuelve pronto o prueba con otra carrera.</Vacio>
        )}

        {convocatorias.datos?.length > 0 && (
          <ul className={`rejilla ${convocatorias.cargando ? 'actualizando' : ''}`}>
            {convocatorias.datos.map((convocatoria) => (
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
                    <dt>Postulación</dt>
                    <dd>
                      {convocatoria.fecha_cierre
                        ? `Hasta el ${formatearFecha(convocatoria.fecha_cierre)}`
                        : `Desde el ${formatearFecha(convocatoria.fecha_apertura)}`}
                    </dd>
                  </div>
                </dl>

                <div className="convocatoria__pie">
                  <span className="insignia">PPA mínimo {formatearPuntaje(convocatoria.ppa_minimo)}</span>
                  {!usuario && (
                    <Link to={`/registro?carrera=${convocatoria.carrera.id}`} className="enlace-accion">Postular</Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="contenedor seccion" aria-labelledby="titulo-perfiles">
        <div className="seccion__cabecera">
          <h2 id="titulo-perfiles">Perfiles destacados</h2>
          <label className="interruptor">
            <input
              type="checkbox"
              checked={soloTop}
              onChange={(e) => {
                setSoloTop(e.target.checked)
                setPagina(1)
              }}
            />
            Solo los mejores de cada convocatoria
          </label>
        </div>
        <p className="seccion__descripcion">
          Candidatos que completaron el proceso y aceptaron publicar su perfil. Se muestran con un código para proteger
          su identidad.
        </p>

        {perfiles.error && <ErrorCarga error={perfiles.error} onReintentar={perfiles.reintentar} />}

        {perfiles.datos === null && !perfiles.error && <Esqueleto cantidad={2} />}

        {perfiles.datos?.data.length === 0 && (
          <Vacio titulo="Aún no hay perfiles publicados">
            Los perfiles aparecen aquí cuando se publican los resultados de una convocatoria.
          </Vacio>
        )}

        {perfiles.datos?.data.length > 0 && (
          <>
            <div className={`tabla-envoltura ${perfiles.cargando ? 'actualizando' : ''}`}>
              <table className="tabla">
                <thead>
                  <tr>
                    <th scope="col">Candidato</th>
                    <th scope="col">Carrera</th>
                    <th scope="col">Egreso</th>
                    <th scope="col" className="numero">Posición</th>
                    <th scope="col" className="numero">Puntaje</th>
                  </tr>
                </thead>
                <tbody>
                  {perfiles.datos.data.map((perfil) => (
                    <tr key={`${perfil.codigo_candidato}-${perfil.gestion}`}>
                      <td>
                        <span className="codigo">{perfil.codigo_candidato}</span>
                        {perfil.es_top && <span className="insignia insignia--top">Top</span>}
                      </td>
                      <td>
                        {perfil.carrera}
                        <span className="tabla__secundario">{perfil.facultad}</span>
                      </td>
                      <td>{perfil.anio_egreso}</td>
                      <td className="numero">{perfil.posicion}</td>
                      <td className="numero">{formatearPuntaje(perfil.puntaje_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {perfiles.datos.meta.last_page > 1 && (
              <nav className="paginacion" aria-label="Páginas de perfiles">
                <button
                  type="button"
                  className="boton boton--secundario boton--chico"
                  disabled={pagina <= 1}
                  onClick={() => setPagina(pagina - 1)}
                >
                  Anterior
                </button>
                <span>Página {perfiles.datos.meta.current_page} de {perfiles.datos.meta.last_page}</span>
                <button
                  type="button"
                  className="boton boton--secundario boton--chico"
                  disabled={pagina >= perfiles.datos.meta.last_page}
                  onClick={() => setPagina(pagina + 1)}
                >
                  Siguiente
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </>
  )
}
