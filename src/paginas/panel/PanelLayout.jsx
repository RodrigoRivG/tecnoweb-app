import { Building2, GraduationCap, Users } from 'lucide-react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router'
import { useSesion } from '../../sesion/SesionContext.jsx'
import { esAdmin } from '../../utilidades/roles.js'

const SECCIONES = [
  {
    ruta: '/panel/facultades',
    titulo: 'Facultades',
    icono: <Building2 size={20} aria-hidden="true" />,
  },
  {
    ruta: '/panel/carreras',
    titulo: 'Carreras',
    icono: <GraduationCap size={20} aria-hidden="true" />,
  },
  {
    ruta: '/panel/usuarios',
    titulo: 'Usuarios',
    icono: <Users size={20} aria-hidden="true" />,
  },
]

export default function PanelLayout() {
  const { usuario, cargando } = useSesion()
  const { pathname } = useLocation()

  if (cargando) {
    return <p className="contenedor seccion">Cargando tu cuenta…</p>
  }

  if (!usuario) {
    return <Navigate to="/iniciar-sesion" replace state={{ desde: pathname }} />
  }

  if (!esAdmin(usuario)) {
    return <Navigate to="/mi-cuenta" replace />
  }

  return (
    <div className="panel">
      <aside className="panel__lateral" aria-label="Administración">
        <p className="panel__lateral-titulo">Administración</p>
        <nav className="panel__menu">
          {SECCIONES.map((seccion) => (
            <NavLink key={seccion.ruta} to={seccion.ruta} className="panel__enlace">
              {seccion.icono}
              <span>{seccion.titulo}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <section className="panel__contenido">
        <Outlet />
      </section>
    </div>
  )
}
