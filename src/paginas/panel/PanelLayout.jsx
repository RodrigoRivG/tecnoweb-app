import { Navigate, NavLink, Outlet, useLocation } from 'react-router'
import { useSesion } from '../../sesion/SesionContext.jsx'
import { esAdmin } from '../../utilidades/roles.js'

function Icono({ children }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

const SECCIONES = [
  {
    ruta: '/panel/facultades',
    titulo: 'Facultades',
    icono: (
      <Icono>
        <path d="M3 10l9-6 9 6" />
        <path d="M5 10v9h14v-9" />
        <path d="M9 19v-5h6v5" />
      </Icono>
    ),
  },
  {
    ruta: '/panel/carreras',
    titulo: 'Carreras',
    icono: (
      <Icono>
        <path d="M2 9l10-5 10 5-10 5-10-5z" />
        <path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
      </Icono>
    ),
  },
  {
    ruta: '/panel/usuarios',
    titulo: 'Usuarios',
    icono: (
      <Icono>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
        <path d="M16 4.5a3.5 3.5 0 0 1 0 7" />
        <path d="M18 14c2.2.6 3.5 2.8 3.5 6" />
      </Icono>
    ),
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
        <p className="panel__nota">Datos de ejemplo, sin conexión al servidor.</p>
      </aside>

      <section className="panel__contenido">
        <Outlet />
      </section>
    </div>
  )
}
