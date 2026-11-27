import GraficoLineas16Pf from './GraficoLineas16Pf.jsx'
import { etiquetaFilaInforme } from '../utilidades/etiquetaInforme.js'

function texto(valor) {
  if (valor === null || valor === undefined) return '—'
  return Number(valor).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function valorKpi(valor, pendiente) {
  if (pendiente) return 'Pendiente'
  if (valor === null || valor === undefined) return '—'
  return `${valor}%`
}

export default function InformeEjecutivo({
  ejecutivo,
  perfilPersonalidad,
  compatibilidad,
  aproximacionPersonalidad,
  completitud,
}) {
  if (!ejecutivo) return null

  const { ficha, tabla_ponderada: tabla, totales } = ejecutivo

  function imprimir() {
    window.print()
  }

  return (
    <article className="informe-ejecutivo" aria-labelledby="titulo-evaluacion-candidato">
      <div className="informe-ejecutivo__acciones no-print">
        <button type="button" className="boton boton--secundario boton--chico" onClick={imprimir}>
          Imprimir / PDF
        </button>
      </div>

      <header className="informe-ejecutivo__cabecera">
        <div>
          <h2 id="titulo-evaluacion-candidato">Evaluación del candidato</h2>
        </div>
        <div className="informe-ejecutivo__foto" aria-hidden>
          <span>{(ficha?.nombre ?? '?').charAt(0)}</span>
        </div>
      </header>

      <dl className="informe-ejecutivo__ficha informe-ejecutivo__ficha--banda">
        <div>
          <dt>Nombre</dt>
          <dd>{ficha?.nombre ?? '—'}</dd>
        </div>
        <div>
          <dt>Cargo</dt>
          <dd>{ficha?.cargo ?? '—'}</dd>
        </div>
        {ficha?.edad != null && (
          <div>
            <dt>Edad</dt>
            <dd>{ficha.edad} años</dd>
          </div>
        )}
        <div>
          <dt>Código</dt>
          <dd><code>{ficha?.codigo ?? '—'}</code></dd>
        </div>
      </dl>

      {completitud?.mensaje && (
        <p className="informe-ejecutivo__aviso-curva" role="status">
          {completitud.mensaje}
          {completitud.preguntas_16pf_respondidas != null && completitud.preguntas_16pf_esperadas != null && (
            <>
              {' '}
              (16PF: {completitud.preguntas_16pf_respondidas} / {completitud.preguntas_16pf_esperadas} preguntas)
            </>
          )}
        </p>
      )}

      <div className="informe-ejecutivo__resumen">
        <aside className="informe-ejecutivo__kpi informe-ejecutivo__kpi--total">
          <span className="informe-ejecutivo__kpi-etiqueta">Total ponderado</span>
          <strong className="informe-ejecutivo__kpi-valor">{texto(totales?.puntaje_total)}</strong>
          <span className="informe-ejecutivo__kpi-ayuda">Suma de aportes (máx. 100)</span>
        </aside>
        <aside className={`informe-ejecutivo__kpi${compatibilidad == null ? ' informe-ejecutivo__kpi--pendiente' : ''}`}>
          <span className="informe-ejecutivo__kpi-etiqueta">Compatibilidad</span>
          <strong className="informe-ejecutivo__kpi-valor">
            {valorKpi(compatibilidad, compatibilidad == null)}
          </strong>
          <span className="informe-ejecutivo__kpi-ayuda">Solo con batería completa</span>
        </aside>
        <aside className={`informe-ejecutivo__kpi${aproximacionPersonalidad == null ? ' informe-ejecutivo__kpi--pendiente' : ''}`}>
          <span className="informe-ejecutivo__kpi-etiqueta">Coincidencia 16PF</span>
          <strong className="informe-ejecutivo__kpi-valor">
            {valorKpi(aproximacionPersonalidad, !completitud?.personalidad_16pf_completa)}
          </strong>
          <span className="informe-ejecutivo__kpi-ayuda">Ideal vs real (16 factores)</span>
        </aside>
      </div>

      {(tabla?.length ?? 0) > 0 && (
        <div className="informe-ejecutivo__tabla-wrap">
          <table className="informe-ejecutivo__tabla">
            <thead>
              <tr>
                <th scope="col">Evaluación</th>
                <th scope="col" title="Peso del instrumento en el total">
                  Coeficiente
                </th>
                <th scope="col" title="Calificación normalizada de la prueba">
                  Resultado
                  <span className="informe-ejecutivo__th-sub">0–100</span>
                </th>
                <th scope="col" title="Resultado × coeficiente; lo que suma al ranking">
                  Aporte al total
                </th>
              </tr>
            </thead>
            <tbody>
              {tabla.map((fila) => {
                const pts = fila.entrevista_puntos
                const tituloResultado = pts?.obtenido != null && pts?.maximo != null
                  ? `Entrevista: ${texto(pts.obtenido)} / ${texto(pts.maximo)} pts → ${texto(fila.puntaje_bruto)} en escala 0–100`
                  : undefined

                return (
                  <tr key={fila.codigo ?? fila.etiqueta}>
                    <th scope="row">{etiquetaFilaInforme(fila)}</th>
                    <td>{texto(fila.coeficiente)}</td>
                    <td title={tituloResultado}>
                      {fila.puntaje_bruto == null ? '—' : texto(fila.puntaje_bruto)}
                    </td>
                    <td className="informe-ejecutivo__celda-aporte">
                      {fila.puntaje_ponderado == null ? (
                        '—'
                      ) : (
                        <>
                          <strong>{texto(fila.puntaje_ponderado)}</strong>
                          {fila.puntaje_bruto != null && fila.coeficiente != null && (
                            <span className="informe-ejecutivo__formula">
                              {texto(fila.puntaje_bruto)}×{texto(fila.coeficiente)}
                            </span>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="informe-ejecutivo__fila-total">
                <th scope="row">Total de aportes</th>
                <td colSpan={2} />
                <td className="informe-ejecutivo__celda-aporte">
                  <strong>{texto(totales?.subtotal_pruebas ?? totales?.puntaje_total)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
          <p className="informe-ejecutivo__nota-tabla">
            Cada <strong>aporte</strong> = resultado (0–100) × coeficiente. El <strong>total ponderado</strong> es la suma
            de aportes (comparable al ranking).
          </p>
        </div>
      )}

      <GraficoLineas16Pf
        filas={perfilPersonalidad ?? []}
        aproximacion={aproximacionPersonalidad}
        personalidadCompleta={Boolean(completitud?.personalidad_16pf_completa)}
      />
    </article>
  )
}