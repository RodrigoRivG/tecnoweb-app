import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { registrarEgresado } from '../api/auth.js'
import { obtenerFacultades } from '../api/publico.js'
import Campo from '../componentes/Campo.jsx'
import { ErrorCarga } from '../componentes/Estado.jsx'
import { useSesion } from '../sesion/SesionContext.jsx'
import { useConsulta } from '../utilidades/useConsulta.js'

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

const ANIO_ACTUAL = new Date().getFullYear()
const MAYORIA_EDAD = new Date(ANIO_ACTUAL - 18, new Date().getMonth(), new Date().getDate())
  .toISOString()
  .slice(0, 10)

const PASOS = [
  { titulo: 'Acceso', descripcion: 'Correo y contraseña para iniciar sesión.' },
  { titulo: 'Personales', descripcion: 'Identidad y datos de contacto.' },
  { titulo: 'Académicos', descripcion: 'Carrera, registro universitario y PPA.' },
  { titulo: 'Confirmar', descripcion: 'Consentimientos y creación de cuenta.' },
]

const CAMPOS_POR_PASO = [
  ['correo', 'password', 'password_confirmation'],
  ['nombres', 'apellido_paterno', 'apellido_materno', 'ci_numero', 'ci_complemento', 'ci_expedido', 'fecha_nacimiento', 'telefono'],
  ['carrera_id', 'area_preferencia_id', 'registro_universitario', 'anio_egreso', 'ppa'],
  ['acepta_tratamiento_datos', 'acepta_publicacion_perfil'],
]

const VACIO = {
  correo: '',
  password: '',
  password_confirmation: '',
  nombres: '',
  apellido_paterno: '',
  apellido_materno: '',
  ci_numero: '',
  ci_complemento: '',
  ci_expedido: '',
  fecha_nacimiento: '',
  telefono: '',
  carrera_id: '',
  area_preferencia_id: '',
  registro_universitario: '',
  anio_egreso: '',
  ppa: '',
  acepta_tratamiento_datos: false,
  acepta_publicacion_perfil: false,
}

/** Quita los opcionales vacíos y convierte los ids y el año a número. */
function armarCuerpo(datos) {
  const cuerpo = Object.fromEntries(Object.entries(datos).filter(([, valor]) => valor !== ''))

  for (const campo of ['carrera_id', 'area_preferencia_id', 'anio_egreso']) {
    if (cuerpo[campo] !== undefined) {
      cuerpo[campo] = Number(cuerpo[campo])
    }
  }

  return cuerpo
}

function validarPaso(paso, datos) {
  const errores = {}

  if (paso === 0) {
    if (!datos.correo?.trim()) errores.correo = 'Ingresa tu correo.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)) errores.correo = 'Correo no válido.'
    if (!datos.password) errores.password = 'Ingresa una contraseña.'
    else if (datos.password.length < 8 || !/[A-Za-z]/.test(datos.password) || !/\d/.test(datos.password)) {
      errores.password = 'Mínimo 8 caracteres, con letras y números.'
    }
    if (!datos.password_confirmation) errores.password_confirmation = 'Repite la contraseña.'
    else if (datos.password !== datos.password_confirmation) {
      errores.password_confirmation = 'Las contraseñas no coinciden.'
    }
  }

  if (paso === 1) {
    if (!datos.nombres?.trim()) errores.nombres = 'Ingresa tus nombres.'
  if (!datos.apellido_paterno?.trim() && !datos.apellido_materno?.trim()) {
      errores.apellido_paterno = 'Indica al menos un apellido.'
    }
    if (!datos.ci_numero?.trim()) errores.ci_numero = 'Ingresa tu cédula.'
    else if (!/^\d{4,15}$/.test(datos.ci_numero)) errores.ci_numero = 'Solo números (4 a 15 dígitos).'
    if (datos.ci_complemento && !/^[A-Z0-9]{0,3}$/i.test(datos.ci_complemento)) {
      errores.ci_complemento = 'Máximo 3 caracteres.'
    }
    if (!datos.fecha_nacimiento) errores.fecha_nacimiento = 'Indica tu fecha de nacimiento.'
    else if (datos.fecha_nacimiento > MAYORIA_EDAD) {
      errores.fecha_nacimiento = 'Debes ser mayor de 18 años.'
    }
  }

  if (paso === 2) {
    if (!datos.carrera_id) errores.carrera_id = 'Elige tu carrera.'
    if (!datos.registro_universitario?.trim()) errores.registro_universitario = 'Ingresa tu registro universitario.'
    if (!datos.anio_egreso) errores.anio_egreso = 'Indica el año de egreso.'
    else {
      const anio = Number(datos.anio_egreso)
      if (anio < 1950 || anio > ANIO_ACTUAL) errores.anio_egreso = `Entre 1950 y ${ANIO_ACTUAL}.`
    }
    if (datos.ppa === '' || datos.ppa === null) errores.ppa = 'Ingresa tu PPA.'
    else {
      const ppa = Number(datos.ppa)
      if (Number.isNaN(ppa) || ppa < 0 || ppa > 100) errores.ppa = 'De 0 a 100.'
    }
  }

  if (paso === 3 && !datos.acepta_tratamiento_datos) {
    errores.acepta_tratamiento_datos = 'Es obligatorio para registrarte.'
  }

  return errores
}

function pasoConErrores(erroresPorCampo) {
  for (let i = 0; i < CAMPOS_POR_PASO.length; i += 1) {
    if (CAMPOS_POR_PASO[i].some((campo) => erroresPorCampo[campo])) return i
  }

  return 0
}

export default function Registro() {
  const { usuario, iniciarSesion } = useSesion()
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const facultades = useConsulta(obtenerFacultades)
  const [datos, setDatos] = useState(() => ({ ...VACIO, carrera_id: parametros.get('carrera') ?? '' }))
  const [errores, setErrores] = useState({})
  const [mensajeGeneral, setMensajeGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [paso, setPaso] = useState(0)
  const avisoRef = useRef(null)
  const esUltimo = paso === PASOS.length - 1

  if (usuario && !enviando) {
    return <Navigate to="/mi-cuenta" replace />
  }

  const carreraElegida = facultades.datos
    ?.flatMap((facultad) => facultad.carreras)
    .find((carrera) => String(carrera.id) === datos.carrera_id)
  const areas = carreraElegida?.areas ?? []

  function cambiar(evento) {
    const { name, type, checked, value } = evento.target
    const siguiente = { ...datos, [name]: type === 'checkbox' ? checked : value }

    if (name === 'carrera_id') {
      siguiente.area_preferencia_id = ''
    }

    setDatos(siguiente)

    if (errores[name]) {
      setErrores({ ...errores, [name]: undefined })
    }
  }

  function mostrarErrores(nuevosErrores, mensaje) {
    setErrores(nuevosErrores)
    setMensajeGeneral(mensaje)
    requestAnimationFrame(() => avisoRef.current?.focus())
  }

  function irArriba() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function atras() {
    setMensajeGeneral('')
    setPaso((actual) => Math.max(0, actual - 1))
    irArriba()
  }

  function siguiente() {
    const locales = validarPaso(paso, datos)
    if (Object.keys(locales).length > 0) {
      mostrarErrores(locales, 'Revisa los campos de este paso.')

      return
    }

    setMensajeGeneral('')
    setErrores({})
    setPaso((actual) => Math.min(PASOS.length - 1, actual + 1))
    irArriba()
  }

  async function enviar(evento) {
    evento.preventDefault()

    const locales = validarPaso(3, datos)
    if (Object.keys(locales).length > 0) {
      mostrarErrores(locales, 'Revisa los consentimientos.')

      return
    }

    if (datos.password !== datos.password_confirmation) {
      mostrarErrores({ password_confirmation: 'Las contraseñas no coinciden.' }, 'Revisa los campos marcados.')
      setPaso(0)

      return
    }

    setEnviando(true)

    try {
      const sesion = await registrarEgresado(armarCuerpo(datos))
      iniciarSesion(sesion)
      navegar('/mi-cuenta', { replace: true, state: { recienRegistrado: true } })
    } catch (error) {
      const porCampo = error.erroresPorCampo ?? {}
      const tieneCampos = Object.keys(porCampo).some((campo) => campo !== 'general')

      mostrarErrores(porCampo, tieneCampos ? 'Revisa los campos marcados.' : error.message)
      if (tieneCampos) setPaso(pasoConErrores(porCampo))
      setEnviando(false)
    }
  }

  const control = (nombre) => ({ name: nombre, value: datos[nombre], onChange: cambiar })

  return (
    <div className="contenedor contenedor--angosto seccion">
      <h1 className="titulo-pagina">Registro de egresado</h1>
      <p className="seccion__descripcion">
        Completa el registro en {PASOS.length} pasos. Puedes volver atrás para corregir. Si ya tienes cuenta,{' '}
        <Link to="/iniciar-sesion">inicia sesión</Link>.
      </p>

      <ol className="registro-pasos" aria-label="Progreso del registro">
        {PASOS.map((item, indice) => {
          const estado =
            indice < paso ? 'registro-pasos__item--hecho' : indice === paso ? 'registro-pasos__item--activo' : ''

          return (
            <li key={item.titulo} className={`registro-pasos__item ${estado}`} aria-current={indice === paso ? 'step' : undefined}>
              <span className="registro-pasos__numero" aria-hidden>
                {indice < paso ? '✓' : indice + 1}
              </span>
              <span className="registro-pasos__titulo">{item.titulo}</span>
            </li>
          )
        })}
      </ol>

      <p className="registro-pasos__leyenda">
        Paso {paso + 1} de {PASOS.length}: <strong>{PASOS[paso].titulo}</strong> — {PASOS[paso].descripcion}
      </p>

      {mensajeGeneral && (
        <div ref={avisoRef} tabIndex={-1} className="aviso aviso--error" role="alert">
          <p>{mensajeGeneral}</p>
        </div>
      )}

      {facultades.error && <ErrorCarga error={facultades.error} onReintentar={facultades.reintentar} />}

      <form className="formulario" onSubmit={esUltimo ? enviar : (e) => e.preventDefault()} noValidate>
        {paso === 0 && (
          <fieldset className="grupo">
            <legend>Datos de acceso</legend>
            <Campo etiqueta="Correo electrónico" error={errores.correo} className="campo--ancho">
              {(a11y) => <input {...a11y} {...control('correo')} type="email" autoComplete="email" maxLength={190} />}
            </Campo>
            <Campo etiqueta="Contraseña" error={errores.password} ayuda="Mínimo 8 caracteres, con letras y números.">
              {(a11y) => <input {...a11y} {...control('password')} type="password" autoComplete="new-password" />}
            </Campo>
            <Campo etiqueta="Repite la contraseña" error={errores.password_confirmation}>
              {(a11y) => (
                <input {...a11y} {...control('password_confirmation')} type="password" autoComplete="new-password" />
              )}
            </Campo>
          </fieldset>
        )}

        {paso === 1 && (
          <fieldset className="grupo">
            <legend>Datos personales</legend>
            <Campo etiqueta="Nombres" error={errores.nombres} className="campo--ancho">
              {(a11y) => <input {...a11y} {...control('nombres')} autoComplete="given-name" maxLength={100} />}
            </Campo>
            <Campo etiqueta="Apellido paterno" error={errores.apellido_paterno} ayuda="Llena al menos un apellido.">
              {(a11y) => <input {...a11y} {...control('apellido_paterno')} autoComplete="family-name" maxLength={60} />}
            </Campo>
            <Campo etiqueta="Apellido materno" error={errores.apellido_materno}>
              {(a11y) => <input {...a11y} {...control('apellido_materno')} maxLength={60} />}
            </Campo>

            <div className="fila-ci">
              <Campo etiqueta="Cédula de identidad" error={errores.ci_numero}>
                {(a11y) => <input {...a11y} {...control('ci_numero')} inputMode="numeric" maxLength={15} />}
              </Campo>
              <Campo etiqueta="Complemento" error={errores.ci_complemento} opcional>
                {(a11y) => <input {...a11y} {...control('ci_complemento')} maxLength={3} className="mayusculas" />}
              </Campo>
              <Campo etiqueta="Expedido en" error={errores.ci_expedido} opcional>
                {(a11y) => (
                  <select {...a11y} {...control('ci_expedido')}>
                    <option value="">—</option>
                    {DEPARTAMENTOS.map(([codigo, nombre]) => (
                      <option key={codigo} value={codigo}>
                        {nombre}
                      </option>
                    ))}
                  </select>
                )}
              </Campo>
            </div>

            <Campo etiqueta="Fecha de nacimiento" error={errores.fecha_nacimiento}>
              {(a11y) => <input {...a11y} {...control('fecha_nacimiento')} type="date" autoComplete="bday" />}
            </Campo>
            <Campo etiqueta="Teléfono" error={errores.telefono} opcional>
              {(a11y) => <input {...a11y} {...control('telefono')} type="tel" autoComplete="tel" maxLength={20} />}
            </Campo>
          </fieldset>
        )}

        {paso === 2 && (
          <fieldset className="grupo">
            <legend>Datos académicos</legend>
            <Campo etiqueta="Carrera" error={errores.carrera_id} className="campo--ancho">
              {(a11y) => (
                <select {...a11y} {...control('carrera_id')} disabled={!facultades.datos}>
                  <option value="">{facultades.datos ? 'Elige tu carrera' : 'Cargando carreras…'}</option>
                  {facultades.datos?.map((facultad) => (
                    <optgroup key={facultad.id} label={facultad.nombre}>
                      {facultad.carreras.map((carrera) => (
                        <option key={carrera.id} value={carrera.id}>
                          {carrera.nombre}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              )}
            </Campo>
            {areas.length > 0 && (
              <Campo etiqueta="Área de preferencia" error={errores.area_preferencia_id} opcional className="campo--ancho">
                {(a11y) => (
                  <select {...a11y} {...control('area_preferencia_id')}>
                    <option value="">Sin preferencia</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.nombre}
                      </option>
                    ))}
                  </select>
                )}
              </Campo>
            )}
            <Campo etiqueta="Registro universitario" error={errores.registro_universitario}>
              {(a11y) => <input {...a11y} {...control('registro_universitario')} maxLength={20} />}
            </Campo>
            <Campo etiqueta="Año de egreso" error={errores.anio_egreso}>
              {(a11y) => (
                <input
                  {...a11y}
                  {...control('anio_egreso')}
                  type="number"
                  inputMode="numeric"
                  min={1950}
                  max={ANIO_ACTUAL}
                />
              )}
            </Campo>
            <Campo
              etiqueta="PPA (promedio ponderado acumulado)"
              error={errores.ppa}
              ayuda="De 0 a 100, con hasta dos decimales. Se verificará en la entrevista."
              className="campo--ancho"
            >
              {(a11y) => (
                <input {...a11y} {...control('ppa')} type="number" inputMode="decimal" min={0} max={100} step="0.01" />
              )}
            </Campo>
          </fieldset>
        )}

        {paso === 3 && (
          <fieldset className="grupo grupo--consentimientos">
            <legend>Consentimientos</legend>
            <p className="registro-resumen campo--ancho">
              Revisa antes de crear la cuenta: <strong>{datos.correo}</strong> · {datos.nombres}{' '}
              {datos.apellido_paterno} · {carreraElegida?.nombre ?? 'Carrera pendiente'}.
            </p>
            <label className={`casilla ${errores.acepta_tratamiento_datos ? 'casilla--error' : ''}`}>
              <input
                type="checkbox"
                name="acepta_tratamiento_datos"
                checked={datos.acepta_tratamiento_datos}
                onChange={cambiar}
                aria-invalid={errores.acepta_tratamiento_datos ? true : undefined}
              />
              <span>Acepto el tratamiento de mis datos personales para el proceso de selección.</span>
            </label>
            {errores.acepta_tratamiento_datos && <p className="campo__error">{errores.acepta_tratamiento_datos}</p>}

            <label className="casilla">
              <input
                type="checkbox"
                name="acepta_publicacion_perfil"
                checked={datos.acepta_publicacion_perfil}
                onChange={cambiar}
              />
              <span>
                Acepto que mi perfil se publique en la página principal con un código, sin mi nombre.
                <span className="campo__opcional"> (opcional)</span>
              </span>
            </label>
          </fieldset>
        )}

        <div className="formulario__acciones formulario__acciones--registro">
          {paso > 0 ? (
            <button type="button" className="boton boton--secundario" onClick={atras} disabled={enviando}>
              ← Atrás
            </button>
          ) : (
            <Link to="/" className="boton boton--secundario">
              Cancelar
            </Link>
          )}

          {esUltimo ? (
            <button type="submit" className="boton" disabled={enviando}>
              {enviando ? 'Creando cuenta…' : 'Crear mi cuenta'}
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