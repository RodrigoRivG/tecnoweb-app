import { useEffect, useState } from 'react'
import { actualizarPerfilIdeal, obtenerPerfilIdeal } from '../api/admin.js'
import CuadroPerfilBipolar from './CuadroPerfilBipolar.jsx'

function aplicarNivel(filas, dimensionId, valor, campo) {
  return filas.map((fila) => (
    fila.dimension_id === dimensionId ? { ...fila, [campo]: valor } : fila
  ))
}

export default function ModalPerfilIdeal({ procesoId, nombre, alCerrar }) {
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [personalidad, setPersonalidad] = useState([])
  const [blandas, setBlandas] = useState([])

  useEffect(() => {
    let activo = true
    obtenerPerfilIdeal(procesoId)
      .then((data) => {
        if (!activo) return
        setPersonalidad(data.perfil_personalidad ?? [])
        setBlandas((data.perfil_habilidades_blandas ?? []).map((fila) => ({
          ...fila,
          esten_ideal: fila.valor_ideal,
        })))
      })
      .catch((err) => {
        if (activo) setError(err.message || 'No se pudo cargar el perfil ideal.')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [procesoId])

  async function guardar() {
    setGuardando(true)
    setError(null)
    setAviso(null)

    const niveles = [
      ...personalidad.map((fila) => ({ dimension_id: fila.dimension_id, valor_ideal: fila.esten_ideal })),
      ...blandas.map((fila) => ({ dimension_id: fila.dimension_id, valor_ideal: fila.esten_ideal })),
    ]

    try {
      const data = await actualizarPerfilIdeal(procesoId, { niveles })
      setPersonalidad(data.perfil_personalidad ?? [])
      setBlandas((data.perfil_habilidades_blandas ?? []).map((fila) => ({
        ...fila,
        esten_ideal: fila.valor_ideal,
      })))
      setAviso('Perfil ideal guardado.')
    } catch (err) {
      setError(err.message || 'No se pudo guardar el perfil ideal.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="perfil-modal" role="presentation" onClick={alCerrar}>
      <div
        className="perfil-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-perfil-ideal"
        onClick={(evento) => evento.stopPropagation()}
      >
        <header className="perfil-modal__cabecera">
          <div>
            <h2 id="titulo-perfil-ideal">Perfil ideal</h2>
            <p>{nombre}</p>
          </div>
          <button type="button" className="boton boton--secundario" onClick={alCerrar}>Cerrar</button>
        </header>

        {cargando && <p>Cargando cuadros…</p>}
        {error && <p className="aviso aviso--error">{error}</p>}
        {aviso && <p className="aviso aviso--exito">{aviso}</p>}

        {!cargando && (
          <>
            <CuadroPerfilBipolar
              titulo="Personalidad (16PF)"
              descripcion="Haz clic en un esten del 1 al 10 para marcar lo que busca la empresa. Clic de nuevo para quitarlo."
              filas={personalidad}
              editable
              onCambiarIdeal={(dimensionId, valor) => setPersonalidad((filas) => aplicarNivel(filas, dimensionId, valor, 'esten_ideal'))}
            />
            <CuadroPerfilBipolar
              titulo="Habilidades blandas"
              descripcion="Nivel deseado en cada competencia socioemocional."
              filas={blandas}
              editable
              onCambiarIdeal={(dimensionId, valor) => setBlandas((filas) => aplicarNivel(filas, dimensionId, valor, 'esten_ideal'))}
            />
            <div className="perfil-modal__acciones">
              <button type="button" className="boton" disabled={guardando} onClick={guardar}>
                {guardando ? 'Guardando…' : 'Guardar perfil ideal'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
