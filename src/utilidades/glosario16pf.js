/** Nombres cortos alineados al glosario clásico del informe (factor → etiqueta). */
export const NOMBRE_FACTOR_16PF = {
  A: 'Sociabilidad',
  B: 'Capacidad escolar',
  C: 'Estabilidad emocional',
  E: 'Dominancia',
  F: 'Animación',
  G: 'Atención a normas',
  H: 'Atrevimiento',
  I: 'Sensibilidad',
  L: 'Vigilancia',
  M: 'Abstracción',
  N: 'Privacidad',
  O: 'Aprensión',
  Q1: 'Apertura al cambio',
  Q2: 'Autosuficiencia',
  Q3: 'Perfeccionismo',
  Q4: 'Tensión',
}

export function nombreFactor16Pf(fila) {
  return NOMBRE_FACTOR_16PF[fila.codigo] ?? fila.nombre ?? fila.codigo
}