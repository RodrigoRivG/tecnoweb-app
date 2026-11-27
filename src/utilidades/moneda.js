const CODIGO_DEFECTO = 'BOB'

export function formatearMontoCentavos(centavos, moneda = 'bob') {
  const codigo = (moneda || 'bob').toUpperCase()
  try {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: codigo }).format(centavos / 100)
  } catch {
    const monto = (centavos / 100).toFixed(2)
    if (codigo === 'BOB') return `Bs ${monto}`
    return `${monto} ${codigo}`
  }
}

export { CODIGO_DEFECTO as monedaPorDefecto }