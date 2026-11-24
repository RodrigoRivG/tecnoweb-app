import { Link, Navigate } from 'react-router'
import { obtenerSolicitudesEmpresa } from '../api/empresa.js'
import { ErrorCarga, Esqueleto, Vacio } from '../componentes/Estado.jsx'
import { useSesion } from '../sesion/SesionContext.jsx'
import { useConsulta } from '../utilidades/useConsulta.js'

const ESTADOS = {
  PENDIENTE_APROBACION: 'Pendiente de aprobación',
  EN_CURSO: 'En curso',
}

export default function PanelEmpresa() {
  const { usuario, cargando } = useSesion()
  if (cargando) return <p className="contenedor seccion">Cargando tu cuenta…</p>
  if (!usuario) return <Navigate to="/iniciar-sesion" replace state={{ desde: '/empresa' }} />
  if (usuario.rol?.codigo !== 'EMPRESA') return <Navigate to="/" replace />
  return <ListaSolicitudes />
}

function ListaSolicitudes() {
  const consulta = useConsulta(obtenerSolicitudesEmpresa)
  const solicitudes = consulta.datos ?? []

  if (consulta.error) return <ErrorCarga error={consulta.error} onReintentar={consulta.reintentar} />

  return (
    <div className="contenedor seccion">
      <header className="seccion__cabecera">
        <div>
          <h1 className="titulo-pagina">Solicitudes de tu empresa</h1>
          <p className="seccion__descripcion">
            Cuando el administrador aprueba una solicitud, aquí aparecen los accesos para compartir con cada candidato y el informe de cada uno.
          </p>
        </div>
        <Link to="/empresa/registro" className="boton boton--secundario">Nueva solicitud</Link>
      </header>

      {consulta.cargando && !consulta.datos && <Esqueleto cantidad={2} />}
      {consulta.datos && solicitudes.length === 0 && <Vacio titulo="Todavía no enviaste una solicitud" />}

      <div className="rejilla">
        {solicitudes.map((solicitud) => (
          <article key={solicitud.proceso_id} className="tarjeta">
            <p className="banco__codigo">{solicitud.codigo}</p>
            <h2>{solicitud.puesto.cargo}</h2>
            <p>{solicitud.empresa.razon_social} · {ESTADOS[solicitud.estado] ?? solicitud.estado}</p>
            <p>{solicitud.puesto.carrera} · {solicitud.candidatos.length} candidatos</p>
            {solicitud.accesos?.length > 0 && (
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Candidato</th>
                    <th>Correo</th>
                    <th>Clave temporal</th>
                    <th>Informe</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitud.accesos.map((acceso) => (
                    <tr key={acceso.postulacion_id}>
                      <td>{acceso.nombre}</td>
                      <td>{acceso.correo}</td>
                      <td><code>{acceso.clave_temporal}</code></td>
                      <td><Link to={`/empresa/informes/${acceso.postulacion_id}`}>Ver informe</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
