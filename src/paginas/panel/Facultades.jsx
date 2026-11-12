import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import {
  actualizarFacultad,
  crearFacultad,
  eliminarFacultad,
  obtenerFacultadesAdmin,
} from '../../api/admin.js'
import Campo from '../../componentes/Campo.jsx'
import { ErrorCarga, Esqueleto } from '../../componentes/Estado.jsx'
import { formatearPuntaje } from '../../utilidades/formato.js'
import { useConsulta } from '../../utilidades/useConsulta.js'
import ListadoPanel from './ListadoPanel.jsx'

const ESTADO_INICIAL = {
  nombre: '',
  sigla: '',
  ppa_minimo: '51.00',
  activa: true,
}

export default function Facultades() {
  const { datos: facultades, error, cargando, reintentar } = useConsulta(obtenerFacultadesAdmin)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [formulario, setFormulario] = useState(ESTADO_INICIAL)
  const [erroresCampo, setErroresCampo] = useState({})
  const [aviso, setAviso] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState(null)

  function abrirCrear() {
    setEditandoId(null)
    setFormulario(ESTADO_INICIAL)
    setErroresCampo({})
    setAviso(null)
    setMostrarFormulario(true)
  }

  function abrirEditar(facultad) {
    setEditandoId(facultad.id)
    setFormulario({
      nombre: facultad.nombre ?? '',
      sigla: facultad.sigla ?? '',
      ppa_minimo: facultad.ppa_minimo ?? '51.00',
      activa: Boolean(facultad.activa),
    })
    setErroresCampo({})
    setAviso(null)
    setMostrarFormulario(true)
  }

  function cerrarFormulario() {
    setMostrarFormulario(false)
    setEditandoId(null)
    setFormulario(ESTADO_INICIAL)
    setErroresCampo({})
  }

  function cambiarCampo(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
    if (erroresCampo[campo]) {
      setErroresCampo((actual) => ({ ...actual, [campo]: undefined }))
    }
  }

  async function manejarSubmit(evento) {
    evento.preventDefault()
    setGuardando(true)
    setErroresCampo({})
    setAviso(null)

    const cuerpo = {
      nombre: formulario.nombre,
      sigla: formulario.sigla || null,
      ppa_minimo: formulario.ppa_minimo,
      activa: formulario.activa,
    }

    try {
      if (editandoId) {
        await actualizarFacultad(editandoId, cuerpo)
        setAviso({ tipo: 'exito', texto: 'Facultad actualizada correctamente.' })
      } else {
        await crearFacultad(cuerpo)
        setAviso({ tipo: 'exito', texto: 'Facultad creada correctamente.' })
      }
      cerrarFormulario()
      reintentar()
    } catch (err) {
      setErroresCampo(err.erroresPorCampo ?? {})
      setAviso({ tipo: 'error', texto: err.message })
    } finally {
      setGuardando(false)
    }
  }

  async function manejarEliminar(facultad) {
    if (!window.confirm(`¿Eliminar la facultad "${facultad.nombre}"?`)) {
      return
    }

    setEliminandoId(facultad.id)
    setAviso(null)

    try {
      await eliminarFacultad(facultad.id)
      if (editandoId === facultad.id) {
        cerrarFormulario()
      }
      setAviso({ tipo: 'exito', texto: 'Facultad eliminada correctamente.' })
      reintentar()
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message })
    } finally {
      setEliminandoId(null)
    }
  }

  if (cargando && !facultades) {
    return <Esqueleto cantidad={3} />
  }

  if (error && !facultades) {
    return <ErrorCarga error={error} onReintentar={reintentar} />
  }

  const lista = facultades ?? []

  return (
    <ListadoPanel
      titulo="Facultades"
      descripcion="Facultades de la universidad y el PPA mínimo que exigen para postular."
      acciones={
        <button
          type="button"
          className="boton"
          onClick={mostrarFormulario && !editandoId ? cerrarFormulario : abrirCrear}
        >
          {mostrarFormulario && !editandoId ? 'Cancelar' : 'Nueva facultad'}
        </button>
      }
      filas={lista}
      textoDe={(facultad) => `${facultad.sigla ?? ''} ${facultad.nombre}`}
      columnas={[
        ['sigla', 'Sigla'],
        ['nombre', 'Facultad'],
        ['ppa', 'PPA mínimo', 'numero'],
        ['carreras', 'Carreras', 'numero'],
        ['estado', 'Estado'],
        ['acciones', 'Acciones', 'numero'],
      ]}
      fila={(facultad) => (
        <tr key={facultad.id}>
          <td className="codigo">{facultad.sigla || '—'}</td>
          <td>{facultad.nombre}</td>
          <td className="numero">{formatearPuntaje(facultad.ppa_minimo)}</td>
          <td className="numero">{facultad.carreras_count ?? 0}</td>
          <td>
            <span className={facultad.activa ? 'insignia insignia--activo' : 'insignia insignia--neutro'}>
              {facultad.activa ? 'Activa' : 'Inactiva'}
            </span>
          </td>
          <td className="numero">
            <div className="tabla__acciones">
              <button
                type="button"
                className="boton boton--secundario boton--icono"
                title="Editar facultad"
                aria-label="Editar facultad"
                onClick={() => abrirEditar(facultad)}
              >
                <Pencil size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="boton boton--peligro boton--icono"
                title="Eliminar facultad"
                aria-label="Eliminar facultad"
                disabled={eliminandoId === facultad.id}
                onClick={() => manejarEliminar(facultad)}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          </td>
        </tr>
      )}
    >
      {aviso && (
        <div className={`aviso aviso--${aviso.tipo}`} role="status">
          <p>{aviso.texto}</p>
        </div>
      )}

      {mostrarFormulario && (
        <form className="formulario panel__formulario" onSubmit={manejarSubmit} noValidate>
          <fieldset className="grupo">
            <legend>{editandoId ? 'Editar facultad' : 'Nueva facultad'}</legend>

            <Campo etiqueta="Nombre de la facultad" error={erroresCampo.nombre} className="campo--ancho">
              {(props) => (
                <input
                  {...props}
                  type="text"
                  maxLength={150}
                  required
                  value={formulario.nombre}
                  onChange={(e) => cambiarCampo('nombre', e.target.value)}
                  placeholder="Ej. Facultad de Ingeniería en Ciencias de la Computación y Telecomunicaciones"
                />
              )}
            </Campo>

            <Campo etiqueta="Sigla" opcional error={erroresCampo.sigla}>
              {(props) => (
                <input
                  {...props}
                  type="text"
                  maxLength={15}
                  className="mayusculas"
                  value={formulario.sigla}
                  onChange={(e) => cambiarCampo('sigla', e.target.value.toUpperCase())}
                  placeholder="Ej. FICCT"
                />
              )}
            </Campo>

            <Campo etiqueta="PPA mínimo (0 a 100)" error={erroresCampo.ppa_minimo}>
              {(props) => (
                <input
                  {...props}
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                  value={formulario.ppa_minimo}
                  onChange={(e) => cambiarCampo('ppa_minimo', e.target.value)}
                />
              )}
            </Campo>

            <label className="casilla campo--ancho">
              <input
                type="checkbox"
                checked={formulario.activa}
                onChange={(e) => cambiarCampo('activa', e.target.checked)}
              />
              <span>Facultad activa (visible en el registro y convocatorias)</span>
            </label>

            <div className="formulario__acciones campo--ancho">
              <button type="button" className="boton boton--secundario" onClick={cerrarFormulario}>
                Cancelar
              </button>
              <button type="submit" className="boton" disabled={guardando}>
                {guardando ? 'Guardando…' : (editandoId ? 'Guardar cambios' : 'Crear facultad')}
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </ListadoPanel>
  )
}
