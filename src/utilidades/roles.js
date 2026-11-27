export const SECCIONES_PANEL = [
  { ruta: '/panel/facultades', titulo: 'Facultades', permiso: 'facultades.gestionar' },
  { ruta: '/panel/carreras', titulo: 'Carreras', permiso: 'carreras.gestionar' },
  { ruta: '/panel/convocatorias', titulo: 'Convocatorias', permiso: 'convocatorias.gestionar' },
  { ruta: '/panel/preguntas', titulo: 'Banco de Preguntas', permiso: 'preguntas.gestionar' },
  { ruta: '/panel/solicitudes-empresa', titulo: 'Solicitudes de empresa', permiso: 'solicitudes.gestionar' },
  { ruta: '/panel/postulaciones', titulo: 'Postulaciones', permiso: 'postulaciones.ver' },
  { ruta: '/panel/usuarios', titulo: 'Usuarios', permiso: ['usuarios.ver', 'usuarios.gestionar'] },
  { ruta: '/panel/roles-permisos', titulo: 'Roles y Permisos (RBAC)', permiso: 'permisos.gestionar' },
  { ruta: '/panel/bitacora', titulo: 'Bitácora de accesos', permiso: 'bitacora.ver' },
]

export function esAdmin(usuario) {
  return usuario?.rol?.codigo === 'ADMIN'
}

export function esAyudante(usuario) {
  return usuario?.rol?.codigo === 'AYUDANTE'
}

export function tienePermiso(usuario, permiso) {
  const pedidos = Array.isArray(permiso) ? permiso : [permiso]
  const asignados = usuario?.permisos ?? []

  return pedidos.some((codigo) => asignados.includes(codigo))
}

/** Entra al panel quien tiene un rol de gestión o al menos un permiso marcado. */
export function puedeEntrarAlPanel(usuario) {
  return Boolean(usuario?.rol?.es_panel) || (usuario?.permisos?.length ?? 0) > 0
}

export function esEvaluador(usuario) {
  return puedeEntrarAlPanel(usuario)
}

export function esEgresado(usuario) {
  return usuario?.rol?.codigo === 'EGRESADO'
}

export function esCandidatoExterno(usuario) {
  return usuario?.rol?.codigo === 'CANDIDATO_EXTERNO'
}

export function esEmpresa(usuario) {
  return usuario?.rol?.codigo === 'EMPRESA'
}

export function primeraSeccionPanel(usuario) {
  return SECCIONES_PANEL.find((seccion) => tienePermiso(usuario, seccion.permiso)) ?? null
}

/** Página a la que va cada rol al iniciar sesión. */
export function inicioDe(usuario) {
  if (puedeEntrarAlPanel(usuario)) return '/panel'
  if (esEmpresa(usuario)) return '/empresa'
  return '/mi-cuenta'
}
