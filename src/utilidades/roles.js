export function esAdmin(usuario) {
  return usuario?.rol?.codigo === 'ADMIN'
}

export function esAyudante(usuario) {
  return usuario?.rol?.codigo === 'AYUDANTE'
}

export function esEvaluador(usuario) {
  return usuario?.rol?.codigo === 'ADMIN' || usuario?.rol?.codigo === 'AYUDANTE'
}

export function esEgresado(usuario) {
  return usuario?.rol?.codigo === 'EGRESADO'
}

/** Página a la que va cada rol al iniciar sesión. */
export function inicioDe(usuario) {
  return esEvaluador(usuario) ? '/panel' : '/mi-cuenta'
}
