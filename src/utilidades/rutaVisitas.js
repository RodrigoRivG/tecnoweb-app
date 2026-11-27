/**
 * Ruta canónica que entiende la API de visitas (patrón de vista, no URL con IDs reales).
 */
export function rutaParaRegistroVisita(coincidencias, pathname) {
  const segmentos = coincidencias
    .map(({ route }) => route.path)
    .filter((path) => path && path !== '*' && path !== '/*')

  let ruta
  if (segmentos.length === 0) {
    ruta = pathname.replace(/\/+$/, '') || '/'
  } else {
    ruta = segmentos.join('/').replace(/\/+/g, '/')
    if (!ruta.startsWith('/')) ruta = `/${ruta}`
  }

  return ruta.replace(/:[A-Za-z_][A-Za-z0-9_]*/g, ':id')
}