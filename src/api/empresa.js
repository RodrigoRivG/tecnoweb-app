import { pedir } from './cliente.js'

export async function obtenerCatalogoSolicitud() {
  return (await pedir('/empresa/catalogo-solicitud')).data
}

export async function registrarSolicitudEmpresa(datos) {
  return (await pedir('/empresa/registro-solicitud', { metodo: 'POST', cuerpo: datos })).data
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
