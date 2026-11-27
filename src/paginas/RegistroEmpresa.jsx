import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { registrarSolicitudEmpresa } from '../api/empresa.js'
import Campo from '../componentes/Campo.jsx'
import PasosFormulario from '../componentes/PasosFormulario.jsx'
import { useSesion } from '../sesion/SesionContext.jsx'
import {
  validarCiExpedido,
  validarCiNumero,
  validarCorreosDistintos,
  validarFechaMayoria,
  FECHA_NACIMIENTO_MINIMA,
  validarNit,
  validarPassword,
  validarTelefonoBolivia,
} from '../utilidades/validacionCuenta.js'

const DEPARTAMENTOS = [
  ['LP', 'La Paz'],
  ['CB', 'Cochabamba'],
  ['SC', 'Santa Cruz'],
  ['OR', 'Oruro'],
  ['PT', 'Potosí'],
  ['CH', 'Chuquisaca'],
  ['TJ', 'Tarija'],
  ['BE', 'Beni'],
  ['PD', 'Pando'],
]

const PASOS = [
  { titulo: 'Acceso', descripcion: 'Correo y contraseña para el panel de empresa.' },
  { titulo: 'Empresa', descripcion: 'Razón social, NIT y datos de contacto institucional.' },
  { titulo: 'Representante', descripcion: 'Persona autorizada ante la consultora.' },
]

const CAMPOS_POR_PASO = [
  ['correo_contacto', 'password', 'password_confirmation'],
  ['razon_social', 'nit', 'correo_empresa', 'telefono'],
  ['nombres', 'apellido_paterno', 'ci_numero', 'ci_expedido', 'fecha_nacimiento'],
]

const ULTIMO_PASO = PASOS.length - 1

function pasoConErrores(erroresPorCampo) {
  for (let i = 0; i < CAMPOS_POR_PASO.length; i += 1) {
    if (CAMPOS_POR_PASO[i].some((campo) => erroresPorCampo[campo])) return i
  }
  return 0
}

function normalizarErroresApi(errores) {
  const plano = {}
  for (const [clave, mensajes] of Object.entries(errores ?? {})) {
    plano[clave] = Array.isArray(mensajes) ? mensajes[0] : mensajes
  }
  return plano
}

function validarPaso(paso, empresa) {
  const errores = {}

  if (paso === 0) {
    if (!empresa.correo_contacto?.trim()) errores.correo_contacto = 'Ingresa el correo de acceso.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(empresa.correo_contacto)) {
      errores.correo_contacto = 'Correo no válido.'
    }
    const pass = validarPassword(empresa.password)
    if (pass) errores.password = pass
    if (!empresa.password_confirmation) errores.password_confirmation = 'Repite la contraseña.'
    else if (empresa.password !== empresa.password_confirmation) {
      errores.password_confirmation = 'Las contraseñas no coinciden.'
    }
  }

  if (paso === 1) {
    if (!empresa.razon_social?.trim()) errores.razon_social = 'Ingresa la razón social.'
    const nit = validarNit(empresa.nit)
    if (nit) errores.nit = nit
    if (!empresa.correo_empresa?.trim()) errores.correo_empresa = 'Ingresa el correo de la empresa.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(empresa.correo_empresa)) {
      errores.correo_empresa = 'Correo no válido.'
    }
    const distinto = validarCorreosDistintos(empresa.correo_empresa, empresa.correo_contacto)
    if (distinto) errores.correo_empresa = distinto
    const tel = validarTelefonoBolivia(empresa.telefono)
    if (tel) errores.telefono = tel
  }

  if (paso === 2) {
    if (!empresa.nombres?.trim()) errores.nombres = 'Ingresa los nombres del representante.'
    if (!empresa.apellido_paterno?.trim()) errores.apellido_paterno = 'Ingresa el apellido.'
    const ci = validarCiNumero(empresa.ci_numero)
    if (ci) errores.ci_numero = ci
    const expedido = validarCiExpedido(empresa.ci_expedido)
    if (expedido) errores.ci_expedido = expedido
    const fecha = validarFechaMayoria(empresa.fecha_nacimiento)
    if (fecha) errores.fecha_nacimiento = fecha
  }

  return errores
}

function validarRegistroCompleto(empresa) {
  for (let indice = 0; indice <= ULTIMO_PASO; indice += 1) {
    const errores = validarPaso(indice, empresa)
    if (Object.keys(errores).length > 0) {
      return { paso: indice, errores }
    }
  }
  return null
}

export default function RegistroEmpresa() {
  const { usuario, cargando, iniciarSesion } = useSesion()
  const navegar = useNavigate()
  const avisoRef = useRef(null)

  const [mensajeGeneral, setMensajeGeneral] = useState('')
  const [errores, setErrores] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [paso, setPaso] = useState(0)
  const [empresa, setEmpresa] = useState({
    razon_social: '',
    nit: '',
    correo_empresa: '',
    telefono: '',
    nombres: '',
    apellido_paterno: '',
    ci_numero: '',
    ci_expedido: '',
    fecha_nacimiento: '',
    correo_contacto: '',
    password: '',
    password_confirmation: '',
  })

  const esUltimo = paso === ULTIMO_PASO

  function evitarEnterAccidental(evento) {
    if (evento.key !== 'Enter' || evento.target.tagName === 'TEXTAREA') return
    evento.preventDefault()
  }

  if (cargando) return <p className="contenedor seccion">Cargando tu cuenta…</p>
  if (usuario?.rol?.codigo === 'EMPRESA') return <Navigate to="/empresa" replace />

  function cambiarEmpresa(evento) {
    const { name, value } = evento.target
    setEmpresa((actual) => ({ ...actual, [name]: value }))
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: undefined }))
  }

  function errorDe(campo) {
    return errores[campo]
  }

  function mostrarErrores(nuevosErrores, mensaje) {
    setErrores(nuevosErrores)
    setMensajeGeneral(mensaje)
    requestAnimationFrame(() => avisoRef.current?.focus())
  }

  function irArriba() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function irAPaso(indice) {
    if (indice === paso) return
    if (indice < paso) {
      setMensajeGeneral('')
      setPaso(indice)
      irArriba()
      return
    }
    for (let i = paso; i < indice; i += 1) {
      const locales = validarPaso(i, empresa)
      if (Object.keys(locales).length > 0) {
        mostrarErrores(locales, 'Revisa los campos de este paso antes de continuar.')
        setPaso(i)
        irArriba()
        return
      }
    }
    setMensajeGeneral('')
    setErrores({})
    setPaso(indice)
    irArriba()
  }

  function atras() {
    irAPaso(Math.max(0, paso - 1))
  }

  function siguiente() {
    const locales = validarPaso(paso, empresa)
    if (Object.keys(locales).length > 0) {
      mostrarErrores(locales, 'Revisa los campos de este paso.')
      return
    }
    irAPaso(Math.min(PASOS.length - 1, paso + 1))
  }

  async function enviar(evento) {
    evento.preventDefault()
    const fallo = validarRegistroCompleto(empresa)
    if (fallo) {
      setPaso(fallo.paso)
      mostrarErrores(fallo.errores, 'Revisa los campos antes de enviar.')
      irArriba()
      return
    }

    setEnviando(true)
    setMensajeGeneral('')

    try {
      const sesion = await registrarSolicitudEmpresa({ ...empresa })
      iniciarSesion(sesion)
      const procesoId = sesion.proceso_id
      navegar('/empresa', { replace: true, state: { recienRegistrado: true, procesoId } })
    } catch (error) {
      const plano = normalizarErroresApi(error.errores ?? error.erroresPorCampo)
      const tieneCampos = Object.keys(plano).length > 0
      mostrarErrores(plano, tieneCampos ? 'Revisa los campos marcados.' : (error.message || 'No se pudo crear la cuenta.'))
      if (tieneCampos) setPaso(pasoConErrores(plano))
      setEnviando(false)
    }
  }

  const controlEmpresa = (nombre) => ({
    name: nombre,
    value: empresa[nombre],
    onChange: cambiarEmpresa,
  })

  return (
    <div className="contenedor contenedor--angosto seccion">
      <h1 className="titulo-pagina">Registro de empresa</h1>
      <p className="seccion__descripcion">
        Crea tu cuenta en {PASOS.length} pasos. Después pagarás el servicio y podrás definir el puesto y registrar a tus
        candidatos. Si ya tienes cuenta, <Link to="/iniciar-sesion">inicia sesión</Link>.
      </p>

      <PasosFormulario pasos={PASOS} pasoActual={paso} onIrAPaso={irAPaso} deshabilitado={enviando} />

      {mensajeGeneral && (
        <div ref={avisoRef} tabIndex={-1} className="aviso aviso--error" role="alert">
          <p>{mensajeGeneral}</p>
        </div>
      )}

      <form
        className="formulario"
        onSubmit={(e) => e.preventDefault()}
        onKeyDown={evitarEnterAccidental}
        noValidate
      >
        {paso === 0 && (
          <fieldset className="grupo">
            <legend>Datos de acceso</legend>
            <Campo etiqueta="Correo de acceso" error={errorDe('correo_contacto')} className="campo--ancho">
              {(a11y) => (
                <input {...a11y} {...controlEmpresa('correo_contacto')} type="email" autoComplete="email" maxLength={190} />
              )}
            </Campo>
            <Campo etiqueta="Contraseña" error={errorDe('password')} ayuda="Mínimo 8 caracteres, con letras y números.">
              {(a11y) => <input {...a11y} {...controlEmpresa('password')} type="password" autoComplete="new-password" />}
            </Campo>
            <Campo etiqueta="Repite la contraseña" error={errorDe('password_confirmation')}>
              {(a11y) => (
                <input
                  {...a11y}
                  {...controlEmpresa('password_confirmation')}
                  type="password"
                  autoComplete="new-password"
                />
              )}
            </Campo>
          </fieldset>
        )}

        {paso === 1 && (
          <fieldset className="grupo">
            <legend>Empresa</legend>
            <Campo etiqueta="Razón social" error={errorDe('razon_social')} className="campo--ancho">
              {(a11y) => <input {...a11y} {...controlEmpresa('razon_social')} maxLength={200} />}
            </Campo>
            <Campo etiqueta="NIT" error={errorDe('nit')} ayuda="Solo dígitos, entre 7 y 15.">
              {(a11y) => <input {...a11y} {...controlEmpresa('nit')} inputMode="numeric" maxLength={15} />}
            </Campo>
            <Campo etiqueta="Correo de la empresa" error={errorDe('correo_empresa')} className="campo--ancho">
              {(a11y) => <input {...a11y} {...controlEmpresa('correo_empresa')} type="email" maxLength={190} />}
            </Campo>
            <Campo etiqueta="Teléfono" opcional error={errorDe('telefono')} ayuda="7 u 8 dígitos (Bolivia).">
              {(a11y) => <input {...a11y} {...controlEmpresa('telefono')} type="tel" inputMode="numeric" maxLength={8} />}
            </Campo>
          </fieldset>
        )}

        {paso === 2 && (
          <fieldset className="grupo">
            <legend>Representante</legend>
            <p className="seccion__descripcion" style={{ marginTop: 0 }}>
              Completa los datos del representante. La cuenta se crea solo al pulsar <strong>Crear cuenta y pagar</strong>, no
              al avanzar desde el paso anterior.
            </p>
            <Campo etiqueta="Nombres" error={errorDe('nombres')} className="campo--ancho">
              {(a11y) => <input {...a11y} {...controlEmpresa('nombres')} autoComplete="given-name" maxLength={100} />}
            </Campo>
            <Campo etiqueta="Apellido" error={errorDe('apellido_paterno')}>
              {(a11y) => (
                <input {...a11y} {...controlEmpresa('apellido_paterno')} autoComplete="family-name" maxLength={60} />
              )}
            </Campo>
            <Campo etiqueta="Cédula de identidad" error={errorDe('ci_numero')}>
              {(a11y) => <input {...a11y} {...controlEmpresa('ci_numero')} inputMode="numeric" maxLength={15} />}
            </Campo>
            <Campo etiqueta="Expedido en" error={errorDe('ci_expedido')}>
              {(a11y) => (
                <select {...a11y} {...controlEmpresa('ci_expedido')}>
                  <option value="">Selecciona el departamento</option>
                  {DEPARTAMENTOS.map(([sigla, nombre]) => (
                    <option key={sigla} value={sigla}>
                      {nombre}
                    </option>
                  ))}
                </select>
              )}
            </Campo>
            <Campo etiqueta="Fecha de nacimiento" error={errorDe('fecha_nacimiento')}>
              {(a11y) => (
                <input
                  {...a11y}
                  {...controlEmpresa('fecha_nacimiento')}
                  type="date"
                  min={FECHA_NACIMIENTO_MINIMA}
                />
              )}
            </Campo>
          </fieldset>
        )}

        <div className="formulario__acciones formulario__acciones--registro">
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {paso > 0 ? (
              <button type="button" className="boton boton--secundario" onClick={atras} disabled={enviando}>
                ← Atrás
              </button>
            ) : null}
            <Link to="/" className="boton boton--secundario">
              Salir del registro
            </Link>
          </div>

          {esUltimo ? (
            <button type="button" className="boton" disabled={enviando} onClick={enviar}>
              {enviando ? 'Creando cuenta…' : 'Crear cuenta y pagar'}
            </button>
          ) : (
            <button type="button" className="boton" onClick={siguiente}>
              Siguiente →
            </button>
          )}
        </div>
      </form>
    </div>
  )
}