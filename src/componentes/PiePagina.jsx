import { useEffect, useState } from 'react'
import { registrarVisita } from '../api/visitas.js'
import { useSesion } from '../sesion/SesionContext.jsx'

const formatoVisitas = new Intl.NumberFormat('es-BO')

function crearClaveVisita() {
  if (crypto.randomUUID) return crypto.randomUUID()

  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hexadecimal = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')

  return hexadecimal.replace(/^(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})$/, '$1-$2-$3-$4-$5')
}

export default function PiePagina({ ruta }) {
  const { cargando } = useSesion()
  const [claveVisita] = useState(crearClaveVisita)
  const [visitas, setVisitas] = useState(null)
  const [error, setError] = useState(false)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    if (cargando) return undefined

    let vigente = true
    // Espera a que se resuelvan las redirecciones de las rutas protegidas.
    const temporizador = window.setTimeout(() => {
      registrarVisita(ruta, claveVisita)
        .then((total) => vigente && setVisitas(total))
        .catch(() => vigente && setError(true))
    }, 150)

    return () => {
      vigente = false
      window.clearTimeout(temporizador)
    }
  }, [ruta, claveVisita, cargando, intento])

  function reintentar() {
    setError(false)
    setIntento((anterior) => anterior + 1)
  }

  const total = visitas === null ? '…' : formatoVisitas.format(visitas)

  return (
    <footer className="pie">
      <div className="contenedor pie__contenido">
        <p>Bolsa de talento para egresados</p>
        <div className="pie__visitas">
          <p role="status">Visitas a esta página: {error ? 'No disponibles' : <strong>{total}</strong>}</p>
          {error && <button type="button" className="boton boton--secundario boton--chico" onClick={reintentar}>Reintentar</button>}
        </div>
      </div>
    </footer>
  )
}
