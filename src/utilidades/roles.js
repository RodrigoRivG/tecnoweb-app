export function esAdmin(usuario) {
  return usuario?.rol?.codigo === 'ADMIN'
}

export function esEgresado(usuario) {
  return usuario?.rol?.codigo === 'EGRESADO'
}

/** Página a la que va cada rol al iniciar sesión. */
export function inicioDe(usuario) {
  return esAdmin(usuario) ? '/panel' : '/mi-cuenta'
}

