import { Search } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router'

export default function BusquedaGlobal({ onBuscar }) {
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const busqueda = parametros.get('q')?.trim() ?? ''

  function buscar(evento) {
    evento.preventDefault()
    const termino = (new FormData(evento.currentTarget).get('q') ?? '').trim()
    const consulta = termino ? new URLSearchParams({ q: termino }).toString() : ''

    onBuscar()
    navegar({ pathname: '/', search: consulta })
  }

  return (
    <form className="busqueda-global" role="search" aria-label="Búsqueda global" onSubmit={buscar}>
      <input
        key={busqueda}
        type="search"
        name="q"
        maxLength={100}
        defaultValue={busqueda}
        aria-label="Buscar convocatorias o perfiles por código"
        placeholder="Convocatorias o código de perfil"
      />
      <button type="submit" className="boton-nav busqueda-global__enviar" aria-label="Buscar">
        <Search size={18} aria-hidden="true" />
        <span>Buscar</span>
      </button>
    </form>
  )
}
