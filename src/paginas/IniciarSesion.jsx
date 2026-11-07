import { useRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { iniciarSesionEnApi } from '../api/auth.js'
import Campo from '../componentes/Campo.jsx'
import { useSesion } from '../sesion/SesionContext.jsx'
import { esAdmin, inicioDe } from '../utilidades/roles.js'

const VACIO = { correo: '', password: '' }

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
                {verPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
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
