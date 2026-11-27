export const CANDIDATO_VACIO = {
  nombres: '',
  apellido_paterno: '',
  ci_numero: '',
  fecha_nacimiento: '',
  correo: '',
}

export function validarCandidatos(candidatos) {
  const errores = {}
  const hoy = new Date().toISOString().slice(0, 10)
  if (!candidatos.length) errores.candidatos = 'Agrega al menos un candidato.'
  candidatos.forEach((candidato, indice) => {
    if (!candidato.nombres?.trim()) errores[`candidatos.${indice}.nombres`] = 'Obligatorio.'
    if (!candidato.apellido_paterno?.trim()) errores[`candidatos.${indice}.apellido_paterno`] = 'Obligatorio.'
    if (!candidato.ci_numero?.trim()) errores[`candidatos.${indice}.ci_numero`] = 'Obligatorio.'
    if (!candidato.fecha_nacimiento) errores[`candidatos.${indice}.fecha_nacimiento`] = 'Obligatorio.'
    else if (candidato.fecha_nacimiento >= hoy) errores[`candidatos.${indice}.fecha_nacimiento`] = 'Fecha inválida.'
    if (!candidato.correo?.trim()) errores[`candidatos.${indice}.correo`] = 'Obligatorio.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidato.correo.trim())) {
      errores[`candidatos.${indice}.correo`] = 'Correo no válido (ej. nombre@empresa.com).'
    }
  })
  return errores
}