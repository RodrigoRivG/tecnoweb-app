import { pedir } from './cliente.js'

/**
 * Lista todas las postulaciones de todos los procesos para el panel de evaluador/admin.
 */
export async function obtenerTodasPostulaciones() {
  return (await pedir('/evaluador/postulaciones')).data
}


/**
 * Obtiene los criterios de rúbrica de CV, información del postulante y documento adjunto.
 */
export async function obtenerFormularioAnalisisCv(postulacionId) {
  return (await pedir(`/evaluador/postulaciones/${postulacionId}/analisis-cv`)).data
}

/**
 * Envía la calificación de la rúbrica de CV.
 */
export async function calificarAnalisisCv(postulacionId, datos) {
  return await pedir(`/evaluador/postulaciones/${postulacionId}/calificar-cv`, {
    metodo: 'POST',
    cuerpo: datos,
  })
}

/**
 * Aprueba los requisitos documentales de una postulación.
 */
export async function aprobarRequisitos(postulacionId) {
  return (await pedir(`/evaluador/postulaciones/${postulacionId}/aprobar-requisitos`, {
    metodo: 'POST',
  })).data
}

/**
 * Obtiene los criterios de rúbrica de Entrevista e información del postulante.
 */
export async function obtenerFormularioEntrevista(postulacionId) {
  return (await pedir(`/evaluador/postulaciones/${postulacionId}/entrevista`)).data
}

/**
 * Envía la calificación de la rúbrica de Entrevista.
 */
export async function calificarEntrevista(postulacionId, datos) {
  return await pedir(`/evaluador/postulaciones/${postulacionId}/calificar-entrevista`, {
    metodo: 'POST',
    cuerpo: datos,
  })
}

/**
 * Obtiene el cuadro de honor y ranking ponderado de un proceso.
 */
export async function obtenerRankingProceso(procesoId) {
  return (await pedir(`/evaluador/procesos/${procesoId}/ranking`)).data
}

/**
 * Publica y adjudica las plazas para el proceso.
 */
export async function adjudicarSeleccionProceso(procesoId, datos = {}) {
  return await pedir(`/evaluador/procesos/${procesoId}/adjudicar`, {
    metodo: 'POST',
    cuerpo: datos,
  })
}


