import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { useSesion } from '../sesion/SesionContext.jsx'
import { esAdmin } from '../utilidades/roles.js'

function iniciales(texto) {
  return texto
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toLocaleUpperCase('es'))
    .join('')
}

export default function Encabezado() {
  const { usuario, cerrarSesion } = useSesion()
  const navegar = useNavigate()
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    if (!abierto) {
      return undefined
    }

    function alPresionar(evento) {
      if (evento.key === 'Escape') {
        setAbierto(false)
      }
    }

    document.addEventListener('keydown', alPresionar)

    return () => document.removeEventListener('keydown', alPresionar)
  }, [abierto])

  function cerrarAlNavegar(evento) {
    if (evento.target.closest('a')) {
      setAbierto(false)
    }
  }

  async function salir() {
    setAbierto(false)
    await cerrarSesion()
    navegar('/')
  }

  const nombre = usuario ? usuario.persona?.nombres ?? usuario.correo : ''
  const admin = esAdmin(usuario)

  return (
    <header className={`encabezado ${abierto ? 'encabezado--abierto' : ''}`}>
      <div className="contenedor encabezado__fila">
        <Link to="/" className="marca" onClick={() => setAbierto(false)}>
          <span className="marca__simbolo" aria-hidden="true">T</span>
          <span className="marca__texto">
            Talento
            <span className="marca__lema">Bolsa de egresados</span>
          </span>
        </Link>

        <button
          type="button"
          className="encabezado__menu"
          aria-expanded={abierto}
          aria-controls="navegacion-principal"
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setAbierto((valor) => !valor)}
        >
          <span className="encabezado__hamburguesa" aria-hidden="true" />
        </button>

        <nav id="navegacion-principal" className="encabezado__nav" aria-label="Principal" onClick={cerrarAlNavegar}>
          <div className="encabezado__enlaces">
            <NavLink to="/" end className="enlace-nav">Inicio</NavLink>
            {admin && <NavLink to="/panel" className="enlace-nav">Panel</NavLink>}
          </div>

          <div className="encabezado__cuenta">
            {usuario ? (
              <>
                <NavLink to={admin ? '/panel' : '/mi-cuenta'} end className="enlace-nav enlace-nav--usuario">
                  <span className="avatar" aria-hidden="true">{iniciales(nombre)}</span>
                  <span className="enlace-nav__nombre">{nombre}</span>
                </NavLink>
                <button type="button" className="boton-nav boton-nav--contorno" onClick={salir}>Salir</button>
              </>
            ) : (
              <>
                <NavLink to="/iniciar-sesion" className="enlace-nav">Iniciar sesión</NavLink>
                <Link to="/registro" className="boton-nav">Registrarme</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
