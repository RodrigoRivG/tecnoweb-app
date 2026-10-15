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

export default function Registro() {
  const { usuario, iniciarSesion } = useSesion()
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const facultades = useConsulta(obtenerFacultades)
  const [datos, setDatos] = useState(() => ({ ...VACIO, carrera_id: parametros.get('carrera') ?? '' }))
  const [errores, setErrores] = useState({})
  const [mensajeGeneral, setMensajeGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const avisoRef = useRef(null)

  // Durante el envío exitoso navega enviar(), con el aviso de bienvenida
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

    // El área depende de la carrera
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

  async function enviar(evento) {
    evento.preventDefault()

    if (datos.password && datos.password !== datos.password_confirmation) {
      mostrarErrores({ password_confirmation: 'Las contraseñas no coinciden.' }, 'Revisa los campos marcados.')

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
      setEnviando(false)
    }
  }

  /** Props comunes de un input controlado. */
  const control = (nombre) => ({ name: nombre, value: datos[nombre], onChange: cambiar })

  return (
    <div className="contenedor contenedor--angosto seccion">
      <h1 className="titulo-pagina">Registro de egresado</h1>
      <p className="seccion__descripcion">
        Crea tu cuenta para postular a las convocatorias de tu carrera. Todos los campos son obligatorios salvo los
        marcados como opcionales.
      </p>

      {mensajeGeneral && (
        <div ref={avisoRef} tabIndex={-1} className="aviso aviso--error" role="alert">
          <p>{mensajeGeneral}</p>
        </div>
      )}

      {facultades.error && <ErrorCarga error={facultades.error} onReintentar={facultades.reintentar} />}

      <form className="formulario" onSubmit={enviar} noValidate>
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
                  {DEPARTAMENTOS.map(([codigo, nombre]) => <option key={codigo} value={codigo}>{nombre}</option>)}
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

        <fieldset className="grupo">
          <legend>Datos académicos</legend>
          <Campo etiqueta="Carrera" error={errores.carrera_id} className="campo--ancho">
            {(a11y) => (
              <select {...a11y} {...control('carrera_id')} disabled={!facultades.datos}>
                <option value="">{facultades.datos ? 'Elige tu carrera' : 'Cargando carreras…'}</option>
                {facultades.datos?.map((facultad) => (
                  <optgroup key={facultad.id} label={facultad.nombre}>
                    {facultad.carreras.map((carrera) => (
                      <option key={carrera.id} value={carrera.id}>{carrera.nombre}</option>
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
                  {areas.map((area) => <option key={area.id} value={area.id}>{area.nombre}</option>)}
                </select>
              )}
            </Campo>
          )}
          <Campo etiqueta="Registro universitario" error={errores.registro_universitario}>
            {(a11y) => <input {...a11y} {...control('registro_universitario')} maxLength={20} />}
          </Campo>
          <Campo etiqueta="Año de egreso" error={errores.anio_egreso}>
            {(a11y) => (
              <input {...a11y} {...control('anio_egreso')} type="number" inputMode="numeric" min={1950} max={ANIO_ACTUAL} />
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

        <fieldset className="grupo grupo--consentimientos">
          <legend>Consentimientos</legend>
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

        <div className="formulario__acciones">
          <Link to="/" className="boton boton--secundario">Cancelar</Link>
          <button type="submit" className="boton" disabled={enviando}>
            {enviando ? 'Creando cuenta…' : 'Crear mi cuenta'}
          </button>
        </div>
      </form>
    </div>
  )
}
