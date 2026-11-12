import { Link } from 'react-router'
import { obtenerTodasPostulaciones } from '../../api/evaluador.js'
import { ErrorCarga, Esqueleto } from '../../componentes/Estado.jsx'
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

  return (
    <span className={`insignia ${clase}`} style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
      Etapa {etapa.orden}: {etapa.nombre} ({etapa.estado})
    </span>
  )
}

export default function Postulaciones() {
  const { datos: postulaciones, cargando, error, reintentar } = useConsulta(obtenerTodasPostulaciones)

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

  const filas = postulaciones || []

  return (
    <ListadoPanel
      titulo="Postulaciones y Evaluaciones"
      descripcion="Expedientes de postulantes universitarios por carrera, etapa y méritos para evaluación y adjudicación."
      filas={filas}
      textoDe={(p) => `${p.codigo} ${p.postulante?.nombre_completo} ${p.postulante?.correo} ${p.carrera} ${p.etapa_actual?.nombre}`}
      columnas={[
        ['codigo', 'Código'],
        ['postulante', 'Postulante'],
        ['carrera', 'Carrera y PPA'],
        ['etapa', 'Etapa Actual del Embudo'],
        ['accion', 'Acciones', 'tabla__alinear-derecha'],
      ]}
      fila={(p) => (
        <tr key={p.id}>
          <td>
            <strong style={{ color: 'var(--primario)' }}>{p.codigo}</strong>
          </td>
          <td>
            <div style={{ fontWeight: 600 }}>{p.postulante?.nombre_completo || 'Postulante'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--texto-suave)' }}>
              CI: {p.postulante?.ci || 'N/A'} &bull; {p.postulante?.correo}
            </div>
          </td>
          <td>
            <div>{p.carrera}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--texto-suave)' }}>
              PPA: <strong>{p.ppa}</strong> / 100
            </div>
          </td>
          <td>{badgeEtapa(p.etapa_actual)}</td>
          <td className="tabla__alinear-derecha">
            <Link
              to={`/panel/postulaciones/${p.id}`}
              className="boton boton--secundario boton--chico"
              style={{ whiteSpace: 'nowrap' }}
            >
              Evaluar / Ver Expediente →
            </Link>
          </td>
        </tr>
      )}
    />
  )
}

