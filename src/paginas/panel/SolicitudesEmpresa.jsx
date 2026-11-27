import { useState } from 'react'
import { Link } from 'react-router'
import { aprobarSolicitudEmpresa, obtenerSolicitudesEmpresaAdmin } from '../../api/empresa.js'
import ModalPerfilIdeal from '../../componentes/ModalPerfilIdeal.jsx'
import { ErrorCarga, Esqueleto, Vacio } from '../../componentes/Estado.jsx'
import { useConsulta } from '../../utilidades/useConsulta.js'

const FILTROS = [
  { id: 'todas', etiqueta: 'Todas' },
  { id: 'PENDIENTE_PAGO', etiqueta: 'Pendientes de pago' },
  { id: 'PENDIENTE_CANDIDATOS', etiqueta: 'Pagadas — sin candidatos' },
  { id: 'PENDIENTE_APROBACION', etiqueta: 'Legacy — aprobación' },
  { id: 'EN_CURSO', etiqueta: 'En curso' },
]

const ESTADO = {
  PENDIENTE_PAGO: { texto: 'SIN PAGO', clase: 'insignia--pendiente' },
  PENDIENTE_CANDIDATOS: { texto: 'PAGADA', clase: 'insignia--pendiente' },
  PENDIENTE_APROBACION: { texto: 'PENDIENTE', clase: 'insignia--pendiente' },
  EN_CURSO: { texto: 'EN CURSO', clase: 'insignia--exito' },
}

function tituloCargo(texto) {
  const limpio = (texto ?? '').trim().replace(/\s+/g, ' ')
  if (!limpio) return 'Puesto'
  return limpio.charAt(0).toLocaleUpperCase('es') + limpio.slice(1)
}

function filasCandidatos(solicitud, clavesFrescas) {
  const accesos = new Map((solicitud.accesos ?? []).map((acceso) => [acceso.correo, acceso]))
  const vistos = new Set()
  const filas = (solicitud.candidatos ?? []).map((candidato) => {
    const acceso = accesos.get(candidato.correo)
    vistos.add(candidato.correo)
    const fresca = acceso ? clavesFrescas[acceso.postulacion_id] : undefined
    return {
      id: acceso?.postulacion_id ?? candidato.correo,
      nombre: `${candidato.nombres} ${candidato.apellidos}`.trim(),
      ci: candidato.ci || '—',
      correo: candidato.correo,
      clave: fresca ?? acceso?.clave_temporal ?? null,
      claveVisible: Boolean(fresca),
      estado: acceso?.estado_evaluacion ?? 'Pendiente de aprobación',
    }
  })

  for (const acceso of solicitud.accesos ?? []) {
    if (vistos.has(acceso.correo)) continue
    const fresca = clavesFrescas[acceso.postulacion_id]
    filas.push({
      id: acceso.postulacion_id,
      nombre: acceso.nombre,
      ci: acceso.ci || '—',
      correo: acceso.correo,
      clave: fresca ?? acceso.clave_temporal ?? null,
      claveVisible: Boolean(fresca),
      estado: acceso.estado_evaluacion ?? 'En evaluación',
    })
  }

  return filas
}

export default function SolicitudesEmpresa() {
  const consulta = useConsulta(obtenerSolicitudesEmpresaAdmin)
  const [filtro, setFiltro] = useState('todas')
  const [aprobando, setAprobando] = useState(null)
  const [clavesFrescas, setClavesFrescas] = useState({})
  const [copiado, setCopiado] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [aviso, setAviso] = useState('')
  const [avisoExito, setAvisoExito] = useState('')

  async function aprobar(procesoId) {
    setAprobando(procesoId)
    setAviso('')
    setAvisoExito('')
    try {
      const data = await aprobarSolicitudEmpresa(procesoId)
      const frescas = {}
      for (const acceso of data.accesos ?? []) {
        if (acceso.clave_temporal) frescas[acceso.postulacion_id] = acceso.clave_temporal
      }
      setClavesFrescas((anteriores) => ({ ...anteriores, ...frescas }))
      setFiltro('EN_CURSO')
      setAvisoExito('Solicitud aprobada. Las claves nuevas quedan visibles en la tarjeta hasta que salgas de esta pantalla.')
      consulta.reintentar()
    } catch (error) {
      setAviso(error.message || 'No se pudo aprobar la solicitud.')
    } finally {
      setAprobando(null)
    }
  }

  function marcarCopiado(id) {
    setAviso('')
    setCopiado(id)
    window.setTimeout(() => setCopiado((actual) => (actual === id ? null : actual)), 2000)
  }

  async function copiar(fila) {
    const texto = `Correo: ${fila.correo}\nClave temporal: ${fila.clave}`
    try {
      await navigator.clipboard.writeText(texto)
      marcarCopiado(fila.id)
    } catch {
      const area = document.createElement('textarea')
      area.value = texto
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.left = '-9999px'
      document.body.appendChild(area)
      area.select()
      const copiadoOk = document.execCommand('copy')
      area.remove()
      if (copiadoOk) marcarCopiado(fila.id)
      else setAviso('No se pudo copiar el acceso.')
    }
  }

  if (consulta.error) return <ErrorCarga error={consulta.error} onReintentar={consulta.reintentar} />

  const solicitudes = consulta.datos ?? []
  const visibles = filtro === 'todas' ? solicitudes : solicitudes.filter((solicitud) => solicitud.estado === filtro)

  return (
    <div>
      <header className="panel__herramientas">
        <div>
          <h1 className="titulo-pagina">Solicitudes de empresa</h1>
          <p className="panel__descripcion">Las empresas cargan su puesto y su lista. Al aprobar, se crean los accesos de los candidatos.</p>
        </div>
      </header>

      {aviso && <p className="aviso aviso--error" role="alert">{aviso}</p>}
      {avisoExito && <p className="aviso aviso--exito" role="status">{avisoExito}</p>}

      <div className="solicitud-filtros" role="tablist" aria-label="Filtrar solicitudes por estado">
        {FILTROS.map((opcion) => {
          const cantidad = opcion.id === 'todas'
            ? solicitudes.length
            : solicitudes.filter((solicitud) => solicitud.estado === opcion.id).length
          return (
            <button
              key={opcion.id}
              type="button"
              role="tab"
              className="solicitud-filtro"
              aria-selected={filtro === opcion.id}
              onClick={() => setFiltro(opcion.id)}
            >
              {opcion.etiqueta} ({cantidad})
            </button>
          )
        })}
      </div>

      {consulta.cargando && !consulta.datos && <Esqueleto cantidad={2} />}
      {consulta.datos && solicitudes.length === 0 && <Vacio titulo="No hay solicitudes de empresa" />}
      {consulta.datos && solicitudes.length > 0 && visibles.length === 0 && (
        <Vacio titulo="No hay solicitudes en este estado" />
      )}

      <div className="solicitud-lista">
        {visibles.map((solicitud) => {
          const estado = ESTADO[solicitud.estado] ?? { texto: solicitud.estado, clase: 'insignia--neutro' }
          const filas = filasCandidatos(solicitud, clavesFrescas)
          return (
            <article key={solicitud.proceso_id} className="tarjeta solicitud">
              <header className="solicitud__cabecera">
                <div>
                  <p className="solicitud__codigo">{solicitud.codigo}</p>
                  <div className="solicitud__nombre">
                    <h2>{tituloCargo(solicitud.puesto.cargo)}</h2>
                    <span className={`insignia ${estado.clase}`}>{estado.texto}</span>
                  </div>
                </div>
                <div className="solicitud__acciones">
                  {solicitud.estado === 'PENDIENTE_APROBACION' && (
                    <button
                      type="button"
                      className="boton boton--chico"
                      disabled={aprobando === solicitud.proceso_id}
                      onClick={() => aprobar(solicitud.proceso_id)}
                    >
                      {aprobando === solicitud.proceso_id ? 'Aprobando…' : 'Aprobar solicitud'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="boton boton--secundario boton--chico"
                    onClick={() => setPerfil({ procesoId: solicitud.proceso_id, nombre: tituloCargo(solicitud.puesto.cargo) })}
                  >
                    Ver Perfil Ideal
                  </button>
                  {solicitud.estado === 'EN_CURSO' && (
                    <Link className="boton boton--secundario boton--chico" to={`/panel/postulaciones?proceso=${solicitud.proceso_id}`}>
                      Ir a entrevistas y resultados
                    </Link>
                  )}
                </div>
              </header>

              <dl className="solicitud__datos">
                <div>
                  <dt>Empresa</dt>
                  <dd>{solicitud.empresa.razon_social} · NIT {solicitud.empresa.nit}</dd>
                </div>
                <div>
                  <dt>Contacto</dt>
                  <dd>{solicitud.contacto.nombre} · {solicitud.contacto.correo}</dd>
                </div>
                <div>
                  <dt>Carrera</dt>
                  <dd>{solicitud.puesto.carrera || '—'}</dd>
                </div>
                <div>
                  <dt>Vacantes</dt>
                  <dd>{solicitud.puesto.vacantes}</dd>
                </div>
                <div className="solicitud__funciones">
                  <dt>Funciones</dt>
                  <dd>{solicitud.puesto.funciones}</dd>
                </div>
              </dl>

              <div className="tabla-envoltura">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Candidato</th>
                      <th>CI</th>
                      <th>Correo</th>
                      <th>Clave temporal</th>
                      <th>Estado de evaluación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((fila) => (
                      <tr key={fila.id}>
                        <td>{fila.nombre}</td>
                        <td>{fila.ci}</td>
                        <td>{fila.correo}</td>
                        <td>
                          <div className="solicitud__clave">
                            {fila.claveVisible ? (
                              <code>{fila.clave}</code>
                            ) : (
                              <span className="solicitud__oculta">
                                {fila.clave ? 'Ya entregada / oculta' : 'Se genera al aprobar'}
                              </span>
                            )}
                            {fila.clave && (
                              <button type="button" className="boton boton--secundario boton--chico" onClick={() => copiar(fila)}>
                                {copiado === fila.id ? 'Copiado' : 'Copiar acceso'}
                              </button>
                            )}
                          </div>
                        </td>
                        <td>{fila.estado}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          )
        })}
      </div>

      {perfil && (
        <ModalPerfilIdeal
          procesoId={perfil.procesoId}
          nombre={perfil.nombre}
          alCerrar={() => setPerfil(null)}
        />
      )}
    </div>
  )
}
