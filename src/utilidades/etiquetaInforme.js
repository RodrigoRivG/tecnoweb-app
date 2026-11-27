const ETIQUETAS = {
  CV_ANALISIS: 'Evaluación curricular',
  '16PF_FORMA_A': 'Personalidad',
  '16PF_FORMA_B': 'Personalidad',
  ENTREVISTA: 'Entrevista',
  TMMS_24: 'Inteligencia emocional',
  ES_USTED_MUY_HABIL: 'Inteligencia general',
  TEST_INTELIGENCIA: 'Inteligencia general',
  DOMINOS_D48: 'Inteligencia general',
  RAVEN: 'Inteligencia general',
  TEST_PURDUE_NO_VERBAL: 'Inteligencia general',
  TEST_PURDUE_NO_VERBAL_FORMA_B: 'Inteligencia general',
  TEST_LECTURA_COMPRENSIVA: 'Lectura comprensiva',
  TEST_LECTURA_COMPRENSIVA_1: 'Lectura comprensiva',
  TEST_CODIFICACION: 'Aptitud numérica',
  TEST_APTITUD_MECANICA: 'Prueba técnica',
  PPA: 'Promedio académico (PPA)',
}

export function etiquetaFilaInforme(fila) {
  if (!fila) return '—'
  return ETIQUETAS[fila.codigo] ?? fila.etiqueta ?? fila.codigo ?? 'Evaluación'
}