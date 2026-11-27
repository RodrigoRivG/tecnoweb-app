/** Etiqueta y estilo según el avance real del expediente (no solo la etapa activa). */
export function situacionExpediente(postulacion) {
  const codigo = postulacion.resumen?.situacion
  const pruebas = postulacion.resumen?.pruebas_psicometricas

  switch (codigo) {
    case 'seleccionado':
      return {
        codigo,
        etiqueta: 'Seleccionado',
        detalle: postulacion.ranking?.es_top
          ? `Top ranking · posición ${postulacion.ranking.posicion}`
          : postulacion.ranking
            ? `Ranking posición ${postulacion.ranking.posicion}`
            : 'Proceso cerrado a su favor',
        clase: 'insignia--exito',
      }
    case 'rechazado':
      return {
        codigo,
        etiqueta: 'No seleccionado',
        detalle: pruebas?.completas
          ? 'Completó evaluaciones y el proceso cerró en descarte'
          : 'Proceso cerrado sin selección',
        clase: 'insignia--error',
      }
    case 'retirado':
      return {
        codigo,
        etiqueta: 'Retirada',
        detalle: 'El postulante abandonó el proceso',
        clase: 'insignia--neutro',
      }
    case 'pruebas_completas':
      return {
        codigo,
        etiqueta: 'Pruebas completas',
        detalle: 'Siguientes etapas (CV, entrevista, selección)',
        clase: 'insignia--primario',
      }
    case 'en_pruebas': {
      const n = pruebas?.con_resultado ?? 0
      return {
        codigo,
        etiqueta: n > 0 ? `En pruebas (${n})` : 'En evaluación psicométrica',
        detalle: 'Aún no termina la batería de tests',
        clase: 'insignia--advertencia',
      }
    }
    default:
      return {
        codigo: 'sin_pruebas',
        etiqueta: 'Sin pruebas',
        detalle: 'Solo inscripción o etapas previas (PPA, documentos)',
        clase: 'insignia--secundario',
      }
  }
}

export const FILTROS_SITUACION = [
  { valor: '', etiqueta: 'Todos' },
  { valor: 'sin_pruebas', etiqueta: 'Sin pruebas' },
  { valor: 'en_pruebas', etiqueta: 'En pruebas' },
  { valor: 'pruebas_completas', etiqueta: 'Pruebas OK' },
  { valor: 'seleccionado', etiqueta: 'Seleccionados' },
  { valor: 'rechazado', etiqueta: 'No seleccionados' },
]