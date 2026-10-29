import { descargarArchivo, pedir } from './cliente.js'

/**
 * Convocatorias abiertas para las carreras del egresado autenticado,
 * con la evaluación de PPA (cumple_ppa) y estado de postulación (ya_postulado).
 */
export async function obtenerConvocatoriasEgresado() {
  return (await pedir('/egresado/convocatorias')).data
}

/**
 * Postula al egresado a una convocatoria abierta.
 * El backend valida que cumpla el umbral de PPA mínimo de su facultad;
 * si no cumple, lanza un ErrorApi con código 422.
 */
export async function postularAConvocatoria(procesoId) {
  return (await pedir('/egresado/postulaciones', {
    metodo: 'POST',
    cuerpo: { proceso_id: procesoId },
  })).data
}

/**
 * Lista de postulaciones activas e históricas del egresado.
 */
export async function obtenerMisPostulaciones() {
  return (await pedir('/egresado/postulaciones')).data
}

/**
 * Detalle de una postulación con sus etapas y requisitos documentales.
 */
export async function obtenerDetallePostulacion(postulacionId) {
  return (await pedir(`/egresado/postulaciones/${postulacionId}`)).data
}

/**
 * Sube un archivo documental para un requisito de una postulación.
 * @param {number} postulacionId
 * @param {string} tipoDocumento (ej. CURRICULUM_VITAE, CEDULA_IDENTIDAD, FOTOGRAFIA, HISTORICO_ACADEMICO)
 * @param {File} archivo
 */
export async function subirDocumentoPostulacion(postulacionId, tipoDocumento, archivo) {
  const formulario = new FormData()
  formulario.append('tipo_documento', tipoDocumento)
  formulario.append('archivo', archivo)

  return (await pedir(`/egresado/postulaciones/${postulacionId}/documentos`, {
    metodo: 'POST',
    cuerpo: formulario,
  })).data
}

/**
 * Descarga el archivo de un documento subido por el egresado.
 * @param {number} documentoId
 * @param {string} nombreArchivo
 */
export async function descargarDocumentoPostulacion(documentoId, nombreArchivo) {
  return descargarArchivo(`/egresado/documentos/${documentoId}/archivo`, nombreArchivo)
}


