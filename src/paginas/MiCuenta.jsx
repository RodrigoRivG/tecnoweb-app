import { Link, Navigate, useLocation } from 'react-router'
import { useSesion } from '../sesion/SesionContext.jsx'
import { formatearPuntaje } from '../utilidades/formato.js'

export default function MiCuenta() {
  const { usuario, cargando } = useSesion()
  const { state } = useLocation()

  if (cargando) {
    return <p className="contenedor seccion">Cargando tu cuenta…</p>
  }

  if (!usuario) {
    return <Navigate to="/iniciar-sesion" replace state={{ desde: '/mi-cuenta' }} />
  }

  const persona = usuario.persona
  const nombreCompleto = [persona?.nombres, persona?.apellido_paterno, persona?.apellido_materno].filter(Boolean).join(' ')

  return (
    <div className="contenedor contenedor--angosto seccion">
      {state?.recienRegistrado && (
        <div className="aviso aviso--exito" role="status">
          <p>¡Tu cuenta está lista! Ya puedes postular a las convocatorias de tu carrera.</p>
        </div>
      )}

      <h1 className="titulo-pagina">Hola, {persona?.nombres ?? usuario.correo}</h1>
      {nombreCompleto && <p className="seccion__descripcion">{nombreCompleto} · {usuario.correo}</p>}

      {persona?.egresados?.map((egresado) => (
        <section key={egresado.id} className="tarjeta perfil-academico" aria-label="Perfil académico">
          <p className="convocatoria__facultad">{egresado.facultad.nombre}</p>
          <h2>{egresado.carrera.nombre}</h2>
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
              <dt>PPA</dt>
              <dd>{formatearPuntaje(egresado.ppa)}</dd>
            </div>
            <div>
              <dt>Área de preferencia</dt>
              <dd>{egresado.area_preferencia?.nombre ?? 'Sin preferencia'}</dd>
            </div>
          </dl>
        </section>
      ))}

      <p className="seccion__descripcion">
        Revisa las convocatorias abiertas de tu carrera en la <Link to="/">página principal</Link>.
      </p>
    </div>
  )
}
