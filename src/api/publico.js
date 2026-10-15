import { pedir } from './cliente.js'

export async function obtenerFacultades() {
  return (await pedir('/publico/facultades')).data
}

export async function obtenerConvocatorias(filtros) {
  return (await pedir('/publico/convocatorias', { parametros: filtros })).data
}

/** Devuelve { data, meta } con la paginación de Laravel. */
export function obtenerPerfiles(filtros) {
  return pedir('/publico/perfiles', { parametros: filtros })
}
