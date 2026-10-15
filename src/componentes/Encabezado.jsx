import { Link, NavLink, useNavigate } from 'react-router'
import { useSesion } from '../sesion/SesionContext.jsx'

export default function Encabezado() {
  const { usuario, cerrarSesion } = useSesion()
  const navegar = useNavigate()

  async function salir() {
    await cerrarSesion()
    navegar('/')
  }

  return (
    <header className="encabezado">
      <div className="contenedor encabezado__fila">
        <Link to="/" className="marca">
          <span className="marca__simbolo" aria-hidden="true">T</span>
          Talento
        </Link>

        <nav className="encabezado__nav" aria-label="Principal">
          <NavLink to="/" end className="enlace-nav">Inicio</NavLink>

          {usuario ? (
            <>
              <NavLink to="/mi-cuenta" className="enlace-nav">{usuario.persona?.nombres ?? usuario.correo}</NavLink>
              <button type="button" className="boton boton--secundario boton--chico" onClick={salir}>Salir</button>
            </>
          ) : (
            <Link to="/registro" className="boton boton--chico">Registrarme</Link>
          )}
        </nav>
      </div>
    </header>
  )
}
