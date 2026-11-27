const ANIO_ACTUAL = new Date().getFullYear()
export const FECHA_NACIMIENTO_MINIMA = '1940-01-01'

export function fechaLimiteMayoriaEdad() {
  return new Date(ANIO_ACTUAL - 18, new Date().getMonth(), new Date().getDate()).toISOString().slice(0, 10)
}

export function validarCiNumero(ci) {
  if (!ci?.trim()) return 'Ingresa la cédula.'
  if (!/^\d{4,15}$/.test(ci.trim())) return 'Solo números (4 a 15 dígitos).'
  return null
}

export function validarFechaMayoria(fecha) {
  const hoy = new Date().toISOString().slice(0, 10)
  if (!fecha) return 'Indica la fecha de nacimiento.'
  if (fecha < FECHA_NACIMIENTO_MINIMA) return 'La fecha debe ser a partir de 1940.'
  if (fecha >= hoy) return 'La fecha debe ser anterior a hoy.'
  if (fecha > fechaLimiteMayoriaEdad()) return 'Debe ser mayor de 18 años.'
  return null
}

export function validarTelefonoBolivia(telefono, { requerido = false } = {}) {
  if (!telefono?.trim()) {
    return requerido ? 'Ingresa el teléfono.' : null
  }
  if (!/^\d{7,8}$/.test(telefono.trim())) return 'Usa 7 u 8 dígitos (Bolivia).'
  return null
}

export function validarNit(nit) {
  if (!nit?.trim()) return 'Ingresa el NIT.'
  if (!/^\d{7,15}$/.test(nit.trim())) return 'El NIT debe tener entre 7 y 15 dígitos.'
  return null
}

export function validarCorreosDistintos(correoA, correoB, etiquetaA = 'empresa', etiquetaB = 'acceso') {
  if (!correoA?.trim() || !correoB?.trim()) return null
  if (correoA.trim().toLowerCase() === correoB.trim().toLowerCase()) {
    return `El correo de ${etiquetaA} debe ser distinto al de ${etiquetaB}.`
  }
  return null
}

export function validarCiExpedido(expedido) {
  if (!expedido?.trim()) return 'Indica dónde se expidió el carnet.'
  return null
}

export function validarPassword(password, { requerido = true, confirmacion } = {}) {
  if (!password) {
    return requerido ? 'Ingresa una contraseña.' : null
  }
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Mínimo 8 caracteres, con letras y números.'
  }
  if (confirmacion !== undefined && password !== confirmacion) {
    return 'Las contraseñas no coinciden.'
  }
  return null
}