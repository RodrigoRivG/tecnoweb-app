import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { cerrarSesionEnApi, obtenerUsuarioActual } from '../api/auth.js'
import { guardarToken, leerToken } from '../api/cliente.js'

const SesionContext = createContext(null)

export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(() => leerToken() !== null)

  // Recupera el usuario si quedó un token de una visita anterior
  useEffect(() => {
    if (leerToken() === null) {
      return
    }

    let vigente = true

    obtenerUsuarioActual()
      .then((datos) => vigente && setUsuario(datos))
      .catch(() => vigente && guardarToken(null))
      .finally(() => vigente && setCargando(false))

    return () => {
      vigente = false
    }
  }, [])

  const iniciarSesion = useCallback(({ token, usuario: datosUsuario }) => {
    guardarToken(token)
    setUsuario(datosUsuario)
  }, [])

  const cerrarSesion = useCallback(async () => {
    try {
      await cerrarSesionEnApi()
    } catch {
      // El token se descarta igual en este navegador
    }

    guardarToken(null)
    setUsuario(null)
  }, [])

  const valor = useMemo(
    () => ({ usuario, cargando, iniciarSesion, cerrarSesion }),
    [usuario, cargando, iniciarSesion, cerrarSesion],
  )

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSesion() {
  return useContext(SesionContext)
}
