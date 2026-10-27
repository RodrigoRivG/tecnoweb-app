export function esAdmin(usuario) {
  return usuario?.rol?.codigo === 'ADMIN'
}

/** Página a la que va cada rol al iniciar sesión. */
export function inicioDe(usuario) {
  return esAdmin(usuario) ? '/panel' : '/mi-cuenta'
}
