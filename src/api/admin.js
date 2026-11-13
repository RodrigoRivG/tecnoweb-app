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

export async function obtenerUsuariosAdmin(filtros) {
  return (await pedir('/admin/usuarios', { parametros: filtros })).data
}

export async function crearUsuarioAdmin(datos) {
  return (await pedir('/admin/usuarios', { metodo: 'POST', cuerpo: datos })).data
}

export async function actualizarUsuarioAdmin(id, datos) {
  return (await pedir(`/admin/usuarios/${id}`, { metodo: 'PUT', cuerpo: datos })).data
}

export async function obtenerRolesPermisosAdmin() {
  return (await pedir('/admin/roles-permisos')).data
}

export async function actualizarPermisosRolAdmin(rolId, permisosIds) {
  return (await pedir(`/admin/roles/${rolId}/permisos`, {
    metodo: 'PUT',
    cuerpo: { permisos_ids: permisosIds },
  })).data
}

export async function obtenerConvocatoriasAdmin(filtros) {
  return (await pedir('/admin/convocatorias', { parametros: filtros })).data
}

export async function obtenerConvocatoriaAdmin(id) {
  return (await pedir(`/admin/convocatorias/${id}`)).data
}

export async function crearConvocatoriaAdmin(datos) {
  return (await pedir('/admin/convocatorias', { metodo: 'POST', cuerpo: datos })).data
}

export async function actualizarConvocatoriaAdmin(id, datos) {
  return (await pedir(`/admin/convocatorias/${id}`, { metodo: 'PUT', cuerpo: datos })).data
}

export async function eliminarConvocatoriaAdmin(id) {
  return (await pedir(`/admin/convocatorias/${id}`, { metodo: 'DELETE' }))
}

// Banco de Preguntas y Pruebas Psicotécnicas
export async function obtenerCatalogoPruebasAdmin() {
  return (await pedir('/admin/banco-preguntas/catalogo')).data
}

export async function obtenerPreguntasAdmin(filtros) {
  return (await pedir('/admin/preguntas', { parametros: filtros })).data
}

export async function obtenerPreguntaAdmin(id) {
  return (await pedir(`/admin/preguntas/${id}`)).data
}

export async function crearPreguntaAdmin(datos) {
  return (await pedir('/admin/preguntas', { metodo: 'POST', cuerpo: datos }))
}

export async function actualizarPreguntaAdmin(id, datos) {
  return (await pedir(`/admin/preguntas/${id}`, { metodo: 'PUT', cuerpo: datos }))
}

export async function eliminarPreguntaAdmin(id) {
  return (await pedir(`/admin/preguntas/${id}`, { metodo: 'DELETE' }))
}


