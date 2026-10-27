import { pedir } from './cliente.js'

/** Devuelve { token, usuario }. */
export async function registrarEgresado(datos) {
  return (await pedir('/registro/egresado', { metodo: 'POST', cuerpo: datos })).data
}

/** Devuelve { token, usuario }. */
export async function iniciarSesionEnApi(datos) {
  return (await pedir('/auth/login', { metodo: 'POST', cuerpo: datos })).data
}

export async function obtenerUsuarioActual() {
  return (await pedir('/auth/me')).data
}

export function cerrarSesionEnApi() {
  return pedir('/auth/logout', { metodo: 'POST' })
}
