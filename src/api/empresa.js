import { pedir } from './cliente.js'

export async function obtenerCatalogoSolicitud() {
  return (await pedir('/empresa/catalogo-solicitud')).data
}

export async function registrarSolicitudEmpresa(datos) {
  return (await pedir('/empresa/registro-solicitud', { metodo: 'POST', cuerpo: datos })).data
}

export async function crearCheckoutEmpresa(procesoId) {
  return (await pedir(`/empresa/solicitudes/${procesoId}/checkout`, { metodo: 'POST' })).data
}

export async function simularPagoEmpresa(procesoId) {
  return (await pedir(`/empresa/solicitudes/${procesoId}/simular-pago`, { metodo: 'POST' })).data
}

export async function confirmarCheckoutEmpresa(procesoId, sessionId) {
  return (await pedir(`/empresa/solicitudes/${procesoId}/confirmar-checkout`, {
    metodo: 'POST',
    cuerpo: { session_id: sessionId },
  })).data
}

export async function completarDatosSolicitudEmpresa(procesoId, datos) {
  return (await pedir(`/empresa/solicitudes/${procesoId}/datos-solicitud`, { metodo: 'POST', cuerpo: datos })).data
}

export async function enviarCandidatosEmpresa(procesoId, candidatos, { ampliar = false } = {}) {
  return (
    await pedir(`/empresa/solicitudes/${procesoId}/candidatos`, { metodo: 'POST', cuerpo: { candidatos, ampliar } })
  ).data
}

export async function crearNuevaVacanteEmpresa() {
  return (await pedir('/empresa/solicitudes', { metodo: 'POST' })).data
}

export async function descartarBorradorEmpresa(procesoId) {
  return (await pedir(`/empresa/solicitudes/${procesoId}`, { metodo: 'DELETE' })).data
}

export function vacanteDescartable(solicitud) {
  if (!solicitud || solicitud.estado !== 'PENDIENTE_PAGO') return false
  if (solicitud.accesos?.length > 0) return false
  if ((solicitud.candidatos?.length ?? 0) > 0) return false
  return true
}

export async function obtenerSolicitudesEmpresa() {
  return (await pedir('/empresa/solicitudes')).data
}

export async function obtenerInformeEmpresa(postulacionId) {
  return (await pedir(`/empresa/postulaciones/${postulacionId}/informe`)).data
}

export async function obtenerSolicitudesEmpresaAdmin() {
  return (await pedir('/admin/solicitudes-empresa')).data
}

export async function aprobarSolicitudEmpresa(procesoId) {
  return (await pedir(`/admin/solicitudes-empresa/${procesoId}/aprobar`, { metodo: 'POST' })).data
}
