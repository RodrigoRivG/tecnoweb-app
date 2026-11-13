import { useEffect, useMemo, useState } from 'react'
import { Check, Shield, UserCheck, Users } from 'lucide-react'
import { Link } from 'react-router'
import {
  actualizarPermisosRolAdmin,
  obtenerRolesPermisosAdmin,
} from '../../api/admin.js'
import { ErrorCarga, Esqueleto } from '../../componentes/Estado.jsx'

export default function RolesPermisos() {
  const [datosRbac, setDatosRbac] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [rolSeleccionadoId, setRolSeleccionadoId] = useState(null)
  const [permisosRolSeleccionado, setPermisosRolSeleccionado] = useState(new Set())
  const [permisosOriginalesRol, setPermisosOriginalesRol] = useState(new Set())
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState(null)

  async function cargarRbac() {
    setCargando(true)
    setError(null)
    try {
      const data = await obtenerRolesPermisosAdmin()
      setDatosRbac(data)
    } catch (err) {
      setError(err.message || 'Error al cargar la matriz de roles y permisos.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    let activo = true

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
        setCargando(false)
      })
      .catch((err) => {
        if (activo) {
          setError(err.message || 'Error al cargar la matriz de roles y permisos.')
          setCargando(false)
        }
      })

    return () => {
      activo = false
    }
  }, [])

  function seleccionarRol(rolId) {
    setRolSeleccionadoId(rolId)
    const rol = datosRbac?.roles?.find((r) => r.id === rolId)
    const setIds = new Set(rol?.permisos_ids || [])
    setPermisosRolSeleccionado(new Set(setIds))
    setPermisosOriginalesRol(new Set(setIds))
    setAviso(null)
  }

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

  async function guardarPermisosRol() {
    if (!rolSeleccionadoId) return
    setGuardando(true)
    setAviso(null)
    try {
      const ids = Array.from(permisosRolSeleccionado)
      await actualizarPermisosRolAdmin(rolSeleccionadoId, ids)
      setPermisosOriginalesRol(new Set(permisosRolSeleccionado))

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
        mensaje: 'Permisos del rol actualizados y sincronizados exitosamente en la base de datos.',
      })
    } catch (err) {
      setAviso({
        tipo: 'error',
        mensaje: err.message || 'Error al guardar los permisos del rol.',
      })
    } finally {
      setGuardando(false)
    }
  }

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

  const hayCambiosPermisos = useMemo(() => {
    if (permisosRolSeleccionado.size !== permisosOriginalesRol.size) return true
    for (const id of permisosRolSeleccionado) {
      if (!permisosOriginalesRol.has(id)) return true
    }
    return false
  }, [permisosRolSeleccionado, permisosOriginalesRol])

  const rolActual = datosRbac?.roles?.find((r) => r.id === rolSeleccionadoId)

  return (
    <div>
      {/* Cabecera de Sección */}
      <header className="seccion__cabecera" style={{ marginBottom: '1.5rem' }}>
        <div>
          <span className="convocatoria__facultad" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Seguridad & Control de Acceso
          </span>
          <h1 className="titulo-pagina" style={{ margin: '0.25rem 0' }}>
            Roles y Permisos (RBAC)
          </h1>
          <p className="seccion__descripcion" style={{ margin: 0 }}>
            Configuración y auditoría granular de facultades, operaciones y accesos por rol del sistema.
          </p>
        </div>

        <div>
          <Link to="/panel/usuarios" className="boton boton--secundario">
            <Users size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
            Gestionar Cuentas de Usuarios
          </Link>
        </div>
      </header>

      {/* Banner de Aviso */}
      {aviso && (
        <div className={`aviso aviso--${aviso.tipo}`} role="alert" style={{ marginBottom: '1.5rem' }}>
          <p>{aviso.mensaje}</p>
        </div>
      )}

      {cargando ? (
        <Esqueleto filas={6} />
      ) : error ? (
        <ErrorCarga mensaje={error} alReintentar={cargarRbac} />
      ) : (
        <div>
          {/* Barra de Selección de Roles */}
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
              <h2 style={{ fontSize: '1.15rem', margin: '0 0 0.25rem' }}>Selecciona un Rol</h2>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--texto-suave)' }}>
                Elige el rol cuyas facultades deseas visualizar o modificar en el sistema.
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
                    onClick={() => seleccionarRol(rol.id)}
                  >
                    <UserCheck size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
                    {rol.nombre}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tarjeta Informativa del Rol Seleccionado */}
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
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className="codigo" style={{ fontSize: '0.85rem' }}>
                      {rolActual.codigo}
                    </span>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{rolActual.nombre}</h2>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--texto-suave)' }}>
                    {rolActual.descripcion || 'Sin descripción configurada.'}
                  </p>
                </div>

                <button
                  type="button"
                  className="boton boton--primario"
                  disabled={guardando || !hayCambiosPermisos}
                  onClick={guardarPermisosRol}
                >
                  {guardando ? (
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
                  💡 <strong>Superusuario:</strong> El rol <code>ADMIN</code> tiene acceso irrestricto concedido en el backend por diseño para garantizar la operatividad institucional del sistema.
                </div>
              )}
            </div>
          )}

          {/* Matriz de Permisos por Módulo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {Object.entries(permisosPorModulo).map(([modulo, permisos]) => (
              <div key={modulo} className="tarjeta" style={{ padding: '1.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    borderBottom: '1px solid #e2e8f0',
                    paddingBottom: '0.75rem',
                  }}
                >
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
  )
}

