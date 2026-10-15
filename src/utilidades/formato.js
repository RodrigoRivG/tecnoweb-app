const FORMATO_FECHA = new Intl.DateTimeFormat('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })

/** "2026-10-14" → "14 de octubre de 2026", sin desfase de zona horaria. */
export function formatearFecha(fechaIso) {
  if (!fechaIso) {
    return ''
  }

  const [anio, mes, dia] = fechaIso.slice(0, 10).split('-').map(Number)

  return FORMATO_FECHA.format(new Date(anio, mes - 1, dia))
}

/** "51.00" → "51" y "60.50" → "60,5". */
export function formatearPuntaje(valor) {
  return Number(valor).toLocaleString('es-BO', { maximumFractionDigits: 2 })
}
