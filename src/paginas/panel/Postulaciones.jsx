import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { obtenerTodasPostulaciones } from '../../api/evaluador.js'
import { ErrorCarga, Esqueleto } from '../../componentes/Estado.jsx'
import { FILTROS_SITUACION, situacionExpediente } from '../../utilidades/expedienteEvaluador.js'
import { etiquetaEstadoPostulacion, claseInsigniaEstado } from '../../utilidades/postulacionResumen.js'
import { useConsulta } from '../../utilidades/useConsulta.js'
import ListadoPanel from './ListadoPanel.jsx'

function badgeEtapa(etapa) {
  if (!etapa) return null
  const esAprobada = etapa.estado === 'APROBADA'
  const esPendiente = etapa.estado === 'PENDIENTE'

  let clase = 'insignia--secundario'
  if (esAprobada) clase = 'insignia--exito'
  else if (esPendiente) clase = 'insignia--primario'
  else if (etapa.estado === 'EN_REVISION') clase = 'insignia--advertencia'
  else if (etapa.estado === 'REPROBADA') clase = 'insignia--error'

  return (
    <span className={`insignia ${clase}`} style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
      Etapa {etapa.orden}: {etapa.nombre} ({etapa.estado})
    </span>
  )
}

function pestanaActiva(origenActual, valor) {
  return origenActual === valor ? 'panel__pestaña panel__pestaña--activa' : 'panel__pestaña'
}

export default function Postulaciones() {
  const [parametros, setParametros] = useSearchParams()
  const [filtroSituacion, setFiltroSituacion] = useState('')
  const procesoId = parametros.get('proceso')
  const vistaEmpresa = Boolean(procesoId) || parametros.get('origen') === 'empresa'
  const origen = vistaEmpresa ? 'empresa' : 'talento'

  const filtrosApi = procesoId ? { proceso_id: procesoId } : { origen }
  const { datos: postulaciones, cargando, error, reintentar } = useConsulta(obtenerTodasPostulaciones, filtrosApi)

  const filas = useMemo(() => {
    const lista = postulaciones ?? []
    if (!filtroSituacion) return lista
    return lista.filter((p) => (p.resumen?.situacion ?? 'sin_pruebas') === filtroSituacion)
  }, [postulaciones, filtroSituacion])

  function cambiarOrigen(siguiente) {
    const nuevos = new URLSearchParams()
    if (siguiente === 'empresa') {
      nuevos.set('origen', 'empresa')
    }
    setParametros(nuevos)
  }

  if (cargando) {
    return (
      <div style={{ padding: '1rem 0' }}>
        <h1 className="titulo-pagina">Postulaciones y Evaluaciones</h1>
        <p className="panel__descripcion">Cargando expedientes de postulantes…</p>
        <Esqueleto cantidad={4} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '1rem 0' }}>
        <h1 className="titulo-pagina">Postulaciones y Evaluaciones</h1>
        <ErrorCarga error={error} onReintentar={reintentar} />
      </div>
    )
  }

  const codigoProceso = filas.find((postulacion) => postulacion.proceso_codigo)?.proceso_codigo
  const tituloContexto = vistaEmpresa
    ? (procesoId
      ? `Candidatos de la vacante ${codigoProceso ?? procesoId}`
      : 'Candidatos invitados por empresas (procesos privados)')
    : 'Egresados en convocatorias de talento (procesos universitarios)'

  const columnaTercera = vistaEmpresa
    ? ['contexto', 'Empresa y vacante']
    : ['carrera', 'Carrera y PPA']

  return (
    <ListadoPanel
      titulo="Postulaciones y Evaluaciones"
      descripcion={procesoId
        ? `${tituloContexto}. Calificá entrevistas y consultá resultados de esta vacante.`
        : tituloContexto}
      acciones={(
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end' }}>
        <div className="panel__pestañas">
          {!procesoId && (
            <>
              <button type="button" className={pestanaActiva(origen, 'talento')} onClick={() => cambiarOrigen('talento')}>
                Convocatorias (egresados)
              </button>
              <button type="button" className={pestanaActiva(origen, 'empresa')} onClick={() => cambiarOrigen('empresa')}>
                Candidatos de empresa
              </button>
            </>
          )}
          {procesoId && (
            <Link to="/panel/postulaciones?origen=empresa" className="boton boton--secundario boton--chico">
              Todas las vacantes de empresa
            </Link>
          )}
        </div>
        <div className="panel__pestañas" role="group" aria-label="Filtrar por avance">
          {FILTROS_SITUACION.map(({ valor, etiqueta }) => (
            <button
              key={valor || 'todos'}
              type="button"
              className={filtroSituacion === valor ? 'panel__pestaña panel__pestaña--activa' : 'panel__pestaña'}
              onClick={() => setFiltroSituacion(valor)}
            >
              {etiqueta}
            </button>
          ))}
        </div>
        </div>
      )}
      filas={filas}
      textoDe={(p) => {
        const s = situacionExpediente(p)
        return `${p.codigo} ${p.postulante?.nombre_completo} ${p.postulante?.correo} ${p.carrera ?? ''} ${p.empresa ?? ''} ${p.vacante ?? ''} ${s.etiqueta} ${s.detalle} ${p.etapa_actual?.nombre ?? ''}`
      }}
      columnas={[
        ['codigo', 'Código'],
        ['postulante', 'Postulante'],
        columnaTercera,
        ['situacion', 'Avance / resultado'],
        ['etapa', 'Etapa actual del embudo'],
        ['accion', 'Acciones', 'tabla__alinear-derecha'],
      ]}
      fila={(p) => (
        <tr key={p.id}>
          <td>
            <strong style={{ color: 'var(--primario)' }}>{p.codigo}</strong>
            <span className="insignia insignia--secundario" style={{ display: 'block', marginTop: '0.35rem', width: 'fit-content', fontSize: '0.72rem' }}>
              {p.origen === 'empresa' ? 'Empresa' : 'Talento'}
            </span>
          </td>
          <td>
            <div style={{ fontWeight: 600 }}>{p.postulante?.nombre_completo || 'Postulante'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--texto-suave)' }}>
              CI: {p.postulante?.ci || 'N/A'} &bull; {p.postulante?.correo}
            </div>
          </td>
          <td>
            {vistaEmpresa ? (
              <>
                <div style={{ fontWeight: 600 }}>{p.vacante || 'Vacante'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--texto-suave)' }}>
                  {p.empresa || 'Empresa'} {p.carrera ? `· ${p.carrera}` : ''}
                </div>
              </>
            ) : (
              <>
                <div>{p.carrera || '—'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--texto-suave)' }}>
                  PPA: <strong>{p.ppa ?? '—'}</strong>{p.ppa != null ? ' / 100' : ''}
                  {p.gestion ? ` · Gestión ${p.gestion}` : ''}
                </div>
              </>
            )}
          </td>
          <td>
            {(() => {
              const s = situacionExpediente(p)
              return (
                <>
                  <span className={`insignia ${s.clase}`} style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {s.etiqueta}
                  </span>
                  <div style={{ fontSize: '0.78rem', color: 'var(--texto-suave)', marginTop: '0.35rem', maxWidth: '14rem' }}>
                    {s.detalle}
                  </div>
                  {p.estado && p.estado !== 'EN_PROCESO' && (
                    <span
                      className={`insignia ${claseInsigniaEstado(p.estado)}`}
                      style={{ display: 'inline-block', marginTop: '0.35rem', fontSize: '0.72rem' }}
                    >
                      {etiquetaEstadoPostulacion(p.estado)}
                    </span>
                  )}
                </>
              )
            })()}
          </td>
          <td>{badgeEtapa(p.etapa_actual)}</td>
          <td className="tabla__alinear-derecha">
            <Link
              to={`/panel/postulaciones/${p.id}`}
              className="boton boton--secundario boton--chico"
              style={{ whiteSpace: 'nowrap' }}
            >
              Evaluar / Ver expediente →
            </Link>
          </td>
        </tr>
      )}
    />
  )
}