import { pedir } from './cliente.js'

export async function obtenerFacultadesAdmin() {
  return (await pedir('/admin/facultades')).data
}

export async function crearFacultad(datos) {
  return (await pedir('/admin/facultades', { metodo: 'POST', cuerpo: datos })).data
}

export async function actualizarFacultad(id, datos) {
  return (await pedir(`/admin/facultades/${id}`, { metodo: 'PUT', cuerpo: datos })).data
}

export async function eliminarFacultad(id) {
  return pedir(`/admin/facultades/${id}`, { metodo: 'DELETE' })
}

export async function obtenerCarrerasAdmin(filtros) {
  return (await pedir('/admin/carreras', { parametros: filtros })).data
}

export async function crearCarrera(datos) {
  return (await pedir('/admin/carreras', { metodo: 'POST', cuerpo: datos })).data
}

export async function actualizarCarrera(id, datos) {
  return (await pedir(`/admin/carreras/${id}`, { metodo: 'PUT', cuerpo: datos })).data
}

export async function eliminarCarrera(id) {
  return pedir(`/admin/carreras/${id}`, { metodo: 'DELETE' })
}

