/** Etiqueta de nota para pestañas de pruebas en la etapa psicológica. */
export function etiquetaNotaPrueba(prueba) {
  if (!prueba?.completada) {
    return { principal: '—', secundaria: 'Pendiente' }
  }

  const codigo = prueba.codigo ?? ''
  const pct =
    prueba.puntaje_normalizado != null && Number.isFinite(Number(prueba.puntaje_normalizado))
      ? `${Number(prueba.puntaje_normalizado)}%`
      : null

  if (codigo === '16PF_FORMA_A' || codigo === '16PF_FORMA_B') {
    return { principal: pct ?? 'Registrado', secundaria: 'Perfil 16PF' }
  }

  if (['ES_USTED_MUY_HABIL', 'DOMINOS_D48', 'RAVEN', 'TEST_INTELIGENCIA'].includes(codigo)) {
    const bruto =
      prueba.puntaje_bruto != null && prueba.puntaje_maximo != null
        ? `${prueba.puntaje_bruto} / ${prueba.puntaje_maximo} pts`
        : null
    return { principal: pct ?? '—', secundaria: bruto ?? 'Aptitud cognitiva' }
  }

  return {
    principal: pct ?? '—',
    secundaria: prueba.aprobada ? 'Aprobada' : 'Completada',
  }
}