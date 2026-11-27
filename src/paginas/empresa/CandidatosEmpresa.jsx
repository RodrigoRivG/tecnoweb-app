import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { confirmarCheckoutEmpresa, enviarCandidatosEmpresa, obtenerSolicitudesEmpresa } from '../../api/empresa.js'
import FormularioListaCandidatos from '../../componentes/empresa/FormularioListaCandidatos.jsx'
import ResumenClavesCandidatos from '../../componentes/empresa/ResumenClavesCandidatos.jsx'
import TablaAccesosEmpresa from '../../componentes/empresa/TablaAccesosEmpresa.jsx'
import { ErrorCarga } from '../../componentes/Estado.jsx'
import { useSesion } from '../../sesion/SesionContext.jsx'
import { CANDIDATO_VACIO, validarCandidatos } from '../../utilidades/candidatosEmpresa.js'
import { useConsulta } from '../../utilidades/useConsulta.js'

export default function CandidatosEmpresa() {
  const { procesoId } = useParams()
  const [params] = useSearchParams()
  const { state } = useLocation()
  const { usuario, cargando } = useSesion()
  const navegar = useNavigate()
  const avisoRef = useRef(null)
  const checkoutConfirmadoRef = useRef(null)
  const confirmacionEnCursoRef = useRef(false)
  const candidatosPrecargadosRef = useRef(false)
  const solicitudes = useConsulta(obtenerSolicitudesEmpresa)

  const [candidatos, setCandidatos] = useState([{ ...CANDIDATO_VACIO }])
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [accesos, setAccesos] = useState(null)
  const [confirmandoPago, setConfirmandoPago] = useState(false)
  const [errorPago, setErrorPago] = useState('')

  const sessionId = params.get('session_id')
  const pagoOk = params.get('pago') === 'ok' || state?.pagoOk
  const ampliar = params.get('ampliar') === '1'

  useEffect(() => {
    if (!sessionId || !pagoOk) return

    const clave = `${procesoId}:${sessionId}`
    const rutaLimpia = `/empresa/solicitudes/${procesoId}/candidatos`

    if (checkoutConfirmadoRef.current === clave) {
      setConfirmandoPago(false)
      navegar(rutaLimpia, { replace: true, state: { pagoOk: true } })
      return
    }

    const solicitudActual = solicitudes.datos?.find((item) => String(item.proceso_id) === String(procesoId))
    if (solicitudActual && solicitudActual.estado !== 'PENDIENTE_PAGO') {
      checkoutConfirmadoRef.current = clave
      setConfirmandoPago(false)
      navegar(rutaLimpia, { replace: true, state: { pagoOk: true } })
      return
    }

    if (confirmacionEnCursoRef.current) return
    confirmacionEnCursoRef.current = true

    let activo = true
    setConfirmandoPago(true)
    confirmarCheckoutEmpresa(procesoId, sessionId)
      .then(() => {
        if (!activo) return
        checkoutConfirmadoRef.current = clave
        solicitudes.reintentar()
        navegar(rutaLimpia, { replace: true, state: { pagoOk: true } })
      })
      .catch((error) => {
        if (!activo) return
        if (error.status === 429) {
          checkoutConfirmadoRef.current = clave
          solicitudes.reintentar()
          navegar(rutaLimpia, { replace: true, state: { pagoOk: true } })
          return
        }
        setErrorPago(error.message || 'No se pudo confirmar el pago con Stripe.')
      })
      .finally(() => {
        confirmacionEnCursoRef.current = false
        if (activo) setConfirmandoPago(false)
      })
    return () => {
      activo = false
      confirmacionEnCursoRef.current = false
    }
  }, [procesoId, sessionId, pagoOk, solicitudes.datos, solicitudes.reintentar, navegar])

  const solicitud = solicitudes.datos?.find((item) => String(item.proceso_id) === String(procesoId))

  useEffect(() => {
    if (ampliar) return
    if (!solicitud?.candidatos?.length || candidatosPrecargadosRef.current) return
    candidatosPrecargadosRef.current = true
    setCandidatos(
      solicitud.candidatos.map((candidato) => ({
        nombres: candidato.nombres ?? '',
        apellido_paterno: candidato.apellido_paterno ?? candidato.apellidos?.split(' ')[0] ?? '',
        ci_numero: candidato.ci ?? '',
        fecha_nacimiento: candidato.fecha_nacimiento ?? '',
        correo: candidato.correo ?? '',
      })),
    )
  }, [solicitud?.candidatos, ampliar])

  if (cargando) return <p className="contenedor seccion">Cargando…</p>
  if (!usuario) return <Navigate to="/iniciar-sesion" replace />
  if (usuario.rol?.codigo !== 'EMPRESA') return <Navigate to="/" replace />

  if (solicitudes.error) return <ErrorCarga error={solicitudes.error} onReintentar={solicitudes.reintentar} />
  if (solicitudes.cargando && !solicitud) return <p className="contenedor seccion">Cargando solicitud…</p>

  if (ampliar && solicitud?.estado !== 'EN_CURSO') {
    return <Navigate to={`/empresa/solicitudes/${procesoId}`} replace />
  }

  if (
    !ampliar &&
    !sessionId &&
    solicitud?.estado === 'PENDIENTE_PAGO' &&
    !solicitud.datos_puesto_pendientes &&
    (solicitud.candidatos?.length ?? 0) === 0
  ) {
    return <Navigate to={`/empresa/solicitudes/${procesoId}/completar`} replace state={{ pasoInicial: 3 }} />
  }

  if (solicitud?.datos_puesto_pendientes) {
    return (
      <div className="contenedor contenedor--angosto seccion">
        <Link to={`/empresa/solicitudes/${procesoId}`}>← Volver a la vacante</Link>
        <h1 className="titulo-pagina" style={{ marginTop: '1rem' }}>
          Antes de los candidatos, define el puesto
        </h1>
        <p className="seccion__descripcion">
          Primero guarda el cargo y el perfil ideal: <strong>personalidad (16PF)</strong> y habilidades blandas. Puedes
          hacerlo ahora o retomarlo desde el panel cuando quieras; la vacante sigue en borrador.
        </p>
        <div className="formulario__acciones formulario__acciones--registro" style={{ marginTop: '1rem' }}>
          <Link to="/empresa" className="boton boton--secundario">
            Volver al panel
          </Link>
          <Link to={`/empresa/solicitudes/${procesoId}/completar`} className="boton boton--primario">
            Ir al paso 1 del formulario
          </Link>
        </div>
      </div>
    )
  }

  if (solicitud?.estado === 'EN_CURSO' && !ampliar) {
    return <Navigate to={`/empresa/solicitudes/${procesoId}`} replace />
  }

  function cambiar(indice, campo, valor) {
    setCandidatos((lista) => lista.map((item, i) => (i === indice ? { ...item, [campo]: valor } : item)))
  }

  async function enviar(evento) {
    evento.preventDefault()
    const locales = validarCandidatos(candidatos)
    if (Object.keys(locales).length) {
      setErrores(locales)
      setMensaje('Revisa los datos de los candidatos.')
      return
    }

    setEnviando(true)
    setMensaje('')
    try {
      const data = await enviarCandidatosEmpresa(procesoId, candidatos, { ampliar })
      await solicitudes.reintentar()
      if (data.pendiente_pago) {
        navegar(
          `/empresa/solicitudes/${procesoId}/pago${data.ampliacion || ampliar ? '?ampliacion=1' : ''}`,
          {
            replace: true,
            state: ampliar ? { ampliacionLista: data.cantidad_candidatos } : { listaParaPago: data.cantidad_candidatos },
          },
        )
        return
      }
      const lista = data.accesos ?? []
      if (lista.length) {
        navegar(`/empresa/solicitudes/${procesoId}`, {
          replace: true,
          state: { clavesCandidatos: lista, ampliar },
        })
        return
      }
      navegar(`/empresa/solicitudes/${procesoId}`, { replace: true })
    } catch (error) {
      const plano = error.erroresPorCampo ?? {}
      setErrores(plano)
      setMensaje(error.message || 'No se pudo registrar la lista.')
      requestAnimationFrame(() => avisoRef.current?.focus())
      setEnviando(false)
    }
  }

  if (accesos?.length) {
    return (
      <ResumenClavesCandidatos
        procesoId={procesoId}
        accesos={accesos}
        ampliar={ampliar}
        titulo={ampliar ? 'Nuevos candidatos listos' : 'Accesos creados'}
        descripcion={
          ampliar
            ? 'Estas claves son para quienes acabas de agregar.'
            : 'Los candidatos ya pueden entrar con su clave temporal.'
        }
      />
    )
  }

  if (confirmandoPago) {
    return <p className="contenedor seccion">Confirmando pago con Stripe…</p>
  }

  return (
    <div className="contenedor contenedor--angosto seccion">
      <Link to={`/empresa/solicitudes/${procesoId}`}>← Volver a la vacante</Link>
      <h1 className="titulo-pagina" style={{ marginTop: '1rem' }}>
        {ampliar ? 'Agregar candidatos' : 'Lista de candidatos'}
      </h1>
      <p className="seccion__descripcion">
        {pagoOk ? 'Pago confirmado. ' : ''}
        {ampliar ? (
          <>
            Añade personas nuevas a <strong>{solicitud?.puesto?.cargo}</strong>. Después pagarás solo por los que
            agregues; los que ya evalúan siguen igual.
          </>
        ) : (
          <>
            Lista a las personas que <strong>rendirán el examen</strong> (puede ser más de una por vacante).{' '}
            {solicitud?.estado === 'PENDIENTE_PAGO'
              ? 'Al guardar irás al pago; el monto depende de cuántos candidatos incluyas.'
              : 'Al enviar se crearán sus accesos automáticamente.'}
          </>
        )}
      </p>
      {ampliar && solicitud?.accesos?.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <p className="grupo__subtitulo">Ya en esta vacante</p>
          <TablaAccesosEmpresa accesos={solicitud.accesos} mostrarClaves={false} />
        </div>
      )}
      {solicitud?.puesto?.vacantes != null && (
        <p className="registro-paso-aviso">
          Este puesto tiene <strong>{solicitud.puesto.vacantes}</strong> vacante{solicitud.puesto.vacantes === 1 ? '' : 's'} a
          cubrir; eso no determina el precio.
        </p>
      )}

      {errorPago && (
        <p className="aviso aviso--error" role="alert">
          {errorPago} Si ya pagaste, espera unos segundos o configura el webhook de Stripe.
        </p>
      )}
      {mensaje && (
        <div ref={avisoRef} tabIndex={-1} className="aviso aviso--error" role="alert">
          <p>{mensaje}</p>
        </div>
      )}

      <form className="formulario" onSubmit={enviar} noValidate>
        <FormularioListaCandidatos
          candidatos={candidatos}
          errores={errores}
          onCambiar={cambiar}
          onAgregar={() => setCandidatos((lista) => [...lista, { ...CANDIDATO_VACIO }])}
          onQuitar={(indice) => setCandidatos((lista) => lista.filter((_, i) => i !== indice))}
        />
        <div className="formulario__acciones formulario__acciones--registro">
          <Link
            to={
              ampliar
                ? `/empresa/solicitudes/${procesoId}`
                : `/empresa/solicitudes/${procesoId}/completar`
            }
            state={ampliar ? undefined : { pasoInicial: 3 }}
            className="boton boton--secundario"
          >
            {ampliar ? 'Cancelar' : '← Paso 4 (editar lista)'}
          </Link>
          <button type="button" className="boton" disabled={enviando} onClick={enviar}>
            {enviando
              ? 'Guardando…'
              : ampliar || solicitud?.estado === 'PENDIENTE_PAGO'
                ? 'Continuar al pago'
                : 'Activar accesos'}
          </button>
        </div>
      </form>
    </div>
  )
}