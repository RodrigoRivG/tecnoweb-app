const ETIQUETA_ESTADO = {
  EN_PROCESO: 'En proceso',
  APROBADA: 'Aprobada',
  NO_APROBADA: 'No aprobada',
  RETIRADA: 'Retirada',
  INSCRITA: 'Inscrita',
}

export function etiquetaEstadoPostulacion(estado) {
  return ETIQUETA_ESTADO[estado] ?? estado
}

export function claseInsigniaEstado(estado) {
  if (estado === 'APROBADA') return 'insignia--exito'
  if (estado === 'NO_APROBADA') return 'insignia--error'
  if (estado === 'EN_PROCESO' || estado === 'INSCRITA') return 'insignia--pendiente'
  return 'insignia--neutro'
}

export function claseChipEtapa(estado) {
  if (estado === 'APROBADA') return 'etapa-chip--aprobada'
  if (estado === 'EN_REVISION') return 'etapa-chip--revision'
  if (estado === 'PENDIENTE' || estado === 'EN_CURSO') return 'etapa-chip--pendiente'
  if (estado === 'REPROBADA') return 'etapa-chip--reprobada'
  return 'etapa-chip--bloqueada'
}

export function prefijoChipEtapa(estado) {
  if (estado === 'APROBADA') return '✓'
  if (estado === 'EN_REVISION') return '🔍'
  if (estado === 'PENDIENTE' || estado === 'EN_CURSO') return '⏳'
  if (estado === 'REPROBADA') return '✗'
  return '🔒'
}

/** Texto del botón principal hacia el detalle de la postulación. */
export function textoAccionPostulacion(postulacion) {
  const etapas = postulacion.etapas ?? []
  const requisitos = etapas.find((e) => e.codigo === 'REQUISITOS')
  const psico = etapas.find((e) => e.codigo === 'EVALUACION_PSICOLOGICA')

  if (requisitos && !['APROBADA', 'OMITIDA'].includes(requisitos.estado)) {
    if (requisitos.estado === 'EN_REVISION') return 'Ver estado de mi documentación →'
    return 'Subir y gestionar documentos →'
  }

  if (psico && ['PENDIENTE', 'EN_CURSO'].includes(psico.estado)) {
    return 'Continuar evaluaciones →'
  }

  if (postulacion.estado === 'APROBADA') return 'Ver resultado de mi postulación →'
  if (postulacion.estado === 'NO_APROBADA') return 'Ver resumen de mi postulación →'

  return 'Continuar mi postulación →'
}