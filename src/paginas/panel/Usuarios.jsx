import { useEffect, useMemo, useState } from 'react'
import {
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Unlock,
} from 'lucide-react'
import { Link } from 'react-router'
import {
  actualizarUsuarioAdmin,
  crearUsuarioAdmin,
  obtenerUsuariosAdmin,
} from '../../api/admin.js'
import Campo from '../../componentes/Campo.jsx'
import { ErrorCarga, Esqueleto } from '../../componentes/Estado.jsx'
import { useSesion } from '../../sesion/SesionContext.jsx'
import { formatearFecha } from '../../utilidades/formato.js'
import { tienePermiso } from '../../utilidades/roles.js'

const FORMULARIO_USUARIO_INICIAL = {
  nombres: '',
  apellido_paterno: '',
  apellido_materno: '',
  ci_numero: '',
  fecha_nacimiento: '',
  telefono: '',
  correo: '',
  password: '',
  rol_id: '',
  carrera_ids: [],
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
  const { usuario: sesion } = useSesion()
  const puedeGestionar = tienePermiso(sesion, 'usuarios.gestionar')
  const puedeVerRoles = tienePermiso(sesion, 'permisos.gestionar')
  const [usuarios, setUsuarios] = useState([])
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true)
  const [errorUsuarios, setErrorUsuarios] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const [mostrarModalUsuario, setMostrarModalUsuario] = useState(false)
  const [formUsuario, setFormUsuario] = useState(FORMULARIO_USUARIO_INICIAL)
  const [guardandoUsuario, setGuardandoUsuario] = useState(false)
  const [erroresFormUsuario, setErroresFormUsuario] = useState({})
  const [aviso, setAviso] = useState(null)

  const [rolesCatalogo, setRolesCatalogo] = useState([])
  const [carrerasCatalogo, setCarrerasCatalogo] = useState([])
  const [editandoId, setEditandoId] = useState(null)
  const [actualizandoUsuarioId, setActualizandoUsuarioId] = useState(null)

  async function cargarUsuarios() {
    setCargandoUsuarios(true)
    setErrorUsuarios(null)
    try {
      const data = await obtenerUsuariosAdmin()
      setUsuarios(data.data ?? [])
      setRolesCatalogo(data.roles ?? [])
      setCarrerasCatalogo(data.carreras ?? [])
    } catch (err) {
      setErrorUsuarios(err.message || 'Error al cargar usuarios.')
    } finally {
      setCargandoUsuarios(false)
    }
  }

  useEffect(() => {
    let activo = true

    obtenerUsuariosAdmin()
      .then((data) => {
        if (activo) {
          setUsuarios(data.data ?? [])
          setRolesCatalogo(data.roles ?? [])
          setCarrerasCatalogo(data.carreras ?? [])
          setCargandoUsuarios(false)
        }
      })
      .catch((err) => {
        if (activo) {
          setErrorUsuarios(err.message || 'Error al cargar usuarios.')
          setCargandoUsuarios(false)
        }
      })

    return () => {
      activo = false
    }
  }, [])

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

  function abrirAlta() {
    const internos = rolesCatalogo.filter((rol) => rol.es_panel)
    setEditandoId(null)
    setFormUsuario({
      ...FORMULARIO_USUARIO_INICIAL,
      rol_id: internos[0] ? String(internos[0].id) : '',
    })
    setErroresFormUsuario({})
    setMostrarModalUsuario(true)
  }

  function abrirEdicion(cuenta) {
    setEditandoId(cuenta.id)
    setFormUsuario({
      nombres: cuenta.persona?.nombres ?? '',
      apellido_paterno: cuenta.persona?.apellido_paterno ?? '',
      apellido_materno: cuenta.persona?.apellido_materno ?? '',
      ci_numero: cuenta.persona?.ci_numero ?? '',
      fecha_nacimiento: cuenta.persona?.fecha_nacimiento ?? '',
      telefono: cuenta.persona?.telefono ?? '',
      correo: cuenta.correo ?? '',
      password: '',
      rol_id: cuenta.rol?.id ? String(cuenta.rol.id) : '',
      carrera_ids: cuenta.carrera_ids ?? [],
    })
    setErroresFormUsuario({})
    setMostrarModalUsuario(true)
  }

  async function guardarUsuario(e) {
    e.preventDefault()
    setGuardandoUsuario(true)
    setErroresFormUsuario({})
    setAviso(null)

    const rol = rolesCatalogo.find((item) => String(item.id) === String(formUsuario.rol_id))
    const cuerpo = {
      ...formUsuario,
      rol_id: parseInt(formUsuario.rol_id, 10),
      apellido_materno: formUsuario.apellido_materno || null,
      telefono: formUsuario.telefono || null,
      carrera_ids: rol?.alcance_carrera ? formUsuario.carrera_ids.map((id) => parseInt(id, 10)) : [],
    }

    if (editandoId && !cuerpo.password) {
      delete cuerpo.password
    }

    try {
      if (editandoId) {
        await actualizarUsuarioAdmin(editandoId, cuerpo)
      } else {
        await crearUsuarioAdmin(cuerpo)
      }
      setMostrarModalUsuario(false)
      setFormUsuario(FORMULARIO_USUARIO_INICIAL)
      setEditandoId(null)
      await cargarUsuarios()
      setAviso({
        tipo: 'exito',
        mensaje: editandoId ? 'Usuario actualizado correctamente.' : 'Usuario registrado correctamente en el sistema.',
      })
    } catch (err) {
      if (err.errores || err.errors) {
        setErroresFormUsuario(err.errores ?? err.errors)
      } else {
        setAviso({ tipo: 'error', mensaje: err.message || 'Error al guardar el usuario.' })
      }
    } finally {
      setGuardandoUsuario(false)
    }
  }

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

  return (
    <div>
      {/* Cabecera del Módulo */}
      <header className="seccion__cabecera" style={{ marginBottom: '1.5rem' }}>
        <div>
          <span className="convocatoria__facultad" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Control de Usuarios
          </span>
          <h1 className="titulo-pagina" style={{ margin: '0.25rem 0' }}>
            Usuarios del Sistema
          </h1>
          <p className="seccion__descripcion" style={{ margin: 0 }}>
            Administra las cuentas de usuario, sus roles asignados y el estado de acceso (activo/bloqueado).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {puedeVerRoles && (
            <Link to="/panel/roles-permisos" className="boton boton--secundario">
              <Shield size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
              Roles y Permisos (RBAC)
            </Link>
          )}
          {puedeGestionar && (
            <button type="button" className="boton boton--primario" onClick={abrirAlta}>
              <Plus size={16} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />
              Nuevo Usuario Staff
            </button>
          )}
        </div>
      </header>

      {/* Banner de Aviso */}
      {aviso && (
        <div className={`aviso aviso--${aviso.tipo}`} role="alert" style={{ marginBottom: '1.5rem' }}>
          <p>{aviso.mensaje}</p>
        </div>
      )}

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
            {rolesCatalogo.map((rol) => (
              <option key={rol.id} value={rol.codigo}>
                {rol.nombre}
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
            <option value="ACTIVO">Activo</option>
            <option value="BLOQUEADO">Bloqueado</option>
          </select>
        </div>

        <button
          type="button"
          className="boton boton--secundario"
          onClick={cargarUsuarios}
          title="Refrescar lista"
        >
          <RefreshCw size={16} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />
          Actualizar
        </button>
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
              <tr style={{ background: 'var(--superficie-destacada)', borderBottom: '1px solid var(--borde)' }}>
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
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--borde)' }}>
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
                          <select
                            className="campo__control"
                            style={{
                              fontSize: '0.8rem',
                              padding: '0.25rem 0.5rem',
                              height: 'auto',
                              width: 'auto',
                            }}
                            value={u.rol?.id || ''}
                            disabled={ocupado || !puedeGestionar}
                            onChange={(e) => cambiarRolUsuario(u.id, e.target.value)}
                          >
                            {rolesCatalogo.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.nombre}
                              </option>
                            ))}
                          </select>

                          {puedeGestionar && (
                            <button
                              type="button"
                              className="boton boton--secundario boton--chico"
                              disabled={ocupado}
                              onClick={() => abrirEdicion(u)}
                            >
                              <Pencil size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                              Editar
                            </button>
                          )}

                          <button
                            type="button"
                            className={`boton boton--chico ${
                              u.estado === 'ACTIVO' ? 'boton--secundario' : 'boton--primario'
                            }`}
                            disabled={ocupado || !puedeGestionar}
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

      {/* Modal: Crear Usuario Staff */}
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
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{editandoId ? 'Editar usuario' : 'Registrar Usuario Staff'}</h2>
              <button
                type="button"
                className="boton boton--secundario boton--chico"
                onClick={() => setMostrarModalUsuario(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarUsuario}>
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

                <Campo etiqueta="Apellido paterno *" error={erroresFormUsuario.apellido_paterno?.[0]}>
                  <input
                    type="text"
                    required
                    className="campo__control"
                    value={formUsuario.apellido_paterno}
                    onChange={(e) => setFormUsuario({ ...formUsuario, apellido_paterno: e.target.value })}
                  />
                </Campo>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                <Campo etiqueta="Apellido materno" error={erroresFormUsuario.apellido_materno?.[0]}>
                  <input
                    type="text"
                    className="campo__control"
                    value={formUsuario.apellido_materno}
                    onChange={(e) => setFormUsuario({ ...formUsuario, apellido_materno: e.target.value })}
                  />
                </Campo>

                <Campo etiqueta="Cédula de identidad *" error={erroresFormUsuario.ci_numero?.[0]}>
                  <input
                    type="text"
                    required
                    className="campo__control"
                    placeholder="Ej. 7894561"
                    value={formUsuario.ci_numero}
                    onChange={(e) => setFormUsuario({ ...formUsuario, ci_numero: e.target.value })}
                  />
                </Campo>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                <Campo etiqueta="Fecha de nacimiento *" error={erroresFormUsuario.fecha_nacimiento?.[0]}>
                  <input
                    type="date"
                    required
                    className="campo__control"
                    value={formUsuario.fecha_nacimiento}
                    onChange={(e) => setFormUsuario({ ...formUsuario, fecha_nacimiento: e.target.value })}
                  />
                </Campo>

                <Campo etiqueta="Teléfono" error={erroresFormUsuario.telefono?.[0]}>
                  <input
                    type="tel"
                    className="campo__control"
                    placeholder="Ej. 70012345"
                    value={formUsuario.telefono}
                    onChange={(e) => setFormUsuario({ ...formUsuario, telefono: e.target.value })}
                  />
                </Campo>
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <Campo etiqueta="Rol *" error={erroresFormUsuario.rol_id?.[0]}>
                  <select
                    className="campo__control"
                    required
                    value={formUsuario.rol_id}
                    onChange={(e) => setFormUsuario({ ...formUsuario, rol_id: e.target.value, carrera_ids: [] })}
                  >
                    <option value="">Elige un rol interno</option>
                    {rolesCatalogo
                      .filter((rol) => rol.es_panel)
                      .map((rol) => (
                        <option key={rol.id} value={rol.id}>
                          {rol.nombre} ({rol.codigo})
                        </option>
                      ))}
                  </select>
                </Campo>
              </div>

              {rolesCatalogo.find((rol) => String(rol.id) === String(formUsuario.rol_id))?.alcance_carrera && (
                <fieldset style={{ marginTop: '0.75rem', border: '1px solid var(--borde)', borderRadius: '8px', padding: '0.75rem' }}>
                  <legend style={{ padding: '0 0.35rem', fontSize: '0.9rem' }}>Carreras que atiende</legend>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: 'var(--texto-suave)' }}>
                    Opcional. Si marcas alguna, solo verá postulaciones de esas carreras.
                  </p>
                  <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {carrerasCatalogo.map((carrera) => (
                      <label key={carrera.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem' }}>
                        <input
                          type="checkbox"
                          checked={formUsuario.carrera_ids.map(String).includes(String(carrera.id))}
                          onChange={(e) => {
                            const id = carrera.id
                            setFormUsuario((prev) => ({
                              ...prev,
                              carrera_ids: e.target.checked
                                ? [...prev.carrera_ids, id]
                                : prev.carrera_ids.filter((actual) => String(actual) !== String(id)),
                            }))
                          }}
                        />
                        <span>{carrera.nombre}{carrera.facultad ? ` · ${carrera.facultad}` : ''}</span>
                      </label>
                    ))}
                  </div>
                  {erroresFormUsuario.carrera_ids?.[0] && <p className="campo__error">{erroresFormUsuario.carrera_ids[0]}</p>}
                </fieldset>
              )}

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
                <Campo etiqueta={editandoId ? 'Nueva contraseña' : 'Contraseña temporal *'} error={erroresFormUsuario.password?.[0]}>
                  <input
                    type="password"
                    required={!editandoId}
                    minLength={editandoId && !formUsuario.password ? undefined : 6}
                    className="campo__control"
                    placeholder={editandoId ? 'Déjala en blanco para no cambiarla' : 'Mínimo 6 caracteres'}
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
                  {guardandoUsuario ? 'Guardando…' : editandoId ? 'Guardar cambios' : 'Crear Usuario Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
