import { useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { iniciarSesionEnApi } from '../api/auth.js'
import Campo from '../componentes/Campo.jsx'
import { useSesion } from '../sesion/SesionContext.jsx'
import { esAdmin, inicioDe } from '../utilidades/roles.js'

const VACIO = { correo: '', password: '' }

function IconoOjo({ tachado }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {tachado ? (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
          <path d="M9.88 5.09A10.9 10.9 0 0 1 12 4.5c5.25 0 9.27 3.94 10.5 7.5a11.6 11.6 0 0 1-2.12 3.38" />
          <path d="M6.11 6.11A11.8 11.8 0 0 0 1.5 12c1.23 3.56 5.25 7.5 10.5 7.5 1.61 0 3.13-.36 4.5-1" />
        </>
      ) : (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  )
}

/** Vuelve a la página pedida si es interna y el rol puede verla; si no, a la de inicio del rol. */
function destinoPara(usuario, ruta) {
  const interna = typeof ruta === 'string' && ruta.startsWith('/') && !ruta.startsWith('//')

  if (!interna || (ruta.startsWith('/panel') && !esAdmin(usuario))) {
    return inicioDe(usuario)
  }

  return ruta
}

export default function IniciarSesion() {
  const { usuario, cargando, iniciarSesion } = useSesion()
  const navegar = useNavigate()
  const { state } = useLocation()
  const [datos, setDatos] = useState(VACIO)
  const [errores, setErrores] = useState({})
  const [mensajeGeneral, setMensajeGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [verPassword, setVerPassword] = useState(false)
  const avisoRef = useRef(null)

  if (cargando) {
    return <p className="contenedor seccion">Cargando tu cuenta…</p>
  }

  if (usuario && !enviando) {
    return <Navigate to={destinoPara(usuario, state?.desde)} replace />
  }

  function cambiar(evento) {
    const { name, value } = evento.target

    setDatos({ ...datos, [name]: value })
    setMensajeGeneral('')

    if (errores[name]) {
      setErrores({ ...errores, [name]: undefined })
    }
  }

  function mostrarErrores(nuevosErrores, mensaje) {
    setErrores(nuevosErrores)
    setMensajeGeneral(mensaje)
    requestAnimationFrame(() => avisoRef.current?.focus())
  }

  async function enviar(evento) {
    evento.preventDefault()
    setEnviando(true)

    try {
      const sesion = await iniciarSesionEnApi({
        correo: datos.correo,
        password: datos.password,
        dispositivo: 'navegador',
      })
      iniciarSesion(sesion)
      navegar(destinoPara(sesion.usuario, state?.desde), { replace: true })
    } catch (error) {
      const porCampo = error.erroresPorCampo ?? {}
      const tieneCampos = Object.keys(porCampo).some((campo) => campo !== 'general')
      const esCredencial = porCampo.correo === error.message && !porCampo.password

      mostrarErrores(
        esCredencial ? {} : porCampo,
        esCredencial || !tieneCampos ? error.message : 'Revisa los campos marcados.',
      )
      setEnviando(false)
    }
  }

  const control = (nombre) => ({ name: nombre, value: datos[nombre], onChange: cambiar })

  return (
    <div className="acceso">
      <section className="acceso__presentacion">
        <p className="portada__antetitulo">Bolsa de talento para egresados</p>
        <h1>Entra a tu cuenta</h1>
        <p className="acceso__texto">
          Usa el correo con el que te registraste para volver a tu perfil y a las convocatorias de tu carrera.
        </p>
      </section>

      <form className="acceso__tarjeta" onSubmit={enviar} noValidate aria-busy={enviando || undefined}>
        <h2>Iniciar sesión</h2>

        {mensajeGeneral && (
          <div ref={avisoRef} tabIndex={-1} className="aviso aviso--error" role="alert">
            <p>{mensajeGeneral}</p>
          </div>
        )}

        <Campo etiqueta="Correo electrónico" error={errores.correo}>
          {(a11y) => (
            <input
              {...a11y}
              {...control('correo')}
              type="email"
              autoComplete="email"
              autoFocus
              maxLength={190}
            />
          )}
        </Campo>

        <Campo etiqueta="Contraseña" error={errores.password}>
          {(a11y) => (
            <div className="campo-secreto">
              <input
                {...a11y}
                {...control('password')}
                type={verPassword ? 'text' : 'password'}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="campo-secreto__ver"
                aria-pressed={verPassword}
                aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setVerPassword((visible) => !visible)}
              >
                <IconoOjo tachado={verPassword} />
              </button>
            </div>
          )}
        </Campo>

        <button type="submit" className="boton acceso__entrar" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Iniciar sesión'}
        </button>

        <p className="acceso__pie">
          ¿Aún no tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>
      </form>
    </div>
  )
}
