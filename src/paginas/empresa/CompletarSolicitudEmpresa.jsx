import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import {
  completarDatosSolicitudEmpresa,
  enviarCandidatosEmpresa,
  obtenerCatalogoSolicitud,
  obtenerSolicitudesEmpresa,
} from '../../api/empresa.js'
import FormularioListaCandidatos from '../../componentes/empresa/FormularioListaCandidatos.jsx'
import Campo from '../../componentes/Campo.jsx'
import PasosFormulario from '../../componentes/PasosFormulario.jsx'
import { ErrorCarga, Esqueleto } from '../../componentes/Estado.jsx'
import { useSesion } from '../../sesion/SesionContext.jsx'
import { CANDIDATO_VACIO, validarCandidatos } from '../../utilidades/candidatosEmpresa.js'
import { useConsulta } from '../../utilidades/useConsulta.js'

const PASOS = [
  { titulo: 'Puesto', descripcion: 'Vacante, carrera de referencia y funciones.' },
  { titulo: 'Personalidad (16PF)', descripcion: 'Nivel ideal del 1 al 10 en cada factor de personalidad.' },
  { titulo: 'Habilidades blandas', descripcion: 'Nivel ideal del 1 al 10 en competencias socioemocionales.' },
  { titulo: 'Candidatos', descripcion: 'Personas que rendirán el examen; el pago depende de cuántas registres.' },
]

const PASO_CANDIDATOS = 3

function validarDimensiones(niveles, ids) {
  const errores = {}
  for (const id of ids) {
    const valor = Number(niveles[id])
    if (Number.isNaN(valor) || valor < 1 || valor > 10) {
      errores.niveles = 'Cada dimensión debe estar entre 1 y 10.'
      break
    }
  }
  return errores
}

function validarPasoPerfil(paso, puesto, niveles, idsPersonalidad, idsBlandas) {
  const errores = {}
  if (paso === 0) {
    if (!puesto.cargo?.trim()) errores.cargo = 'Indica el cargo.'
    const vacantes = Number(puesto.vacantes)
    if (!puesto.vacantes || Number.isNaN(vacantes) || vacantes < 1 || vacantes > 50) {
      errores.vacantes = 'Entre 1 y 50 vacantes.'
    }
    if (!puesto.carrera_id) errores.carrera_id = 'Elige la carrera de referencia.'
    if (!puesto.descripcion_funciones?.trim()) errores.descripcion_funciones = 'Describe las funciones del puesto.'
  }
  if (paso === 1) {
    return validarDimensiones(niveles, idsPersonalidad)
  }
  if (paso === 2) {
    return validarDimensiones(niveles, idsBlandas)
  }
  return errores
}

function validarPerfilCompleto(puesto, niveles, idsPersonalidad, idsBlandas) {
  return {
    ...validarPasoPerfil(0, puesto, niveles, idsPersonalidad, idsBlandas),
    ...validarPasoPerfil(1, puesto, niveles, idsPersonalidad, idsBlandas),
    ...validarPasoPerfil(2, puesto, niveles, idsPersonalidad, idsBlandas),
  }
}

export default function CompletarSolicitudEmpresa() {
  const { procesoId } = useParams()
  const [params] = useSearchParams()
  const { state } = useLocation()
  const navegar = useNavigate()
  const avisoRef = useRef(null)
  const pasoInicializadoRef = useRef(false)

  useEffect(() => {
    pasoInicializadoRef.current = false
  }, [procesoId])
  const { usuario, cargando } = useSesion()
  const solicitudes = useConsulta(obtenerSolicitudesEmpresa)

  const [catalogo, setCatalogo] = useState(null)
  const [errorCatalogo, setErrorCatalogo] = useState(null)
  const [paso, setPaso] = useState(() => state?.pasoInicial ?? 0)
  const [puesto, setPuesto] = useState({
    cargo: '',
    area: '',
    vacantes: 1,
    descripcion_funciones: '',
    carrera_id: '',
  })
  const [niveles, setNiveles] = useState({})
  const [candidatos, setCandidatos] = useState([{ ...CANDIDATO_VACIO }])
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)

  const sessionId = params.get('session_id')
  const pagoOk = params.get('pago') === 'ok' || state?.pagoOk

  useEffect(() => {
    let activo = true
    obtenerCatalogoSolicitud()
      .then((data) => {
        if (!activo) return
        setCatalogo(data)
        const iniciales = {}
        ;[...(data.personalidad ?? []), ...(data.habilidades_blandas ?? [])].forEach((dimension) => {
          iniciales[dimension.dimension_id] = 5
        })
        setNiveles(iniciales)
      })
      .catch((error) => activo && setErrorCatalogo(error))
    return () => {
      activo = false
    }
  }, [])

  useEffect(() => {
    if (!sessionId || !pagoOk) return
    const qs = new URLSearchParams({ pago: 'ok', session_id: sessionId })
    navegar(`/empresa/solicitudes/${procesoId}/candidatos?${qs}`, { replace: true })
  }, [sessionId, pagoOk, procesoId, navegar])

  const solicitud = solicitudes.datos?.find((item) => String(item.proceso_id) === String(procesoId))

  useEffect(() => {
    if (!catalogo?.carreras?.length || !solicitud) return
    const carreraId = solicitud.puesto?.carrera
      ? catalogo.carreras.find((c) => c.nombre === solicitud.puesto.carrera)?.id
      : null
    setPuesto((actual) => ({
      ...actual,
      carrera_id: carreraId ? String(carreraId) : String(catalogo.carreras[0].id),
    }))
  }, [catalogo, solicitud])

  useLayoutEffect(() => {
    if (pasoInicializadoRef.current || !solicitud) return
    if (state?.pasoInicial != null) {
      setPaso(state.pasoInicial)
      pasoInicializadoRef.current = true
      return
    }
    if (
      solicitud.estado === 'PENDIENTE_PAGO' &&
      !solicitud.datos_puesto_pendientes &&
      (solicitud.candidatos?.length ?? 0) === 0
    ) {
      setPaso(PASO_CANDIDATOS)
    }
    pasoInicializadoRef.current = true
  }, [solicitud, state?.pasoInicial])

  const idsPersonalidad = (catalogo?.personalidad ?? []).map((d) => d.dimension_id)
  const idsBlandas = (catalogo?.habilidades_blandas ?? []).map((d) => d.dimension_id)
  const esUltimo = paso === PASO_CANDIDATOS

  function evitarEnterAccidental(evento) {
    if (evento.key !== 'Enter' || evento.target.tagName === 'TEXTAREA') return
    evento.preventDefault()
  }

  if (cargando) return <p className="contenedor seccion">Cargando…</p>
  if (!usuario) return <Navigate to="/iniciar-sesion" replace />
  if (usuario.rol?.codigo !== 'EMPRESA') return <Navigate to="/" replace />

  if (solicitudes.error) return <ErrorCarga error={solicitudes.error} onReintentar={solicitudes.reintentar} />
  if (solicitudes.cargando && !solicitud) return <p className="contenedor seccion">Cargando solicitud…</p>

  const puedeDefinirPuesto =
    solicitud?.datos_puesto_pendientes &&
    (solicitud.estado === 'PENDIENTE_PAGO' || solicitud.estado === 'PENDIENTE_CANDIDATOS')

  const enPasoCandidatos = paso === PASO_CANDIDATOS
  const vacanteListaParaCandidatos =
    solicitud?.estado === 'PENDIENTE_PAGO' &&
    !solicitud.datos_puesto_pendientes &&
    (solicitud.candidatos?.length ?? 0) === 0

  if (solicitud && !puedeDefinirPuesto && !enPasoCandidatos && !enviando && !vacanteListaParaCandidatos) {
    if (solicitud.estado === 'PENDIENTE_PAGO' && (solicitud.candidatos?.length ?? 0) > 0) {
      return <Navigate to={`/empresa/solicitudes/${procesoId}/pago`} replace />
    }
    if (solicitud.estado === 'PENDIENTE_CANDIDATOS' || solicitud.estado === 'EN_CURSO') {
      return <Navigate to={`/empresa/solicitudes/${procesoId}/candidatos`} replace />
    }
    if (solicitud.estado !== 'PENDIENTE_PAGO') {
      return <Navigate to="/empresa" replace />
    }
  }

  function cambiarPuesto(evento) {
    const { name, value } = evento.target
    setPuesto((actual) => ({ ...actual, [name]: value }))
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: undefined }))
  }

  function errorDe(campo) {
    return errores[campo]
  }

  function scrollArriba() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function guardarPerfilSiNecesario() {
    if (!solicitud?.datos_puesto_pendientes) return true

    const todos = validarPerfilCompleto(puesto, niveles, idsPersonalidad, idsBlandas)
    if (Object.keys(todos).length > 0) {
      setErrores(todos)
      setMensaje('Revisa los datos del puesto y del perfil antes de los candidatos.')
      if (todos.cargo || todos.vacantes || todos.carrera_id || todos.descripcion_funciones) setPaso(0)
      else if (todos.niveles && paso !== 1) setPaso(1)
      else setPaso(2)
      return false
    }

    setEnviando(true)
    setMensaje('')
    try {
      await completarDatosSolicitudEmpresa(procesoId, {
        ...puesto,
        carrera_id: Number(puesto.carrera_id),
        vacantes: Number(puesto.vacantes),
        niveles: Object.entries(niveles).map(([dimensionId, valor]) => ({
          dimension_id: Number(dimensionId),
          valor_ideal: Number(valor),
        })),
      })
      await solicitudes.reintentar()
      setEnviando(false)
      return true
    } catch (error) {
      const plano = {}
      for (const [clave, mensajes] of Object.entries(error.errores ?? error.erroresPorCampo ?? {})) {
        plano[clave] = Array.isArray(mensajes) ? mensajes[0] : mensajes
      }
      setErrores(plano)
      setMensaje(error.message || 'No se pudieron guardar los datos del puesto.')
      setEnviando(false)
      return false
    }
  }

  async function irAPaso(indice) {
    if (indice === paso || enviando) return

    if (indice < paso) {
      setMensaje('')
      setPaso(indice)
      scrollArriba()
      return
    }

    if (indice === PASO_CANDIDATOS) {
      for (let i = 0; i <= 2; i += 1) {
        if (i === 1 && idsPersonalidad.length === 0) {
          setMensaje('El catálogo de personalidad no está cargado. Ejecuta el CatalogoSeeder en la API.')
          setPaso(i)
          scrollArriba()
          return
        }
        const locales = validarPasoPerfil(i, puesto, niveles, idsPersonalidad, idsBlandas)
        if (Object.keys(locales).length > 0) {
          setErrores(locales)
          setMensaje('Revisa los campos de este paso antes de continuar.')
          setPaso(i)
          scrollArriba()
          return
        }
      }
      const guardado = await guardarPerfilSiNecesario()
      if (!guardado) return
      setMensaje('')
      setErrores({})
      setPaso(PASO_CANDIDATOS)
      scrollArriba()
      return
    }

    for (let i = paso; i < indice; i += 1) {
      if (i === 1 && idsPersonalidad.length === 0) {
        setMensaje('El catálogo de personalidad no está cargado. Ejecuta el CatalogoSeeder en la API.')
        setPaso(i)
        scrollArriba()
        return
      }
      const locales = validarPasoPerfil(i, puesto, niveles, idsPersonalidad, idsBlandas)
      if (Object.keys(locales).length > 0) {
        setErrores(locales)
        setMensaje('Revisa los campos de este paso antes de continuar.')
        setPaso(i)
        scrollArriba()
        return
      }
    }
    setMensaje('')
    setErrores({})
    setPaso(indice)
    scrollArriba()
  }

  async function siguiente() {
    if (!solicitud?.datos_puesto_pendientes && paso < PASO_CANDIDATOS) {
      await irAPaso(PASO_CANDIDATOS)
      return
    }

    if (paso === 2) {
      const locales = validarPasoPerfil(2, puesto, niveles, idsPersonalidad, idsBlandas)
      if (Object.keys(locales).length > 0) {
        setErrores(locales)
        setMensaje('Revisa los campos de este paso.')
        return
      }
      await irAPaso(PASO_CANDIDATOS)
      return
    }

    const locales = validarPasoPerfil(paso, puesto, niveles, idsPersonalidad, idsBlandas)
    if (Object.keys(locales).length > 0) {
      setErrores(locales)
      setMensaje('Revisa los campos de este paso.')
      return
    }
    if (paso === 1 && idsPersonalidad.length === 0) {
      setMensaje('El catálogo de personalidad no está cargado. Ejecuta el CatalogoSeeder en la API.')
      return
    }
    await irAPaso(Math.min(PASO_CANDIDATOS - 1, paso + 1))
  }

  function cambiarCandidato(indice, campo, valor) {
    setCandidatos((lista) => lista.map((item, i) => (i === indice ? { ...item, [campo]: valor } : item)))
  }

  async function enviarCandidatos(evento) {
    evento.preventDefault()
    const locales = validarCandidatos(candidatos)
    if (Object.keys(locales).length > 0) {
      setErrores(locales)
      setMensaje('Revisa los datos de los candidatos.')
      return
    }

    setEnviando(true)
    setMensaje('')
    try {
      const data = await enviarCandidatosEmpresa(procesoId, candidatos)
      await solicitudes.reintentar()
      if (data.pendiente_pago) {
        navegar(`/empresa/solicitudes/${procesoId}/pago`, {
          replace: true,
          state: { listaParaPago: candidatos.length },
        })
        return
      }
      navegar(`/empresa/solicitudes/${procesoId}`, {
        replace: true,
        state: { clavesCandidatos: data.accesos, ampliar: false },
      })
    } catch (error) {
      setErrores(error.erroresPorCampo ?? {})
      setMensaje(error.message || 'No se pudo registrar la lista.')
      requestAnimationFrame(() => avisoRef.current?.focus())
      setEnviando(false)
    }
  }

  const controlPuesto = (nombre) => ({
    name: nombre,
    value: puesto[nombre],
    onChange: cambiarPuesto,
  })

  const leyendaCandidatos =
    solicitud?.puesto?.vacantes != null ? (
      <>
        Este puesto tiene <strong>{solicitud.puesto.vacantes}</strong> vacante{solicitud.puesto.vacantes === 1 ? '' : 's'}{' '}
        a cubrir; el cobro depende de cuántas personas registres para rendir el examen.
      </>
    ) : (
      <>
        Lista a quienes <strong>rendirán el examen</strong>. Al guardar pasarás al pago según la cantidad de candidatos.
      </>
    )

  return (
    <div className="contenedor contenedor--angosto seccion">
      <Link to="/empresa">← Mis vacantes</Link>
      <h1 className="titulo-pagina" style={{ marginTop: '1rem' }}>
        Completar vacante
      </h1>
      <p className="seccion__descripcion">
        Cuatro pasos: puesto, <strong>personalidad (16PF)</strong>, habilidades blandas y candidatos. Sigue el orden; al
        final irás al pago.
      </p>
      {mensaje && (
        <div ref={avisoRef} tabIndex={-1} className="aviso aviso--error" role="alert">
          <p>{mensaje}</p>
        </div>
      )}

      {errorCatalogo && <ErrorCarga error={errorCatalogo} />}
      {!catalogo && !errorCatalogo && <Esqueleto cantidad={2} />}

      {catalogo && idsPersonalidad.length === 0 && (
        <p className="aviso aviso--error" role="alert">
          No hay factores de personalidad en el servidor. En la API ejecuta:{' '}
          <code>php artisan db:seed --class=CatalogoSeeder</code>
        </p>
      )}

      {catalogo && idsPersonalidad.length > 0 && (
        <form
          className="formulario"
          onSubmit={(evento) => evento.preventDefault()}
          onKeyDown={evitarEnterAccidental}
          noValidate
        >
          <PasosFormulario
            pasos={PASOS}
            pasoActual={paso}
            onIrAPaso={(indice) => void irAPaso(indice)}
            deshabilitado={enviando}
          />

          {paso === 0 && solicitud?.datos_puesto_pendientes && (
            <fieldset className="grupo">
              <legend>Puesto</legend>
              <Campo etiqueta="Cargo" error={errorDe('cargo')} className="campo--ancho">
                {(a11y) => <input {...a11y} {...controlPuesto('cargo')} maxLength={150} />}
              </Campo>
              <Campo etiqueta="Área" opcional error={errorDe('area')}>
                {(a11y) => <input {...a11y} {...controlPuesto('area')} maxLength={100} />}
              </Campo>
              <Campo etiqueta="Vacantes" error={errorDe('vacantes')}>
                {(a11y) => (
                  <input {...a11y} {...controlPuesto('vacantes')} type="number" min={1} max={50} inputMode="numeric" />
                )}
              </Campo>
              <Campo etiqueta="Carrera de referencia" error={errorDe('carrera_id')} className="campo--ancho">
                {(a11y) => (
                  <select {...a11y} {...controlPuesto('carrera_id')}>
                    {catalogo.carreras.map((carrera) => (
                      <option key={carrera.id} value={carrera.id}>
                        {carrera.nombre}
                      </option>
                    ))}
                  </select>
                )}
              </Campo>
              <Campo etiqueta="Funciones del puesto" error={errorDe('descripcion_funciones')} className="campo--ancho">
                {(a11y) => (
                  <textarea {...a11y} {...controlPuesto('descripcion_funciones')} rows={4} maxLength={4000} />
                )}
              </Campo>
            </fieldset>
          )}

          {paso === 0 && !solicitud?.datos_puesto_pendientes && (
            <p className="aviso aviso--exito" role="status">
              El puesto y el perfil ya están guardados. Usa los pasos de arriba para revisar o continúa al paso{' '}
              <strong>Candidatos</strong>.
            </p>
          )}

          {paso === 1 && !solicitud?.datos_puesto_pendientes && (
            <p className="aviso aviso--exito" role="status">
              El perfil de personalidad ya está guardado. Continúa en el paso <strong>Candidatos</strong>.
            </p>
          )}

          {paso === 1 && solicitud?.datos_puesto_pendientes && (
            <fieldset className="grupo">
              <legend>Personalidad — 16PF (1 a 10)</legend>
              {errorDe('niveles') && <p className="campo__error">{errorDe('niveles')}</p>}
              {catalogo.personalidad.map((dimension) => (
                <Campo key={dimension.dimension_id} etiqueta={`${dimension.codigo ?? ''} ${dimension.nombre}`.trim()}>
                  {(a11y) => (
                    <input
                      {...a11y}
                      type="number"
                      min={1}
                      max={10}
                      value={niveles[dimension.dimension_id] ?? 5}
                      onChange={(evento) => {
                        setNiveles((actual) => ({
                          ...actual,
                          [dimension.dimension_id]: evento.target.value,
                        }))
                        if (errores.niveles) setErrores((prev) => ({ ...prev, niveles: undefined }))
                      }}
                    />
                  )}
                </Campo>
              ))}
            </fieldset>
          )}

          {paso === 2 && !solicitud?.datos_puesto_pendientes && (
            <p className="aviso aviso--exito" role="status">
              Las habilidades blandas ya están guardadas. Continúa en el paso <strong>Candidatos</strong>.
            </p>
          )}

          {paso === 2 && solicitud?.datos_puesto_pendientes && (
            <fieldset className="grupo">
              <legend>Habilidades blandas (1 a 10)</legend>
              {errorDe('niveles') && <p className="campo__error">{errorDe('niveles')}</p>}
              {catalogo.habilidades_blandas.map((dimension) => (
                <Campo key={dimension.dimension_id} etiqueta={dimension.nombre}>
                  {(a11y) => (
                    <input
                      {...a11y}
                      type="number"
                      min={1}
                      max={10}
                      value={niveles[dimension.dimension_id] ?? 5}
                      onChange={(evento) => {
                        setNiveles((actual) => ({
                          ...actual,
                          [dimension.dimension_id]: evento.target.value,
                        }))
                        if (errores.niveles) setErrores((prev) => ({ ...prev, niveles: undefined }))
                      }}
                    />
                  )}
                </Campo>
              ))}
            </fieldset>
          )}

          {paso === PASO_CANDIDATOS && (
            <FormularioListaCandidatos
              candidatos={candidatos}
              errores={errores}
              onCambiar={cambiarCandidato}
              onAgregar={() => setCandidatos((lista) => [...lista, { ...CANDIDATO_VACIO }])}
              onQuitar={(indice) => setCandidatos((lista) => lista.filter((_, i) => i !== indice))}
              leyenda={leyendaCandidatos}
            />
          )}

          <div className="formulario__acciones formulario__acciones--registro">
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {paso > 0 ? (
                <button
                  type="button"
                  className="boton boton--secundario"
                  onClick={() => void irAPaso(paso - 1)}
                  disabled={enviando}
                >
                  ← Atrás
                </button>
              ) : null}
              <Link
                to={procesoId ? `/empresa/solicitudes/${procesoId}` : '/empresa'}
                className="boton boton--secundario"
                state={{ salirSinCompletar: true }}
                replace
              >
                Salir y volver al panel
              </Link>
            </div>
            {esUltimo ? (
              <button type="button" className="boton" disabled={enviando} onClick={enviarCandidatos}>
                {enviando ? 'Guardando…' : 'Guardar e ir al pago'}
              </button>
            ) : paso < 2 || solicitud?.datos_puesto_pendientes ? (
              <button type="button" className="boton" disabled={enviando} onClick={() => void siguiente()}>
                {enviando ? 'Guardando…' : 'Siguiente →'}
              </button>
            ) : (
              <button type="button" className="boton" disabled={enviando} onClick={() => void irAPaso(PASO_CANDIDATOS)}>
                Siguiente →
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}