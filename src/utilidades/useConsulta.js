import { useCallback, useEffect, useState } from 'react'

/**
 * Ejecuta consultar(parametros) cada vez que cambian los parámetros y descarta respuestas viejas.
 * Mientras carga conserva los datos anteriores para no vaciar la pantalla.
 */
export function useConsulta(consultar, parametros) {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState({ clave: null, datos: null, error: null })
  const clave = JSON.stringify([parametros ?? null, intento])

  useEffect(() => {
    let vigente = true

    consultar(JSON.parse(clave)[0])
      .then((datos) => vigente && setResultado({ clave, datos, error: null }))
      .catch((error) => vigente && setResultado((anterior) => ({ clave, datos: anterior.datos, error })))

    return () => {
      vigente = false
    }
  }, [consultar, clave])

  const cargando = resultado.clave !== clave
  const reintentar = useCallback(() => setIntento((n) => n + 1), [])

  return { datos: resultado.datos, error: cargando ? null : resultado.error, cargando, reintentar }
}
