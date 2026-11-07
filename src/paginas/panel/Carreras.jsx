import { useCallback, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import {
  actualizarCarrera,
  crearCarrera,
  eliminarCarrera,
  obtenerCarrerasAdmin,
  obtenerFacultadesAdmin,
} from '../../api/admin.js'
import Campo from '../../componentes/Campo.jsx'
import { ErrorCarga, Esqueleto } from '../../componentes/Estado.jsx'
import { useConsulta } from '../../utilidades/useConsulta.js'
import ListadoPanel from './ListadoPanel.jsx'

const ESTADO_INICIAL = {
  facultad_id: '',
  nombre: '',
  areasTexto: '',
  activa: true,
}

export default function Carreras() {
  const consultarCatalogo = useCallback(async () => {
    const [carreras, facultades] = await Promise.all([
      obtenerCarrerasAdmin(),
      obtenerFacultadesAdmin(),
    ])
    return { carreras, facultades }
  }, [])

  const { datos, error, cargando, reintentar } = useConsulta(consultarCatalogo)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [formulario, setFormulario] = useState(ESTADO_INICIAL)
  const [erroresCampo, setErroresCampo] = useState({})
  const [aviso, setAviso] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState(null)

  const carreras = datos?.carreras ?? []
  const facultades = datos?.facultades ?? []

  function abrirCrear() {
    setEditandoId(null)
    setFormulario({
      ...ESTADO_INICIAL,
      facultad_id: facultades[0]?.id ? String(facultades[0].id) : '',
    })
    setErroresCampo({})
    setAviso(null)
    setMostrarFormulario(true)
  }

  function abrirEditar(carrera) {
    setEditandoId(carrera.id)
    setFormulario({
      facultad_id: String(carrera.facultad_id ?? carrera.facultad?.id ?? ''),
      nombre: carrera.nombre ?? '',
      areasTexto: (carrera.areas ?? []).map((area) => area.nombre).join(', '),
      activa: Boolean(carrera.activa),
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

    const areas = formulario.areasTexto
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    const cuerpo = {
      facultad_id: formulario.facultad_id ? Number(formulario.facultad_id) : null,
      nombre: formulario.nombre,
      activa: formulario.activa,
      areas,
    }

    try {
      if (editandoId) {
        await actualizarCarrera(editandoId, cuerpo)
        setAviso({ tipo: 'exito', texto: 'Carrera actualizada correctamente.' })
      } else {
        await crearCarrera(cuerpo)
        setAviso({ tipo: 'exito', texto: 'Carrera creada correctamente.' })
      }
      cerrarFormulario()
      reintentar()
    } catch (err) {
      const errores = err.erroresPorCampo ?? {}
      const errorAreas = Object.entries(errores).find(([clave]) => clave === 'areas' || clave.startsWith('areas.'))?.[1]
      setErroresCampo({ ...errores, ...(errorAreas ? { areas: errorAreas } : {}) })
      setAviso({ tipo: 'error', texto: err.message })
    } finally {
      setGuardando(false)
    }
  }

  async function manejarEliminar(carrera) {
    if (!window.confirm(`¿Eliminar la carrera "${carrera.nombre}"?`)) {
      return
    }

    setEliminandoId(carrera.id)
    setAviso(null)

    try {
      await eliminarCarrera(carrera.id)
      if (editandoId === carrera.id) {
        cerrarFormulario()
      }
      setAviso({ tipo: 'exito', texto: 'Carrera eliminada correctamente.' })
      reintentar()
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message })
    } finally {
      setEliminandoId(null)
    }
  }

  if (cargando && !datos) {
    return <Esqueleto cantidad={3} />
  }

  if (error && !datos) {
    return <ErrorCarga error={error} onReintentar={reintentar} />
  }

  return (
    <ListadoPanel
      titulo="Carreras"
      descripcion="Carreras de cada facultad y sus áreas de preferencia."
      acciones={
        <button
          type="button"
          className="boton"
          onClick={mostrarFormulario && !editandoId ? cerrarFormulario : abrirCrear}
        >
          {mostrarFormulario && !editandoId ? 'Cancelar' : 'Nueva carrera'}
        </button>
      }
      filas={carreras}
      textoDe={(carrera) => {
        const nombresAreas = (carrera.areas ?? []).map((a) => a.nombre).join(' ')
        return `${carrera.nombre} ${carrera.facultad?.sigla ?? ''} ${carrera.facultad?.nombre ?? ''} ${nombresAreas}`
      }}
      columnas={[
        ['carrera', 'Carrera'],
        ['facultad', 'Facultad'],
        ['areas', 'Áreas'],
        ['estado', 'Estado'],
        ['acciones', 'Acciones', 'numero'],
      ]}
      fila={(carrera) => (
        <tr key={carrera.id}>
          <td>{carrera.nombre}</td>
          <td>
            {carrera.facultad?.nombre}
            {carrera.facultad?.sigla && <span className="tabla__secundario">{carrera.facultad.sigla}</span>}
          </td>
          <td>
            {carrera.areas?.length > 0
              ? carrera.areas.map((area) => area.nombre).join(', ')
              : 'Sin áreas'}
          </td>
          <td>
            <span className={carrera.activa ? 'insignia insignia--activo' : 'insignia insignia--neutro'}>
              {carrera.activa ? 'Activa' : 'Inactiva'}
            </span>
          </td>
          <td className="tabla__acciones">
            <button
              type="button"
              className="boton boton--secundario boton--icono"
              title="Editar carrera"
              aria-label="Editar carrera"
              onClick={() => abrirEditar(carrera)}
            >
              <Pencil size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="boton boton--peligro boton--icono"
              title="Eliminar carrera"
              aria-label="Eliminar carrera"
              disabled={eliminandoId === carrera.id}
              onClick={() => manejarEliminar(carrera)}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
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
            <legend>{editandoId ? 'Editar carrera' : 'Nueva carrera'}</legend>

            <Campo etiqueta="Facultad" error={erroresCampo.facultad_id}>
              {(props) => (
                <select
                  {...props}
                  required
                  value={formulario.facultad_id}
                  onChange={(e) => cambiarCampo('facultad_id', e.target.value)}
                >
                  <option value="">Selecciona una facultad</option>
                  {facultades.map((facultad) => (
                    <option key={facultad.id} value={facultad.id}>
                      {facultad.sigla ? `${facultad.sigla} — ${facultad.nombre}` : facultad.nombre}
                    </option>
                  ))}
                </select>
              )}
            </Campo>

            <Campo etiqueta="Nombre de la carrera" error={erroresCampo.nombre}>
              {(props) => (
                <input
                  {...props}
                  type="text"
                  maxLength={150}
                  required
                  value={formulario.nombre}
                  onChange={(e) => cambiarCampo('nombre', e.target.value)}
                  placeholder="Ej. Ingeniería Informática"
                />
              )}
            </Campo>

            <Campo
              etiqueta="Áreas de preferencia"
              opcional
              ayuda="Separa cada área con una coma (ej. Penal, Civil, Laboral)."
              error={erroresCampo.areas}
              className="campo--ancho"
            >
              {(props) => (
                <input
                  {...props}
                  type="text"
                  value={formulario.areasTexto}
                  onChange={(e) => cambiarCampo('areasTexto', e.target.value)}
                  placeholder="Ej. Penal, Civil, Laboral"
                />
              )}
            </Campo>

            <label className="casilla campo--ancho">
              <input
                type="checkbox"
                checked={formulario.activa}
                onChange={(e) => cambiarCampo('activa', e.target.checked)}
              />
              <span>Carrera activa (visible en el registro y convocatorias)</span>
            </label>

            <div className="formulario__acciones campo--ancho">
              <button type="button" className="boton boton--secundario" onClick={cerrarFormulario}>
                Cancelar
              </button>
              <button type="submit" className="boton" disabled={guardando}>
                {guardando ? 'Guardando…' : (editandoId ? 'Guardar cambios' : 'Crear carrera')}
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </ListadoPanel>
  )
}
