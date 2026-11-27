import { useState } from 'react'
import { obtenerEstadisticasAdmin } from '../../api/admin.js'
import { ErrorCarga, Esqueleto, Vacio } from '../../componentes/Estado.jsx'
import { formatearFecha } from '../../utilidades/formato.js'
import { SECCIONES_PANEL } from '../../utilidades/roles.js'
import { useConsulta } from '../../utilidades/useConsulta.js'

const NUMERO = new Intl.NumberFormat('es-BO')
const FECHA_CORTA = new Intl.DateTimeFormat('es-BO', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const INDICADORES = [
  ['visitas', 'Visitas'],
  ['accesos_exitosos', 'Inicios de sesión exitosos'],
  ['accesos_fallidos', 'Inicios de sesión fallidos'],
]
const NOMBRES_PAGINAS = {
  '/': 'Inicio',
  '/iniciar-sesion': 'Iniciar sesión',
  '/registro': 'Registro',
  '/empresa/registro': 'Registro de empresa',
  '/empresa': 'Mi empresa',
  '/empresa/informes/:id': 'Informe de empresa',
  '/mi-cuenta': 'Mi cuenta',
  '/postulaciones/:id': 'Detalle de postulación',
  '/postulaciones/:id/test': 'Evaluación en línea',
  '/panel': 'Panel',
  '/panel/postulaciones/:id': 'Expediente de postulación',
  '/404': 'Página no encontrada',
  ...Object.fromEntries(SECCIONES_PANEL.map(({ ruta, titulo }) => [ruta, titulo])),
}

function fechaCorta(fecha) {
  return FECHA_CORTA.format(new Date(`${fecha}T00:00:00Z`))
}

function ActividadDiaria({ actividad, periodo, totales }) {
  const maximo = Math.max(...actividad.map(({ visitas }) => visitas), 0)
  const hayActividad = INDICADORES.some(([clave]) => totales[clave] > 0)

  return (
    <section className="tarjeta estadisticas__bloque" aria-labelledby="estadisticas-actividad">
      <div className="seccion__cabecera">
        <h2 id="estadisticas-actividad">Visitas por día</h2>
        {maximo > 0 && <p className="panel__descripcion">Máximo diario {NUMERO.format(maximo)}</p>}
      </div>

      {maximo === 0 ? <Vacio titulo="Sin visitas en este período" /> : (
        <div aria-hidden="true">
          <div className="estadisticas__barras" style={{ gridTemplateColumns: `repeat(${actividad.length}, minmax(0, 1fr))` }}>
            {actividad.map(({ fecha, visitas }) => (
              <div className="estadisticas__dia" key={fecha} title={`${fechaCorta(fecha)} · ${NUMERO.format(visitas)} visitas`}>
                <span style={{ height: `${(visitas / maximo) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="estadisticas__eje">
            <span>{fechaCorta(periodo.desde)}</span>
            <span>{fechaCorta(periodo.hasta)}</span>
          </div>
        </div>
      )}

      {hayActividad && (
        <details className="estadisticas__datos">
          <summary>Ver actividad por día</summary>
          <div className="tabla-envoltura">
            <table className="tabla" aria-label="Actividad diaria">
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col" className="numero">Visitas</th>
                  <th scope="col" className="numero">Inicios exitosos</th>
                  <th scope="col" className="numero">Inicios fallidos</th>
                </tr>
              </thead>
              <tbody>
                {actividad.map((dia) => (
                  <tr key={dia.fecha}>
                    <td><time dateTime={dia.fecha}>{formatearFecha(dia.fecha)}</time></td>
                    {INDICADORES.map(([clave]) => <td className="numero" key={clave}>{NUMERO.format(dia[clave])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  )
}

function PaginasVisitadas({ paginas }) {
  const maximo = paginas[0]?.visitas

  return (
    <section className="tarjeta estadisticas__bloque" aria-labelledby="estadisticas-paginas">
      <h2 id="estadisticas-paginas">Páginas más visitadas</h2>
      {paginas.length === 0 ? <Vacio titulo="Sin visitas en este período" /> : (
        <ol className="estadisticas__paginas" role="list">
          {paginas.map(({ ruta, visitas }) => (
            <li key={ruta}>
              <div className="estadisticas__pagina">
                <span>{NOMBRES_PAGINAS[ruta] ?? ruta}</span>
                <strong>{NUMERO.format(visitas)}</strong>
              </div>
              <div className="estadisticas__pista" aria-hidden="true">
                <span style={{ width: `${(visitas / maximo) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function PostulacionesPorEtapa({ postulaciones }) {
  return (
    <section className="tarjeta estadisticas__bloque" aria-labelledby="estadisticas-postulaciones">
      <div>
        <h2 id="estadisticas-postulaciones">Postulaciones por etapa</h2>
        <p className="panel__descripcion">Estado actual de todas las postulaciones.</p>
      </div>
      {postulaciones.length === 0 ? <Vacio titulo="Todavía no hay postulaciones por etapa" /> : (
        <div className="tabla-envoltura">
          <table className="tabla" aria-labelledby="estadisticas-postulaciones">
            <thead>
              <tr>
                <th scope="col">Etapa</th>
                <th scope="col" className="numero">Aprobadas</th>
                <th scope="col" className="numero">Pendientes o en curso</th>
                <th scope="col" className="numero">Reprobadas</th>
              </tr>
            </thead>
            <tbody>
              {postulaciones.map((etapa) => (
                <tr key={etapa.etapa}>
                  <td>{etapa.nombre}</td>
                  <td className="numero">{NUMERO.format(etapa.aprobadas)}</td>
                  <td className="numero">{NUMERO.format(etapa.en_curso)}</td>
                  <td className="numero">{NUMERO.format(etapa.reprobadas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default function Estadisticas() {
  const [dias, setDias] = useState(30)
  const { datos, error, cargando, reintentar } = useConsulta(obtenerEstadisticasAdmin, { dias })

  return (
    <>
      <header className="panel__herramientas">
        <h1 className="titulo-pagina">Estadísticas</h1>
        <label className="estadisticas__periodo">
          Período de visitas y accesos
          <select value={dias} onChange={(evento) => setDias(Number(evento.target.value))}>
            <option value={7}>Últimos 7 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={90}>Últimos 90 días</option>
          </select>
        </label>
      </header>

      <div aria-busy={cargando}>
        {error && <ErrorCarga error={error} onReintentar={reintentar} />}
        {cargando && <Esqueleto />}

        {!error && !cargando && datos && (
          <div className="estadisticas">
            <dl className="estadisticas__indicadores">
              {INDICADORES.map(([clave, titulo]) => (
                <div className="tarjeta estadisticas__indicador" key={clave}>
                  <dt>{titulo}</dt>
                  <dd>{NUMERO.format(datos.totales[clave])}</dd>
                </div>
              ))}
            </dl>

            <div className="estadisticas__resumen">
              <ActividadDiaria actividad={datos.actividad} periodo={datos.periodo} totales={datos.totales} />
              <PaginasVisitadas paginas={datos.paginas} />
            </div>

            <PostulacionesPorEtapa postulaciones={datos.postulaciones} />
          </div>
        )}
      </div>
    </>
  )
}
