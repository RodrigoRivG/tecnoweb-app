const URL_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

const CLAVE_TOKEN = 'tecno.token'

export function leerToken() {
  try {
    return localStorage.getItem(CLAVE_TOKEN)
  } catch {
    return null
  }
}

export function guardarToken(token) {
  try {
    if (token) {
      localStorage.setItem(CLAVE_TOKEN, token)
    } else {
      localStorage.removeItem(CLAVE_TOKEN)
    }
  } catch {
    // Sin almacenamiento disponible la sesión dura lo que la pestaña
  }
}

/**
 * Error de la API con el código HTTP y, en los 422, los mensajes por campo.
 */
export class ErrorApi extends Error {
  constructor(estado, mensaje, errores = {}) {
    super(mensaje)
    this.estado = estado
    this.errores = errores
  }

  /** Primer mensaje de cada campo: { correo: '...', ppa: '...' } */
  get erroresPorCampo() {
    return Object.fromEntries(
      Object.entries(this.errores).map(([campo, mensajes]) => [campo, mensajes[0]]),
    )
  }
}

const MENSAJES_POR_ESTADO = {
  401: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'No encontramos lo que buscabas.',
  429: 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.',
}

/**
 * Llama a /api/v1{ruta} y devuelve el JSON. Lanza ErrorApi si la respuesta no es 2xx.
 */
export async function pedir(ruta, { metodo = 'GET', cuerpo, parametros } = {}) {
  const url = new URL(`${URL_BASE}/api/v1${ruta}`)

  Object.entries(parametros ?? {}).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '' && valor !== false) {
      url.searchParams.set(clave, valor === true ? '1' : valor)
    }
  })

  const cabeceras = { Accept: 'application/json' }
  const token = leerToken()

  if (token) {
    cabeceras.Authorization = `Bearer ${token}`
  }

  if (cuerpo !== undefined) {
    cabeceras['Content-Type'] = 'application/json'
  }

  let respuesta

  try {
    respuesta = await fetch(url, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    })
  } catch {
    throw new ErrorApi(0, 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.')
  }

  if (respuesta.status === 204) {
    return null
  }

  const datos = await respuesta.json().catch(() => null)

  if (!respuesta.ok) {
    // En 401, 404 y 429 el mensaje de Laravel es técnico; en el resto (422, 403, 423) viene en español
    const mensaje = [401, 404, 429].includes(respuesta.status)
      ? MENSAJES_POR_ESTADO[respuesta.status]
      : datos?.message || MENSAJES_POR_ESTADO[respuesta.status] || 'Ocurrió un error inesperado. Inténtalo más tarde.'

    throw new ErrorApi(respuesta.status, mensaje, datos?.errors ?? {})
  }

  return datos
}
