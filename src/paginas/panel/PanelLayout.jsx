import { Briefcase, Building2, ChartColumn, ClipboardList, FileQuestion, FileText, GraduationCap, Landmark, Shield, Users } from 'lucide-react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router'
import { useSesion } from '../../sesion/SesionContext.jsx'
import { inicioDe, puedeEntrarAlPanel, primeraSeccionPanel, SECCIONES_PANEL, tienePermiso } from '../../utilidades/roles.js'

const ICONOS = {
  '/panel/facultades': <Building2 size={20} aria-hidden="true" />,
  '/panel/carreras': <GraduationCap size={20} aria-hidden="true" />,
  '/panel/convocatorias': <Briefcase size={20} aria-hidden="true" />,
  '/panel/preguntas': <FileQuestion size={20} aria-hidden="true" />,
  '/panel/solicitudes-empresa': <Landmark size={20} aria-hidden="true" />,
  '/panel/postulaciones': <FileText size={20} aria-hidden="true" />,
  '/panel/usuarios': <Users size={20} aria-hidden="true" />,
  '/panel/roles-permisos': <Shield size={20} aria-hidden="true" />,
  '/panel/bitacora': <ClipboardList size={20} aria-hidden="true" />,
  '/panel/estadisticas': <ChartColumn size={20} aria-hidden="true" />,
}

export function InicioPanel() {
  const { usuario } = useSesion()
  const destino = primeraSeccionPanel(usuario)

  if (!destino) {
    return (
      <p className="seccion__descripcion">
        Tu rol puede entrar al panel, pero todavía no tiene ninguna pantalla asignada.
      </p>
    )
  }

  return <Navigate to={destino.ruta} replace />
}

export default function PanelLayout() {
  const { usuario, cargando } = useSesion()
  const { pathname } = useLocation()

  if (cargando) {
    return <p className="contenedor seccion">Cargando tu cuenta…</p>
  }

  if (!usuario) {
    return <Navigate to="/iniciar-sesion" replace state={{ desde: pathname }} />
  }

  if (!puedeEntrarAlPanel(usuario)) {
    return <Navigate to={inicioDe(usuario)} replace />
  }

  const secciones = SECCIONES_PANEL.filter((seccion) => tienePermiso(usuario, seccion.permiso))
  const seccionActual = SECCIONES_PANEL.find(
    (seccion) => pathname === seccion.ruta || pathname.startsWith(`${seccion.ruta}/`),
  )

  if (seccionActual && !tienePermiso(usuario, seccionActual.permiso)) {
    return <Navigate to="/panel" replace />
  }

  return (
    <div className="panel">
      <aside className="panel__lateral" aria-label="Administración">
        <p className="panel__lateral-titulo">Administración</p>
        <nav className="panel__menu">
          {secciones.map((seccion) => (
            <NavLink key={seccion.ruta} to={seccion.ruta} className="panel__enlace">
              {ICONOS[seccion.ruta]}
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
