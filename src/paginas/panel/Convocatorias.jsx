import { useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  FileCheck,
  Plus,
  RefreshCw,
  Search,
  Users,
  XCircle,
} from 'lucide-react'
import {
  actualizarConvocatoriaAdmin,
  crearConvocatoriaAdmin,
  eliminarConvocatoriaAdmin,
  obtenerCarrerasAdmin,
  obtenerConvocatoriasAdmin,
  obtenerFacultadesAdmin,
} from '../../api/admin.js'
import Campo from '../../componentes/Campo.jsx'
import { ErrorCarga, Esqueleto } from '../../componentes/Estado.jsx'
import { formatearFecha } from '../../utilidades/formato.js'

const FORMULARIO_INICIAL = {
  facultad_id: '',
  carrera_id: '',
  gestion: new Date().getFullYear().toString(),
  numero: '1',
  nombre: '',
  top_n: '5',
  fecha_apertura: new Date().toISOString().split('T')[0],
  fecha_cierre: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  vigencia_perfil_meses: '12',
  estado: 'ABIERTO',
}

function claseEstado(estado) {
  if (estado === 'ABIERTO') return 'insignia insignia--exito'
  if (estado === 'EN_EVALUACION') return 'insignia insignia--advertencia'
  if (estado === 'CERRADO') return 'insignia insignia--neutro'
  if (estado === 'CANCELADO') return 'insignia insignia--error'
  return 'insignia insignia--neutro'
}

function textoEstado(estado) {
  if (estado === 'ABIERTO') return 'Abierta'
  if (estado === 'EN_EVALUACION') return 'En Evaluación'
  if (estado === 'CERRADO') return 'Cerrada'
  if (estado === 'CANCELADO') return 'Cancelada'
  if (estado === 'BORRADOR') return 'Borrador'
  return estado
}

export default function Convocatorias() {
  const [convocatorias, setConvocatorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [facultades, setFacultades] = useState([])
  const [carreras, setCarreras] = useState([])

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroFacultad, setFiltroFacultad] = useState('')
  const [filtroCarrera, setFiltroCarrera] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroGestion, setFiltroGestion] = useState('')

  // Modales
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false)
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false)
  const [formCrear, setFormCrear] = useState(FORMULARIO_INICIAL)
  const [formEditar, setFormEditar] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [erroresForm, setErroresForm] = useState({})
  const [aviso, setAviso] = useState(null)
  const [actualizandoId, setActualizandoId] = useState(null)

  async function cargarConvocatorias() {
    setCargando(true)
    setError(null)
    try {
      const data = await obtenerConvocatoriasAdmin()
      setConvocatorias(data)
    } catch (err) {
      setError(err.message || 'Error al cargar convocatorias.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    let activo = true

    obtenerConvocatoriasAdmin()
      .then((data) => {
        if (activo) {
          setConvocatorias(data)
          setCargando(false)
        }
      })
      .catch((err) => {
        if (activo) {
          setError(err.message || 'Error al cargar convocatorias.')
          setCargando(false)
        }
      })

    obtenerFacultadesAdmin()
      .then((data) => {
        if (activo) setFacultades(data)
      })
      .catch(() => {})

    obtenerCarrerasAdmin()
      .then((data) => {
        if (activo) setCarreras(data)
      })
      .catch(() => {})

    return () => {
      activo = false
    }
  }, [])

  // Carreras disponibles en el formulario de creación (según facultad seleccionada)
  const carrerasCreacion = useMemo(() => {
    if (!formCrear.facultad_id) return carreras
    return carreras.filter((c) => String(c.facultad?.id) === String(formCrear.facultad_id))
  }, [carreras, formCrear.facultad_id])

  // Filtrado de convocatorias en tabla
  const convocatoriasFiltradas = useMemo(() => {
    return convocatorias.filter((c) => {
      if (filtroFacultad && String(c.facultad?.id) !== String(filtroFacultad)) return false
      if (filtroCarrera && String(c.carrera?.id) !== String(filtroCarrera)) return false
      if (filtroEstado && c.estado !== filtroEstado) return false
      if (filtroGestion && String(c.convocatoria?.gestion) !== String(filtroGestion)) return false
      if (!busqueda) return true

      const termino = busqueda.toLowerCase()
      const codigo = (c.codigo || '').toLowerCase()
      const nombre = (c.nombre || '').toLowerCase()
      const carreraNombre = (c.carrera?.nombre || '').toLowerCase()
      const facultadSigla = (c.facultad?.sigla || '').toLowerCase()
      return (
        codigo.includes(termino) ||
        nombre.includes(termino) ||
        carreraNombre.includes(termino) ||
        facultadSigla.includes(termino)
      )
    })
  }, [convocatorias, busqueda, filtroFacultad, filtroCarrera, filtroEstado, filtroGestion])

  // Abrir modal de creación con valores por defecto
  function abrirCrear() {
    setFormCrear({
      ...FORMULARIO_INICIAL,
      facultad_id: facultades[0]?.id?.toString() || '',
      carrera_id: carreras[0]?.id?.toString() || '',
    })
    setErroresForm({})
    setAviso(null)
    setMostrarModalCrear(true)
  }

  // Abrir modal de edición
  function abrirEditar(conv) {
    setFormEditar({
      proceso_id: conv.proceso_id,
      codigo: conv.codigo,
      nombre: conv.nombre,
      estado: conv.estado,
      top_n: conv.top_n?.toString() || '5',
      fecha_apertura: conv.convocatoria?.fecha_apertura || '',
      fecha_cierre: conv.convocatoria?.fecha_cierre || '',
      vigencia_perfil_meses: conv.convocatoria?.vigencia_perfil_meses?.toString() || '12',
      carrera_nombre: conv.carrera?.nombre,
      facultad_nombre: conv.facultad?.nombre,
    })
    setErroresForm({})
    setAviso(null)
    setMostrarModalEditar(true)
  }

  // Crear convocatoria
  async function manejarCrear(e) {
    e.preventDefault()
    setGuardando(true)
    setErroresForm({})
    setAviso(null)

    try {
      const payload = {
        carrera_id: parseInt(formCrear.carrera_id, 10),
        gestion: parseInt(formCrear.gestion, 10),
        numero: parseInt(formCrear.numero, 10) || 1,
        nombre: formCrear.nombre?.trim() || null,
        top_n: parseInt(formCrear.top_n, 10) || 5,
        fecha_apertura: formCrear.fecha_apertura,
        fecha_cierre: formCrear.fecha_cierre || null,
        vigencia_perfil_meses: parseInt(formCrear.vigencia_perfil_meses, 10) || 12,
        estado: formCrear.estado,
      }

      const res = await crearConvocatoriaAdmin(payload)
      setMostrarModalCrear(false)
      await cargarConvocatorias()
      setAviso({
        tipo: 'exito',
        mensaje: res.mensaje || '¡Convocatoria creada y aperturada exitosamente con el embudo de 8 etapas!',
      })
    } catch (err) {
      if (err.errors) {
        setErroresForm(err.errors)
      } else {
        setAviso({ tipo: 'error', mensaje: err.mensaje || 'Error al crear la convocatoria.' })
      }
    } finally {
      setGuardando(false)
    }
  }

  // Actualizar convocatoria
  async function manejarEditar(e) {
    e.preventDefault()
    if (!formEditar) return
    setGuardando(true)
    setErroresForm({})
    setAviso(null)

    try {
      const payload = {
        nombre: formEditar.nombre?.trim() || null,
        estado: formEditar.estado,
        top_n: parseInt(formEditar.top_n, 10) || 5,
        fecha_apertura: formEditar.fecha_apertura,
        fecha_cierre: formEditar.fecha_cierre || null,
        vigencia_perfil_meses: parseInt(formEditar.vigencia_perfil_meses, 10) || 12,
      }

      await actualizarConvocatoriaAdmin(formEditar.proceso_id, payload)
      setMostrarModalEditar(false)
      await cargarConvocatorias()
      setAviso({ tipo: 'exito', mensaje: 'Convocatoria actualizada exitosamente.' })
    } catch (err) {
      if (err.errors) {
        setErroresForm(err.errors)
      } else {
        setAviso({ tipo: 'error', mensaje: err.mensaje || 'Error al actualizar la convocatoria.' })
      }
    } finally {
      setGuardando(false)
    }
  }

  // Cambiar estado rápido (ej. Cerrar o Reabrir)
  async function cambiarEstadoRapido(procesoId, nuevoEstado) {
    setActualizandoId(procesoId)
    try {
      await actualizarConvocatoriaAdmin(procesoId, { estado: nuevoEstado })
      await cargarConvocatorias()
      setAviso({ tipo: 'exito', mensaje: `Estado de la convocatoria actualizado a ${textoEstado(nuevoEstado)}.` })
    } catch (err) {
      setAviso({ tipo: 'error', mensaje: err.message || 'Error al cambiar estado.' })
    } finally {
      setActualizandoId(null)
    }
  }

  // Eliminar o cancelar convocatoria
  async function manejarEliminar(conv) {
    const tienePostulaciones = (conv.postulaciones_count || 0) > 0
    const confirmMsg = tienePostulaciones
      ? `La convocatoria "${conv.nombre}" tiene ${conv.postulaciones_count} postulaciones registradas. No se eliminará físicamente para proteger el historial académico, sino que se marcará como CANCELADA. ¿Deseas continuar?`
      : `¿Estás seguro de eliminar permanentemente la convocatoria "${conv.nombre}"?`

    if (!window.confirm(confirmMsg)) return

    setActualizandoId(conv.proceso_id)
    try {
      const res = await eliminarConvocatoriaAdmin(conv.proceso_id)
      await cargarConvocatorias()
      setAviso({ tipo: 'exito', mensaje: res.mensaje || 'Convocatoria procesada exitosamente.' })
    } catch (err) {
      setAviso({ tipo: 'error', mensaje: err.message || 'Error al eliminar la convocatoria.' })
    } finally {
      setActualizandoId(null)
    }
  }

  return (
    <div>
      {/* Cabecera del Módulo */}
      <header className="seccion__cabecera" style={{ marginBottom: '1.5rem' }}>
        <div>
          <span className="convocatoria__facultad" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Planificación Institucional
          </span>
          <h1 className="titulo-pagina" style={{ margin: '0.25rem 0' }}>
            Convocatorias de Talento
          </h1>
          <p className="seccion__descripcion" style={{ margin: 0 }}>
            Crea, programa y gestiona los procesos de selección por carrera y gestión académica.
          </p>
        </div>

        <button type="button" className="boton boton--primario" onClick={abrirCrear}>
          <Plus size={16} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />
          Nueva Convocatoria
        </button>
      </header>

      {/* Banner de Aviso */}
      {aviso && (
        <div className={`aviso aviso--${aviso.tipo}`} role="alert" style={{ marginBottom: '1.5rem' }}>
          <p>{aviso.mensaje}</p>
        </div>
      )}

      {/* Barra de Filtros */}
      <div
        className="tarjeta"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--texto-suave)',
              }}
            />
            <input
              type="search"
              className="campo__control"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Buscar por código, título o carrera…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <select
            className="campo__control"
            style={{ width: 'auto' }}
            value={filtroFacultad}
            onChange={(e) => {
              setFiltroFacultad(e.target.value)
              setFiltroCarrera('')
            }}
          >
            <option value="">Todas las Facultades</option>
            {facultades.map((f) => (
              <option key={f.id} value={f.id}>
                {f.sigla ? `[${f.sigla}] ` : ''}{f.nombre}
              </option>
            ))}
          </select>

          <select
            className="campo__control"
            style={{ width: 'auto' }}
            value={filtroCarrera}
            onChange={(e) => setFiltroCarrera(e.target.value)}
          >
            <option value="">Todas las Carreras</option>
            {carreras
              .filter((c) => !filtroFacultad || String(c.facultad?.id) === String(filtroFacultad))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
          </select>

          <select
            className="campo__control"
            style={{ width: 'auto' }}
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="">Todos los Estados</option>
            <option value="ABIERTO">Abierta</option>
            <option value="EN_EVALUACION">En Evaluación</option>
            <option value="CERRADO">Cerrada</option>
            <option value="CANCELADO">Cancelada</option>
            <option value="BORRADOR">Borrador</option>
          </select>

          <select
            className="campo__control"
            style={{ width: 'auto' }}
            value={filtroGestion}
            onChange={(e) => setFiltroGestion(e.target.value)}
          >
            <option value="">Todas las Gestiones</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>

        <button
          type="button"
          className="boton boton--secundario"
          onClick={cargarConvocatorias}
          title="Refrescar lista"
        >
          <RefreshCw size={16} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />
          Actualizar
        </button>
      </div>

      {/* Tabla de Convocatorias */}
      {cargando ? (
        <Esqueleto filas={6} />
      ) : error ? (
        <ErrorCarga mensaje={error} alReintentar={cargarConvocatorias} />
      ) : (
        <div className="tarjeta" style={{ overflowX: 'auto', padding: 0 }}>
          <table className="tabla" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--fondo-superficie, #f8fafc)', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Código / Convocatoria</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Carrera y Facultad</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Gestión</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Fechas de Vigencia</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Plazas Top</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Postulantes</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Estado</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {convocatoriasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--texto-suave)' }}>
                    No se encontraron convocatorias que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                convocatoriasFiltradas.map((conv) => {
                  const ocupado = actualizandoId === conv.proceso_id
                  const esAbierta = conv.estado === 'ABIERTO'

                  return (
                    <tr key={conv.proceso_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className="codigo" style={{ fontSize: '0.8rem', display: 'inline-block', marginBottom: '0.2rem' }}>
                          {conv.codigo}
                        </span>
                        <div style={{ fontWeight: 600, color: 'var(--texto, #0f172a)' }}>
                          {conv.nombre}
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600 }}>{conv.carrera?.nombre || '—'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--texto-suave)' }}>
                          {conv.facultad?.sigla ? `[${conv.facultad.sigla}] ` : ''}{conv.facultad?.nombre}
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span className="insignia insignia--neutro">
                          {conv.convocatoria?.gestion} (Nº {conv.convocatoria?.numero})
                        </span>
                      </td>

                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={13} style={{ color: 'var(--primario)' }} />
                          <span>Desde: {conv.convocatoria?.fecha_apertura ? formatearFecha(conv.convocatoria.fecha_apertura) : 'Inmediato'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                          <Clock size={13} style={{ color: '#eab308' }} />
                          <span>Hasta: {conv.convocatoria?.fecha_cierre ? formatearFecha(conv.convocatoria.fecha_cierre) : 'Sin fecha límite'}</span>
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <strong style={{ color: 'var(--primario)', fontSize: '1rem' }}>Top {conv.top_n}</strong>
                      </td>

                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span className="insignia insignia--neutro">
                          <Users size={12} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                          {conv.postulaciones_count}
                        </span>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className={claseEstado(conv.estado)}>
                          {textoEstado(conv.estado)}
                        </span>
                      </td>

                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="boton boton--secundario boton--chico"
                            disabled={ocupado}
                            onClick={() => abrirEditar(conv)}
                            title="Editar convocatoria"
                          >
                            <Edit3 size={14} />
                          </button>

                          {esAbierta ? (
                            <button
                              type="button"
                              className="boton boton--secundario boton--chico"
                              disabled={ocupado}
                              onClick={() => cambiarEstadoRapido(conv.proceso_id, 'CERRADO')}
                              title="Cerrar convocatoria"
                            >
                              <XCircle size={14} style={{ color: '#ef4444' }} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="boton boton--secundario boton--chico"
                              disabled={ocupado}
                              onClick={() => cambiarEstadoRapido(conv.proceso_id, 'ABIERTO')}
                              title="Abrir convocatoria"
                            >
                              <CheckCircle2 size={14} style={{ color: '#16a34a' }} />
                            </button>
                          )}

                          <button
                            type="button"
                            className="boton boton--secundario boton--chico"
                            disabled={ocupado}
                            onClick={() => manejarEliminar(conv)}
                            title="Eliminar / Cancelar"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREAR NUEVA CONVOCATORIA */}
      {/* ========================================================= */}
      {mostrarModalCrear && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 9999,
          }}
        >
          <div
            className="tarjeta"
            style={{
              width: '100%',
              maxWidth: '640px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.2rem' }}>Aperturar Nueva Convocatoria</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--texto-suave)' }}>
                  Configura la carrera y fechas para iniciar un nuevo proceso de selección de talento.
                </p>
              </div>
              <button
                type="button"
                className="boton boton--secundario boton--chico"
                onClick={() => setMostrarModalCrear(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={manejarCrear}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Campo etiqueta="Facultad">
                  <select
                    className="campo__control"
                    value={formCrear.facultad_id}
                    onChange={(e) => {
                      const facId = e.target.value
                      const primeraCarrera = carreras.find((c) => !facId || String(c.facultad?.id) === String(facId))
                      setFormCrear({
                        ...formCrear,
                        facultad_id: facId,
                        carrera_id: primeraCarrera?.id?.toString() || '',
                      })
                    }}
                  >
                    <option value="">-- Seleccionar Facultad --</option>
                    {facultades.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.sigla ? `[${f.sigla}] ` : ''}{f.nombre}
                      </option>
                    ))}
                  </select>
                </Campo>

                <Campo etiqueta="Carrera *" error={erroresForm.carrera_id?.[0]}>
                  <select
                    required
                    className="campo__control"
                    value={formCrear.carrera_id}
                    onChange={(e) => setFormCrear({ ...formCrear, carrera_id: e.target.value })}
                  >
                    <option value="">-- Seleccionar Carrera --</option>
                    {carrerasCreacion.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </Campo>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                <Campo etiqueta="Gestión / Año *" error={erroresForm.gestion?.[0]}>
                  <input
                    type="number"
                    required
                    min={2020}
                    max={2050}
                    className="campo__control"
                    value={formCrear.gestion}
                    onChange={(e) => setFormCrear({ ...formCrear, gestion: e.target.value })}
                  />
                </Campo>

                <Campo etiqueta="Nº Convocatoria" error={erroresForm.numero?.[0]}>
                  <input
                    type="number"
                    min={1}
                    className="campo__control"
                    placeholder="1"
                    value={formCrear.numero}
                    onChange={(e) => setFormCrear({ ...formCrear, numero: e.target.value })}
                  />
                </Campo>

                <Campo etiqueta="Plazas Top (Cupos)" error={erroresForm.top_n?.[0]}>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    className="campo__control"
                    value={formCrear.top_n}
                    onChange={(e) => setFormCrear({ ...formCrear, top_n: e.target.value })}
                  />
                </Campo>
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <Campo etiqueta="Nombre / Título Personalizado (Opcional)" error={erroresForm.nombre?.[0]}>
                  <input
                    type="text"
                    className="campo__control"
                    placeholder="Ej. Talento Ingeniería de Sistemas 2026"
                    value={formCrear.nombre}
                    onChange={(e) => setFormCrear({ ...formCrear, nombre: e.target.value })}
                  />
                </Campo>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                <Campo etiqueta="Fecha de Apertura *" error={erroresForm.fecha_apertura?.[0]}>
                  <input
                    type="date"
                    required
                    className="campo__control"
                    value={formCrear.fecha_apertura}
                    onChange={(e) => setFormCrear({ ...formCrear, fecha_apertura: e.target.value })}
                  />
                </Campo>

                <Campo etiqueta="Fecha de Cierre (Límite)" error={erroresForm.fecha_cierre?.[0]}>
                  <input
                    type="date"
                    className="campo__control"
                    value={formCrear.fecha_cierre}
                    onChange={(e) => setFormCrear({ ...formCrear, fecha_cierre: e.target.value })}
                  />
                </Campo>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                <Campo etiqueta="Vigencia Perfil (Meses)" error={erroresForm.vigencia_perfil_meses?.[0]}>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    className="campo__control"
                    value={formCrear.vigencia_perfil_meses}
                    onChange={(e) => setFormCrear({ ...formCrear, vigencia_perfil_meses: e.target.value })}
                  />
                </Campo>

                <Campo etiqueta="Estado Inicial *" error={erroresForm.estado?.[0]}>
                  <select
                    className="campo__control"
                    value={formCrear.estado}
                    onChange={(e) => setFormCrear({ ...formCrear, estado: e.target.value })}
                  >
                    <option value="ABIERTO">Abierta (Publicar de inmediato)</option>
                    <option value="BORRADOR">Borrador (Oculta hasta programar)</option>
                  </select>
                </Campo>
              </div>

              {/* Caja informativa de etapas automáticas */}
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.85rem 1rem',
                  background: '#f0fdf4',
                  borderRadius: '8px',
                  border: '1px solid #bbf7d0',
                  fontSize: '0.85rem',
                  color: '#166534',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  <FileCheck size={16} />
                  <span>Configuración Automática del Embudo Institucional</span>
                </div>
                El sistema provisionará automáticamente las 8 etapas ponderadas: PPA (20%), Requisitos Documentales, Batería Psicológica 16PF (40%), Habilidades Blandas (15%), Análisis de CV (15%), Entrevista (20%) y Selección Final.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="boton boton--secundario"
                  onClick={() => setMostrarModalCrear(false)}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="boton boton--primario"
                  disabled={guardando}
                >
                  {guardando ? 'Aperturando…' : 'Crear y Publicar Convocatoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDITAR CONVOCATORIA EXISTENTE */}
      {/* ========================================================= */}
      {mostrarModalEditar && formEditar && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 9999,
          }}
        >
          <div
            className="tarjeta"
            style={{
              width: '100%',
              maxWidth: '580px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span className="codigo" style={{ fontSize: '0.85rem' }}>{formEditar.codigo}</span>
                <h2 style={{ fontSize: '1.25rem', margin: '0.2rem 0 0' }}>Editar Convocatoria</h2>
              </div>
              <button
                type="button"
                className="boton boton--secundario boton--chico"
                onClick={() => setMostrarModalEditar(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={manejarEditar}>
              <Campo etiqueta="Título de la Convocatoria *" error={erroresForm.nombre?.[0]}>
                <input
                  type="text"
                  required
                  className="campo__control"
                  value={formEditar.nombre}
                  onChange={(e) => setFormEditar({ ...formEditar, nombre: e.target.value })}
                />
              </Campo>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                <Campo etiqueta="Estado de la Convocatoria *" error={erroresForm.estado?.[0]}>
                  <select
                    className="campo__control"
                    value={formEditar.estado}
                    onChange={(e) => setFormEditar({ ...formEditar, estado: e.target.value })}
                  >
                    <option value="ABIERTO">Abierta (Recibiendo postulaciones)</option>
                    <option value="EN_EVALUACION">En Evaluación (Pruebas en curso)</option>
                    <option value="CERRADO">Cerrada (Finalizada)</option>
                    <option value="CANCELADO">Cancelada</option>
                    <option value="BORRADOR">Borrador</option>
                  </select>
                </Campo>

                <Campo etiqueta="Plazas Top (Cupos)" error={erroresForm.top_n?.[0]}>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    className="campo__control"
                    value={formEditar.top_n}
                    onChange={(e) => setFormEditar({ ...formEditar, top_n: e.target.value })}
                  />
                </Campo>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                <Campo etiqueta="Fecha de Apertura *" error={erroresForm.fecha_apertura?.[0]}>
                  <input
                    type="date"
                    required
                    className="campo__control"
                    value={formEditar.fecha_apertura}
                    onChange={(e) => setFormEditar({ ...formEditar, fecha_apertura: e.target.value })}
                  />
                </Campo>

                <Campo etiqueta="Fecha de Cierre" error={erroresForm.fecha_cierre?.[0]}>
                  <input
                    type="date"
                    className="campo__control"
                    value={formEditar.fecha_cierre}
                    onChange={(e) => setFormEditar({ ...formEditar, fecha_cierre: e.target.value })}
                  />
                </Campo>
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <Campo etiqueta="Vigencia Perfil del Egresado (Meses)" error={erroresForm.vigencia_perfil_meses?.[0]}>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    className="campo__control"
                    value={formEditar.vigencia_perfil_meses}
                    onChange={(e) => setFormEditar({ ...formEditar, vigencia_perfil_meses: e.target.value })}
                  />
                </Campo>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="boton boton--secundario"
                  onClick={() => setMostrarModalEditar(false)}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="boton boton--primario"
                  disabled={guardando}
                >
                  {guardando ? 'Guardando…' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

