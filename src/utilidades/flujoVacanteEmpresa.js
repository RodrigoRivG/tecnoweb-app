/**
 * Devuelve el siguiente paso recomendado para mostrar un solo CTA claro en panel y detalle.
 */
export function siguientePasoVacante(solicitud) {
  if (!solicitud) return null

  if (solicitud.datos_puesto_pendientes) {
    return {
      etiqueta: 'Completar vacante',
      descripcion: 'Define puesto, 16PF, habilidades y candidatos (4 pasos).',
      ruta: `/empresa/solicitudes/${solicitud.proceso_id}/completar`,
      estado: undefined,
    }
  }

  if (solicitud.estado === 'PENDIENTE_PAGO') {
    if ((solicitud.candidatos?.length ?? 0) === 0) {
      return {
        etiqueta: 'Registrar candidatos',
        descripcion: 'Paso 4: quién rendirá el examen.',
        ruta: `/empresa/solicitudes/${solicitud.proceso_id}/completar`,
        estado: { pasoInicial: 3 },
      }
    }
    return {
      etiqueta: `Pagar (${solicitud.candidatos.length} candidato${solicitud.candidatos.length === 1 ? '' : 's'})`,
      descripcion: 'Activa los accesos tras el cobro.',
      ruta: `/empresa/solicitudes/${solicitud.proceso_id}/pago`,
      estado: undefined,
    }
  }

  if (solicitud.estado === 'EN_CURSO' && (solicitud.candidatos_pendientes_pago ?? 0) > 0) {
    return {
      etiqueta: `Pagar ampliación (${solicitud.candidatos_pendientes_pago} nuevo${solicitud.candidatos_pendientes_pago === 1 ? '' : 's'})`,
      descripcion: 'Hay candidatos nuevos esperando pago.',
      ruta: `/empresa/solicitudes/${solicitud.proceso_id}/pago?ampliacion=1`,
      estado: undefined,
    }
  }

  return null
}

/** Solo pasos pendientes (borrador, pago, ampliación sin pagar) — no “agregar” en curso normal. */
export function accionUrgenteVacante(solicitud) {
  if (!solicitud) return null
  if (solicitud.datos_puesto_pendientes) return siguientePasoVacante(solicitud)
  if (solicitud.estado === 'PENDIENTE_PAGO') return siguientePasoVacante(solicitud)
  if (solicitud.estado === 'EN_CURSO' && (solicitud.candidatos_pendientes_pago ?? 0) > 0) {
    return siguientePasoVacante(solicitud)
  }
  return null
}