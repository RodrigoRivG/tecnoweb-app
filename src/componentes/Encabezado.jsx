import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LogOut, UserRound } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router'
import { useSesion } from '../sesion/SesionContext.jsx'
import { esEmpresa, inicioDe, puedeEntrarAlPanel } from '../utilidades/roles.js'
import AjustesApariencia from './AjustesApariencia.jsx'

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
  const menuCuenta = useRef(null)

  useEffect(() => {
    if (!abierto) {
      return undefined
    }

    function alPresionar(evento) {
      if (evento.key === 'Escape' && !menuCuenta.current?.matches(':popover-open')) {
        setAbierto(false)
      }
    }

    document.addEventListener('keydown', alPresionar)

    return () => document.removeEventListener('keydown', alPresionar)
  }, [abierto])

  function cerrarMenus() {
    menuCuenta.current?.hidePopover()
    setAbierto(false)
  }

  function cerrarAlNavegar(evento) {
    if (evento.target.closest('a')) {
      cerrarMenus()
    }
  }

  async function salir() {
    cerrarMenus()
    await cerrarSesion()
    navegar('/')
  }

  const nombre = usuario ? usuario.persona?.nombres ?? usuario.correo : ''
  const rol = usuario?.rol?.nombre ?? usuario?.rol?.codigo
  const tienePanel = puedeEntrarAlPanel(usuario)
  const tieneEmpresa = esEmpresa(usuario)

  return (
    <header className={`encabezado ${abierto ? 'encabezado--abierto' : ''}`}>
      <div className="contenedor encabezado__fila">
        <Link to="/" className="marca" onClick={cerrarMenus}>
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
            {tienePanel && <NavLink to="/panel" className="enlace-nav">Panel</NavLink>}
            {tieneEmpresa && <NavLink to="/empresa" className="enlace-nav">Mi empresa</NavLink>}
            {!usuario && <NavLink to="/empresa/registro" className="enlace-nav">Empresas</NavLink>}
          </div>

          <div className="encabezado__cuenta">
            {usuario ? (
              <>
                <button
                  type="button"
                  className="enlace-nav enlace-nav--usuario"
                  popoverTarget="menu-cuenta"
                  aria-haspopup="dialog"
                  aria-label={`Opciones de cuenta de ${nombre}`}
                >
                  <span className="avatar" aria-hidden="true">{iniciales(nombre)}</span>
                  <ChevronDown className="enlace-nav__indicador" size={16} aria-hidden="true" />
                </button>

                <div id="menu-cuenta" ref={menuCuenta} className="menu-cuenta" popover="auto" role="dialog" aria-label="Cuenta">
                  <div className="menu-cuenta__identidad">
                    <strong>{nombre}</strong>
                    {nombre !== usuario.correo && <p>{usuario.correo}</p>}
                    {rol && <p>{rol}</p>}
                  </div>

                  {!tienePanel && !tieneEmpresa && (
                    <Link to={inicioDe(usuario)} className="menu-cuenta__accion">
                      <UserRound size={18} aria-hidden="true" />
                      Mi cuenta
                    </Link>
                  )}

                  <button type="button" className="menu-cuenta__accion" onClick={salir}>
                    <LogOut size={18} aria-hidden="true" />
                    Cerrar sesión
                  </button>
                </div>
              </>
            ) : (
              <>
                <NavLink to="/iniciar-sesion" className="enlace-nav">Iniciar sesión</NavLink>
                <Link to="/registro" className="boton-nav">Registrarme</Link>
              </>
            )}
          </div>
        </nav>

        <AjustesApariencia />
      </div>
    </header>
  )
}
