import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Unlock,
  UserCheck,
  Users,
} from 'lucide-react'
import {
  actualizarPermisosRolAdmin,
  actualizarUsuarioAdmin,
  crearUsuarioAdmin,
  obtenerRolesPermisosAdmin,
  obtenerUsuariosAdmin,
} from '../../api/admin.js'
import Campo from '../../componentes/Campo.jsx'
import { ErrorCarga, Esqueleto } from '../../componentes/Estado.jsx'
import { formatearFecha } from '../../utilidades/formato.js'

const FORMULARIO_USUARIO_INICIAL = {
  nombres: '',
  primer_apellido: '',
  segundo_apellido: '',
  ci: '',
  telefono: '',
  correo: '',
  password: '',
  rol_id: '2', // Ayudante por defecto
}

function claseEstado(estado) {
  if (estado === 'ACTIVO') return 'insignia insignia--exito'
  if (estado === 'BLOQUEADO') return 'insignia insignia--error'
  return 'insignia insignia--neutro'
}

function claseRol(codigo) {
  if (codigo === 'ADMIN') return 'insignia insignia--primario'
  if (codigo === 'AYUDANTE') return 'insignia insignia--advertencia'
  return 'insignia insignia--neutro'
}

export default function Usuarios() {
  const [pestana, setPestana] = useState('usuarios') // 'usuarios' | 'permisos'

  // Estados de Usuarios
  const [usuarios, setUsuarios] = useState([])
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true)
  const [errorUsuarios, setErrorUsuarios] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  // Estados de Modal Crear Usuario
  const [mostrarModalUsuario, setMostrarModalUsuario] = useState(false)
  const [formUsuario, setFormUsuario] = useState(FORMULARIO_USUARIO_INICIAL)
  const [guardandoUsuario, setGuardandoUsuario] = useState(false)
  const [erroresFormUsuario, setErroresFormUsuario] = useState({})
  const [aviso, setAviso] = useState(null)

  // Estados de Roles y Permisos (RBAC)
  const [datosRbac, setDatosRbac] = useState(null)
  const [cargandoRbac, setCargandoRbac] = useState(true)
  const [errorRbac, setErrorRbac] = useState(null)
  const [rolSeleccionadoId, setRolSeleccionadoId] = useState(null)
  const [permisosRolSeleccionado, setPermisosRolSeleccionado] = useState(new Set())
  const [permisosOriginalesRol, setPermisosOriginalesRol] = useState(new Set())
  const [guardandoPermisos, setGuardandoPermisos] = useState(false)
  const [actualizandoUsuarioId, setActualizandoUsuarioId] = useState(null)

  // Función para recargar usuarios desde botones o acciones
  async function cargarUsuarios() {
    setCargandoUsuarios(true)
    setErrorUsuarios(null)
    try {
      const data = await obtenerUsuariosAdmin()
      setUsuarios(data)
    } catch (err) {
      setErrorUsuarios(err.message || 'Error al cargar usuarios.')
    } finally {
      setCargandoUsuarios(false)
    }
  }

  // Función para recargar roles y permisos
  async function cargarRbac() {
    setCargandoRbac(true)
    setErrorRbac(null)
    try {
      const data = await obtenerRolesPermisosAdmin()
      setDatosRbac(data)
    } catch (err) {
      setErrorRbac(err.message || 'Error al cargar matriz de permisos.')
    } finally {
      setCargandoRbac(false)
    }
  }

  useEffect(() => {
    let activo = true

    obtenerUsuariosAdmin()
      .then((data) => {
        if (activo) {
          setUsuarios(data)
          setCargandoUsuarios(false)
        }
      })
      .catch((err) => {
        if (activo) {
          setErrorUsuarios(err.message || 'Error al cargar usuarios.')
          setCargandoUsuarios(false)
        }
      })

    obtenerRolesPermisosAdmin()
      .then((data) => {
        if (!activo) return
        setDatosRbac(data)
        const ayudante = data.roles?.find((r) => r.codigo === 'AYUDANTE') || data.roles?.[0]
        if (ayudante) {
          setRolSeleccionadoId(ayudante.id)
          setPermisosRolSeleccionado(new Set(ayudante.permisos_ids || []))
          setPermisosOriginalesRol(new Set(ayudante.permisos_ids || []))
        }
        setCargandoRbac(false)
      })
      .catch((err) => {
        if (activo) {
          setErrorRbac(err.message || 'Error al cargar matriz de permisos.')
          setCargandoRbac(false)
        }
      })

    return () => {
      activo = false
    }
  }, [])

  // Al cambiar el rol seleccionado en la pestaña de RBAC
  function seleccionarRolRbac(rolId) {
    setRolSeleccionadoId(rolId)
    const rol = datosRbac?.roles?.find((r) => r.id === rolId)
    const setIds = new Set(rol?.permisos_ids || [])
    setPermisosRolSeleccionado(new Set(setIds))
    setPermisosOriginalesRol(new Set(setIds))
    setAviso(null)
  }

  // Toggle permiso en el rol seleccionado
  function alternarPermiso(permisoId) {
    setPermisosRolSeleccionado((prev) => {
      const nuevo = new Set(prev)
      if (nuevo.has(permisoId)) {
        nuevo.delete(permisoId)
      } else {
        nuevo.add(permisoId)
      }
      return nuevo
    })
  }

  // Guardar permisos asignados al rol
  async function guardarPermisosRol() {
    if (!rolSeleccionadoId) return
    setGuardandoPermisos(true)
    setAviso(null)
    try {
      const ids = Array.from(permisosRolSeleccionado)
      await actualizarPermisosRolAdmin(rolSeleccionadoId, ids)
      setPermisosOriginalesRol(new Set(permisosRolSeleccionado))

      // Actualizar en memoria el rol modificado
      setDatosRbac((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          roles: prev.roles.map((r) =>
            r.id === rolSeleccionadoId ? { ...r, permisos_ids: ids } : r
          ),
        }
      })

      setAviso({
        tipo: 'exito',
        mensaje: 'Permisos del rol actualizados exitosamente en la base de datos.',
      })
    } catch (err) {
      setAviso({
        tipo: 'error',
        mensaje: err.message || 'Error al guardar permisos del rol.',
      })
    } finally {
      setGuardandoPermisos(false)
    }
  }

  // Cambiar rol de un usuario
  async function cambiarRolUsuario(usuarioId, nuevoRolId) {
    setActualizandoUsuarioId(usuarioId)
    try {
      await actualizarUsuarioAdmin(usuarioId, { rol_id: parseInt(nuevoRolId, 10) })
      await cargarUsuarios()
      setAviso({ tipo: 'exito', mensaje: 'Rol de usuario actualizado exitosamente.' })
    } catch (err) {
      setAviso({ tipo: 'error', mensaje: err.message || 'Error al cambiar rol del usuario.' })
    } finally {
      setActualizandoUsuarioId(null)
    }
  }

  // Alternar estado de bloqueo de un usuario
  async function alternarEstadoUsuario(usuario) {
    setActualizandoUsuarioId(usuario.id)
    const nuevoEstado = usuario.estado === 'ACTIVO' ? 'BLOQUEADO' : 'ACTIVO'
    try {
      await actualizarUsuarioAdmin(usuario.id, { estado: nuevoEstado })
      await cargarUsuarios()
      setAviso({
        tipo: 'exito',
        mensaje: `Usuario ${usuario.correo} ahora está ${nuevoEstado.toLowerCase()}.`,
      })
    } catch (err) {
      setAviso({ tipo: 'error', mensaje: err.message || 'Error al cambiar estado del usuario.' })
    } finally {
      setActualizandoUsuarioId(null)
    }
  }

  // Registrar nuevo usuario Staff
  async function crearUsuario(e) {
    e.preventDefault()
    setGuardandoUsuario(true)
    setErroresFormUsuario({})
    setAviso(null)

    try {
      await crearUsuarioAdmin({
        ...formUsuario,
        rol_id: parseInt(formUsuario.rol_id, 10),
      })
      setMostrarModalUsuario(false)
      setFormUsuario(FORMULARIO_USUARIO_INICIAL)
      await cargarUsuarios()
      setAviso({ tipo: 'exito', mensaje: 'Usuario registrado correctamente en el sistema.' })
    } catch (err) {
      if (err.errors) {
        setErroresFormUsuario(err.errors)
      } else {
        setAviso({ tipo: 'error', mensaje: err.message || 'Error al registrar el usuario.' })
      }
    } finally {
      setGuardandoUsuario(false)
    }
  }

  // Filtrado de usuarios
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      if (filtroRol && u.rol?.codigo !== filtroRol) return false
      if (filtroEstado && u.estado !== filtroEstado) return false
      if (!busqueda) return true

      const termino = busqueda.toLowerCase()
      const nombre = (u.persona?.nombre_completo || '').toLowerCase()
      const ci = (u.persona?.ci || '').toLowerCase()
      const correo = (u.correo || '').toLowerCase()
      return nombre.includes(termino) || ci.includes(termino) || correo.includes(termino)
    })
  }, [usuarios, busqueda, filtroRol, filtroEstado])

  // Permisos agrupados por módulo
  const permisosPorModulo = useMemo(() => {
    if (!datosRbac?.permisos) return {}
    const grupos = {}
    datosRbac.permisos.forEach((p) => {
      const mod = p.modulo || 'GENERAL'
      if (!grupos[mod]) grupos[mod] = []
      grupos[mod].push(p)
    })
    return grupos
  }, [datosRbac])

  // Verificar si hay cambios sin guardar en los permisos
  const hayCambiosPermisos = useMemo(() => {
    if (permisosRolSeleccionado.size !== permisosOriginalesRol.size) return true
    for (const id of permisosRolSeleccionado) {
      if (!permisosOriginalesRol.has(id)) return true
    }
    return false
  }, [permisosRolSeleccionado, permisosOriginalesRol])

  const rolActual = datosRbac?.roles?.find((r) => r.id === rolSeleccionadoId)

  return (
    <div className="contenedor seccion">
      {/* Cabecera del Módulo */}
      <header className="seccion__cabecera" style={{ marginBottom: '1.5rem' }}>
        <div>
          <span className="convocatoria__facultad" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Control de Acceso Institucional
          </span>
          <h1 className="titulo-pagina" style={{ margin: '0.25rem 0' }}>
            Usuarios, Roles y Permisos (RBAC)
          </h1>
          <p className="seccion__descripcion" style={{ margin: 0 }}>
            Administra las cuentas de usuario, sus roles y la matriz de permisos de seguridad de la plataforma.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`boton ${pestana === 'usuarios' ? 'boton--primario' : 'boton--secundario'}`}
            onClick={() => setPestana('usuarios')}
          >
            <Users size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
            Cuentas y Usuarios
          </button>
          <button
            type="button"
            className={`boton ${pestana === 'permisos' ? 'boton--primario' : 'boton--secundario'}`}
            onClick={() => setPestana('permisos')}
          >
            <Shield size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
            Matriz de Permisos
          </button>
        </div>
      </header>

      {/* Banner de Aviso */}
      {aviso && (
        <div className={`aviso aviso--${aviso.tipo}`} role="alert" style={{ marginBottom: '1.5rem' }}>
          <p>{aviso.mensaje}</p>
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 1: GESTIÓN DE USUARIOS */}
      {/* ========================================================= */}
      {pestana === 'usuarios' && (
        <div>
          {/* Barra de Filtros y Acción Nuevo */}
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
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
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
                  placeholder="Buscar por nombre, CI o correo…"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>

              <select
                className="campo__control"
                style={{ width: 'auto' }}
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
              >
                <option value="">Todos los Roles</option>
                <option value="ADMIN">Administrador</option>
                <option value="AYUDANTE">Ayudante</option>
                <option value="EGRESADO">Egresado</option>
              </select>

              <select
                className="campo__control"
                style={{ width: 'auto' }}
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="">Todos los Estados</option>
                <option value="ACTIVO">Activo</option>
                <option value="BLOQUEADO">Bloqueado</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="boton boton--secundario"
                onClick={cargarUsuarios}
                title="Refrescar lista"
              >
                <RefreshCw size={16} />
              </button>
              <button
                type="button"
                className="boton boton--primario"
                onClick={() => {
                  setFormUsuario(FORMULARIO_USUARIO_INICIAL)
                  setErroresFormUsuario({})
                  setMostrarModalUsuario(true)
                }}
              >
                <Plus size={16} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />
                Nuevo Usuario Staff
              </button>
            </div>
          </div>

          {/* Tabla de Usuarios */}
          {cargandoUsuarios ? (
            <Esqueleto filas={6} />
          ) : errorUsuarios ? (
            <ErrorCarga mensaje={errorUsuarios} alReintentar={cargarUsuarios} />
          ) : (
            <div className="tarjeta" style={{ overflowX: 'auto', padding: 0 }}>
              <table className="tabla" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--fondo-superficie, #f8fafc)', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Usuario / Persona</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>CI</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Correo</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Rol</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Estado</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Último Acceso</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--texto-suave)' }}>
                        No se encontraron usuarios que coincidan con los filtros.
                      </td>
                    </tr>
                  ) : (
                    usuariosFiltrados.map((u) => {
                      const ocupado = actualizandoUsuarioId === u.id

                      return (
                        <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                            {u.persona?.nombre_completo || 'Sin nombre registrado'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--texto-suave)', fontSize: '0.9rem' }}>
                            {u.persona?.ci || '—'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem' }}>{u.correo}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span className={claseRol(u.rol?.codigo)}>{u.rol?.nombre || u.rol?.codigo}</span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span className={claseEstado(u.estado)}>{u.estado}</span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--texto-suave)' }}>
                            {u.ultimo_acceso ? formatearFecha(u.ultimo_acceso) : 'Nunca'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                              {/* Selector para cambiar de Rol */}
                              <select
                                className="campo__control"
                                style={{
                                  fontSize: '0.8rem',
                                  padding: '0.25rem 0.5rem',
                                  height: 'auto',
                                  width: 'auto',
                                }}
                                value={u.rol?.id || ''}
                                disabled={ocupado}
                                onChange={(e) => cambiarRolUsuario(u.id, e.target.value)}
                              >
                                {datosRbac?.roles?.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.nombre}
                                  </option>
                                ))}
                              </select>

                              {/* Botón Bloquear / Desbloquear */}
                              <button
                                type="button"
                                className={`boton boton--chico ${
                                  u.estado === 'ACTIVO' ? 'boton--secundario' : 'boton--primario'
                                }`}
                                disabled={ocupado}
                                onClick={() => alternarEstadoUsuario(u)}
                                title={u.estado === 'ACTIVO' ? 'Bloquear acceso' : 'Desbloquear acceso'}
                              >
                                {u.estado === 'ACTIVO' ? (
                                  <>
                                    <Lock size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                                    Bloquear
                                  </>
                                ) : (
                                  <>
                                    <Unlock size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                                    Activar
                                  </>
                                )}
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
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 2: MATRIZ DE ROLES Y PERMISOS (RBAC) */}
      {/* ========================================================= */}
      {pestana === 'permisos' && (
        <div>
          {cargandoRbac ? (
            <Esqueleto filas={6} />
          ) : errorRbac ? (
            <ErrorCarga mensaje={errorRbac} alReintentar={cargarRbac} />
          ) : (
            <div>
              {/* Selector de Roles */}
              <div
                className="tarjeta"
                style={{
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <h2 style={{ fontSize: '1.15rem', margin: '0 0 0.25rem' }}>Seleccionar Rol para Configurar</h2>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--texto-suave)' }}>
                    Elige el rol del sistema cuyas facultades y permisos deseas auditar o modificar.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {datosRbac?.roles?.map((rol) => {
                    const esActivo = rol.id === rolSeleccionadoId
                    return (
                      <button
                        key={rol.id}
                        type="button"
                        className={`boton ${esActivo ? 'boton--primario' : 'boton--secundario'}`}
                        onClick={() => seleccionarRolRbac(rol.id)}
                      >
                        <UserCheck size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
                        {rol.nombre}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Detalle del Rol Seleccionado */}
              {rolActual && (
                <div
                  className="tarjeta"
                  style={{
                    padding: '1.25rem',
                    marginBottom: '1.5rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span className="codigo" style={{ fontSize: '0.85rem' }}>{rolActual.codigo}</span>
                        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{rolActual.nombre}</h2>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--texto-suave)' }}>
                        {rolActual.descripcion || 'Sin descripción configurada.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="boton boton--primario"
                      disabled={guardandoPermisos || !hayCambiosPermisos}
                      onClick={guardarPermisosRol}
                    >
                      {guardandoPermisos ? (
                        'Guardando…'
                      ) : (
                        <>
                          <Check size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
                          Guardar Permisos del Rol
                        </>
                      )}
                    </button>
                  </div>

                  {rolActual.codigo === 'ADMIN' && (
                    <div
                      style={{
                        marginTop: '1rem',
                        padding: '0.75rem 1rem',
                        background: '#eff6ff',
                        borderRadius: '6px',
                        border: '1px solid #bfdbfe',
                        fontSize: '0.85rem',
                        color: '#1e40af',
                      }}
                    >
                      💡 <strong>Superusuario:</strong> El rol <code>ADMIN</code> tiene acceso irrestricto concedido en el backend por diseño para garantizar la operatividad del sistema.
                    </div>
                  )}
                </div>
              )}

              {/* Matriz de Permisos Agrupada por Módulo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {Object.entries(permisosPorModulo).map(([modulo, permisos]) => (
                  <div key={modulo} className="tarjeta" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                      <Shield size={18} style={{ color: 'var(--primario)' }} />
                      <h3 style={{ fontSize: '1.1rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Módulo: {modulo}
                      </h3>
                      <span className="insignia insignia--neutro" style={{ fontSize: '0.75rem', marginLeft: 'auto' }}>
                        {permisos.length} permisos
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '1rem',
                      }}
                    >
                      {permisos.map((p) => {
                        const concedido = permisosRolSeleccionado.has(p.id)

                        return (
                          <label
                            key={p.id}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '0.75rem',
                              padding: '1rem',
                              borderRadius: '8px',
                              border: concedido ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                              background: concedido ? '#f0f7ff' : '#ffffff',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease-in-out',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={concedido}
                              onChange={() => alternarPermiso(p.id)}
                              style={{
                                marginTop: '0.2rem',
                                width: '18px',
                                height: '18px',
                                accentColor: 'var(--primario, #2563eb)',
                                cursor: 'pointer',
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.nombre}</span>
                              </div>
                              <div style={{ margin: '0.2rem 0', fontSize: '0.75rem' }}>
                                <code style={{ color: '#2563eb', background: '#e0e7ff', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                                  {p.codigo}
                                </code>
                              </div>
                              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--texto-suave)' }}>
                                {p.descripcion || 'Sin descripción.'}
                              </p>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREAR NUEVO USUARIO STAFF (ADMIN / AYUDANTE) */}
      {/* ========================================================= */}
      {mostrarModalUsuario && (
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
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Registrar Usuario Staff</h2>
              <button
                type="button"
                className="boton boton--secundario boton--chico"
                onClick={() => setMostrarModalUsuario(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={crearUsuario}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Campo etiqueta="Nombres *" error={erroresFormUsuario.nombres?.[0]}>
                  <input
                    type="text"
                    required
                    className="campo__control"
                    value={formUsuario.nombres}
                    onChange={(e) => setFormUsuario({ ...formUsuario, nombres: e.target.value })}
                  />
                </Campo>

                <Campo etiqueta="Primer Apellido *" error={erroresFormUsuario.primer_apellido?.[0]}>
                  <input
                    type="text"
                    required
                    className="campo__control"
                    value={formUsuario.primer_apellido}
                    onChange={(e) => setFormUsuario({ ...formUsuario, primer_apellido: e.target.value })}
                  />
                </Campo>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                <Campo etiqueta="Segundo Apellido" error={erroresFormUsuario.segundo_apellido?.[0]}>
                  <input
                    type="text"
                    className="campo__control"
                    value={formUsuario.segundo_apellido}
                    onChange={(e) => setFormUsuario({ ...formUsuario, segundo_apellido: e.target.value })}
                  />
                </Campo>

                <Campo etiqueta="Cédula de Identidad (CI) *" error={erroresFormUsuario.ci?.[0]}>
                  <input
                    type="text"
                    required
                    className="campo__control"
                    placeholder="Ej. 7894561 SC"
                    value={formUsuario.ci}
                    onChange={(e) => setFormUsuario({ ...formUsuario, ci: e.target.value })}
                  />
                </Campo>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                <Campo etiqueta="Teléfono" error={erroresFormUsuario.telefono?.[0]}>
                  <input
                    type="tel"
                    className="campo__control"
                    placeholder="Ej. 70012345"
                    value={formUsuario.telefono}
                    onChange={(e) => setFormUsuario({ ...formUsuario, telefono: e.target.value })}
                  />
                </Campo>

                <Campo etiqueta="Rol Asignado *" error={erroresFormUsuario.rol_id?.[0]}>
                  <select
                    className="campo__control"
                    required
                    value={formUsuario.rol_id}
                    onChange={(e) => setFormUsuario({ ...formUsuario, rol_id: e.target.value })}
                  >
                    {datosRbac?.roles
                      ?.filter((r) => r.codigo !== 'EGRESADO')
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nombre} ({r.codigo})
                        </option>
                      ))}
                  </select>
                </Campo>
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <Campo etiqueta="Correo Electrónico Institucional *" error={erroresFormUsuario.correo?.[0]}>
                  <input
                    type="email"
                    required
                    className="campo__control"
                    placeholder="usuario@talento.gob.bo"
                    value={formUsuario.correo}
                    onChange={(e) => setFormUsuario({ ...formUsuario, correo: e.target.value })}
                  />
                </Campo>
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <Campo etiqueta="Contraseña Temporal *" error={erroresFormUsuario.password?.[0]}>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="campo__control"
                    placeholder="Mínimo 6 caracteres"
                    value={formUsuario.password}
                    onChange={(e) => setFormUsuario({ ...formUsuario, password: e.target.value })}
                  />
                </Campo>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="boton boton--secundario"
                  onClick={() => setMostrarModalUsuario(false)}
                  disabled={guardandoUsuario}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="boton boton--primario"
                  disabled={guardandoUsuario}
                >
                  {guardandoUsuario ? 'Registrando…' : 'Crear Usuario Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
