import { useState } from 'react'
import { Link } from 'react-router'
import { aprobarSolicitudEmpresa, obtenerSolicitudesEmpresaAdmin } from '../../api/empresa.js'
import { ErrorCarga, Esqueleto, Vacio } from '../../componentes/Estado.jsx'
import { useConsulta } from '../../utilidades/useConsulta.js'

export default function SolicitudesEmpresa() {
  const consulta = useConsulta(obtenerSolicitudesEmpresaAdmin)
  const [aprobando, setAprobando] = useState(null)
  const [aprobada, setAprobada] = useState(null)
  const [aviso, setAviso] = useState('')

  async function aprobar(procesoId) {
    setAprobando(procesoId)
    setAviso('')
    try {
      const data = await aprobarSolicitudEmpresa(procesoId)
      setAprobada(data)
      consulta.reintentar()
    } catch (error) {
      setAviso(error.message || 'No se pudo aprobar la solicitud.')
    } finally {
      setAprobando(null)
    }
  }

  if (consulta.error) return <ErrorCarga error={consulta.error} onReintentar={consulta.reintentar} />

  const solicitudes = consulta.datos ?? []

  return (
    <div>
      <header className="panel__herramientas">
        <div>
          <h1>Solicitudes de empresa</h1>
          <p className="panel__descripcion">Las empresas cargan su puesto y su lista. Al aprobar, se crean los accesos de los candidatos.</p>
        </div>
      </header>

      {aviso && <p className="aviso aviso--error" role="alert">{aviso}</p>}
      {consulta.cargando && !consulta.datos && <Esqueleto cantidad={3} />}
      {consulta.datos && solicitudes.length === 0 && <Vacio titulo="No hay solicitudes de empresa" />}

      <div className="rejilla">
        {solicitudes.map((solicitud) => (
          <article key={solicitud.proceso_id} className="tarjeta">
            <p className="banco__codigo">{solicitud.codigo} · {solicitud.estado}</p>
            <h2>{solicitud.puesto.cargo}</h2>
            <p>{solicitud.empresa.razon_social} · NIT {solicitud.empresa.nit}</p>
            <p>Contacto: {solicitud.contacto.nombre} · {solicitud.contacto.correo}</p>
            <p>{solicitud.puesto.carrera} · {solicitud.puesto.vacantes} vacantes</p>
            <p>{solicitud.puesto.funciones}</p>
            <ul>
              {solicitud.candidatos.map((candidato) => (
                <li key={candidato.correo}>{candidato.nombres} {candidato.apellidos} · {candidato.ci} · {candidato.correo}</li>
              ))}
            </ul>
            {solicitud.estado === 'PENDIENTE_APROBACION' && (
              <button type="button" className="boton" disabled={aprobando === solicitud.proceso_id} onClick={() => aprobar(solicitud.proceso_id)}>
                {aprobando === solicitud.proceso_id ? 'Aprobando…' : 'Aprobar y crear accesos'}
              </button>
            )}
            {solicitud.estado === 'EN_CURSO' && solicitud.accesos?.length > 0 && (
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Candidato</th>
                    <th>Correo</th>
                    <th>Clave temporal</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitud.accesos.map((acceso) => (
                    <tr key={acceso.postulacion_id}>
                      <td>{acceso.nombre}</td>
                      <td>{acceso.correo}</td>
                      <td><code>{acceso.clave_temporal}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {solicitud.estado === 'EN_CURSO' && (
              <Link to="/panel/postulaciones">Ver postulaciones para la entrevista</Link>
            )}
          </article>
        ))}
      </div>

      {aprobada?.accesos?.length > 0 && (
        <section className="tarjeta" style={{ marginTop: '1.5rem' }} aria-label="Accesos generados">
          <h2>Accesos de {aprobada.puesto.cargo}</h2>
          <table className="tabla">
            <thead>
              <tr>
                <th>Candidato</th>
                <th>Correo</th>
                <th>Clave temporal</th>
              </tr>
            </thead>
            <tbody>
              {aprobada.accesos.map((acceso) => (
                <tr key={acceso.postulacion_id}>
                  <td>{acceso.nombre}</td>
                  <td>{acceso.correo}</td>
                  <td><code>{acceso.clave_temporal}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
