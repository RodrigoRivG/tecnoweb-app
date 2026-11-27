import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { crearCheckoutEmpresa, obtenerSolicitudesEmpresa, simularPagoEmpresa } from '../../api/empresa.js'
import { ErrorCarga } from '../../componentes/Estado.jsx'
import { useSesion } from '../../sesion/SesionContext.jsx'
import { formatearMontoCentavos } from '../../utilidades/moneda.js'
import { useConsulta } from '../../utilidades/useConsulta.js'

export default function PagoEmpresa() {
  const { procesoId } = useParams()
  const [params] = useSearchParams()
  const { state } = useLocation()
  const navegar = useNavigate()
  const { usuario, cargando } = useSesion()
  const solicitudes = useConsulta(obtenerSolicitudesEmpresa)
  const [aviso, setAviso] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [checkout, setCheckout] = useState(null)
  const [checkoutCargando, setCheckoutCargando] = useState(true)

  const solicitud = solicitudes.datos?.find((item) => String(item.proceso_id) === String(procesoId))
  const esAmpliacion = params.get('ampliacion') === '1' || solicitud?.estado === 'EN_CURSO'
  const cantidadInicial = solicitud?.candidatos?.length ?? 0
  const cantidadPendiente = solicitud?.candidatos_pendientes_pago ?? 0
  const cantidadCobro = checkout?.cantidad_candidatos ?? (esAmpliacion ? cantidadPendiente : cantidadInicial)

  useEffect(() => {
    if (!solicitud) return
    const puedePagar =
      (solicitud.estado === 'PENDIENTE_PAGO' && cantidadInicial >= 1) ||
      (solicitud.estado === 'EN_CURSO' && cantidadPendiente >= 1)
    if (!puedePagar) {
      setCheckoutCargando(false)
      return
    }
    if (checkout) {
      setCheckoutCargando(false)
      return
    }
    let activo = true
    setCheckoutCargando(true)
    crearCheckoutEmpresa(procesoId)
      .then((data) => {
        if (!activo) return
        setCheckout(data)
        setCheckoutCargando(false)
      })
      .catch((error) => {
        if (!activo) return
        setAviso(error.message || 'No se pudo preparar el pago.')
        setCheckoutCargando(false)
      })
    return () => {
      activo = false
    }
  }, [procesoId, solicitud, checkout, cantidadInicial, cantidadPendiente])

  if (cargando) return <p className="contenedor seccion">Cargando…</p>
  if (!usuario) return <Navigate to="/iniciar-sesion" replace state={{ desde: `/empresa/solicitudes/${procesoId}/pago` }} />
  if (usuario.rol?.codigo !== 'EMPRESA') return <Navigate to="/" replace />

  if (solicitudes.error) return <ErrorCarga error={solicitudes.error} onReintentar={solicitudes.reintentar} />
  if (solicitudes.cargando && !solicitud) return <p className="contenedor seccion">Cargando solicitud…</p>
  if (!solicitud) {
    return (
      <div className="contenedor seccion">
        <p>No encontramos esa solicitud.</p>
        <Link to="/empresa">Volver al panel</Link>
      </div>
    )
  }

  if (solicitud.estado === 'PENDIENTE_CANDIDATOS') {
    return <Navigate to={`/empresa/solicitudes/${procesoId}/candidatos`} replace />
  }

  if (solicitud.estado === 'EN_CURSO' && cantidadPendiente < 1) {
    return <Navigate to={`/empresa/solicitudes/${procesoId}`} replace />
  }

  if (solicitud.datos_puesto_pendientes) {
    return <Navigate to={`/empresa/solicitudes/${procesoId}/completar`} replace />
  }

  if (!esAmpliacion && cantidadInicial < 1) {
    return <Navigate to={`/empresa/solicitudes/${procesoId}/candidatos`} replace />
  }

  const cancelado = params.get('cancelado') === '1'
  const modoStripe = checkout?.modo === 'stripe'
  const monto = checkout?.monto_centavos
  const moneda = checkout?.moneda ?? 'bob'

  async function pagar() {
    setProcesando(true)
    setAviso('')
    try {
      const datos = checkout ?? (await crearCheckoutEmpresa(procesoId))
      if (datos.modo === 'stripe' && datos.url) {
        window.location.href = datos.url
        return
      }
      await simularPagoEmpresa(procesoId)
      navegar(`/empresa/solicitudes/${procesoId}`, {
        replace: true,
        state: { pagoOk: true, trasPago: esAmpliacion ? 'ampliacion' : 'inicio' },
      })
    } catch (error) {
      setAviso(error.message || 'No se pudo iniciar el pago.')
      setProcesando(false)
    }
  }

  return (
    <div className="contenedor contenedor--angosto seccion">
      <Link to={`/empresa/solicitudes/${procesoId}`}>← Volver a la vacante</Link>
      <h1 className="titulo-pagina" style={{ marginTop: '1rem' }}>
        {esAmpliacion ? 'Pago de ampliación' : 'Pago del servicio'}
      </h1>
      <p className="seccion__descripcion">
        {esAmpliacion ? (
          <>
            Vas a activar <strong>{cantidadCobro}</strong> candidato{cantidadCobro === 1 ? '' : 's'} nuevo
            {cantidadCobro === 1 ? '' : 's'} en <strong>{solicitud.puesto?.cargo}</strong>. Los que ya evalúan no se
            modifican.
          </>
        ) : (
          <>
            Contratas la evaluación para <strong>{solicitud.puesto?.cargo}</strong> (
            <strong>{solicitud.puesto?.vacantes ?? 1}</strong> vacante{solicitud.puesto?.vacantes === 1 ? '' : 's'} a
            cubrir) con <strong>{cantidadCobro}</strong> candidato{cantidadCobro === 1 ? '' : 's'} que rendirán el
            examen.
          </>
        )}{' '}
        El total es {cantidadCobro} × la tarifa por candidato.
      </p>

      {(state?.listaParaPago ?? state?.ampliacionLista) != null && (
        <p className="aviso aviso--exito" role="status">
          Lista guardada: vas a pagar por <strong>{state.listaParaPago ?? state.ampliacionLista}</strong> candidato
          {(state.listaParaPago ?? state.ampliacionLista) === 1 ? '' : 's'}.
        </p>
      )}

      {cancelado && (
        <p className="aviso aviso--error" role="status">
          Pago cancelado en Stripe. Puedes intentarlo de nuevo.
        </p>
      )}
      {aviso && (
        <p className="aviso aviso--error" role="alert">
          {aviso}
        </p>
      )}

      <div className="tarjeta" style={{ marginTop: '1rem' }}>
        <p>
          <strong>Código:</strong> {solicitud.codigo}
        </p>
        {monto != null && (
          <p style={{ marginTop: '0.75rem' }}>
            <strong>Total estimado:</strong> {formatearMontoCentavos(monto, moneda)}
            {` (${cantidadCobro} × tarifa por candidato)`}
          </p>
        )}

        {checkoutCargando ? (
          <p className="registro-paso-aviso" style={{ marginTop: '1rem' }} role="status">
            Calculando el total del servicio…
          </p>
        ) : modoStripe ? (
          <p className="registro-paso-aviso" style={{ marginTop: '1rem' }}>
            Al terminar{esAmpliacion ? ' se activarán solo los candidatos nuevos' : ' se activarán los accesos de los candidatos registrados'}.
          </p>
        ) : (
          <p className="registro-paso-aviso" style={{ marginTop: '1rem' }}>
            Stripe no está configurado en el servidor; solo en ese caso se usa el pago de prueba.
          </p>
        )}

        <button
          type="button"
          className="boton"
          style={{ marginTop: '1rem', width: '100%' }}
          disabled={procesando || checkoutCargando}
          onClick={pagar}
        >
          {procesando
            ? 'Redirigiendo…'
            : checkoutCargando
              ? 'Preparando pago…'
              : modoStripe
                ? 'Pagar con Stripe Checkout'
                : 'Continuar (pago de prueba)'}
        </button>
      </div>
    </div>
  )
}