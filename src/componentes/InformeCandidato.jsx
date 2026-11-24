import { useConsulta } from '../utilidades/useConsulta.js'
import { obtenerInformePostulacion } from '../api/evaluador.js'
import { ErrorCarga, Esqueleto } from './Estado.jsx'
import CuadroPerfilBipolar from './CuadroPerfilBipolar.jsx'

function textoPuntaje(puntaje, maximo) {
  if (puntaje === null || puntaje === undefined) return 'Sin calificar'
  return `${puntaje} / ${maximo}`
}

export default function InformeCandidato({ postulacionId, consultar = obtenerInformePostulacion }) {
  const consulta = useConsulta(consultar, postulacionId)
  const informe = consulta.datos

  if (consulta.error) {
    return <ErrorCarga error={consulta.error} onReintentar={consulta.reintentar} />
  }

  if (!informe) {
    return <Esqueleto cantidad={3} />
  }

  const resumen = informe.resumen_puntajes
  const personalidad = (informe.perfil_personalidad ?? []).map((fila) => ({
    ...fila,
    esten_real: fila.esten_real,
    esten_ideal: fila.esten_ideal,
  }))
  const blandas = (informe.perfil_habilidades_blandas ?? []).map((fila) => ({
    ...fila,
    esten_real: fila.valor_real,
    esten_ideal: fila.valor_ideal,
    bruto: null,
  }))

  return (
    <section className="informe" aria-labelledby="titulo-informe">
      <header className="informe__cabecera">
        <div>
          <h2 id="titulo-informe">Informe final</h2>
          <p>{informe.postulante} · {informe.codigo}</p>
        </div>
        <p className="informe__global">
          <span>Compatibilidad</span>
          <strong>
            {informe.porcentaje_compatibilidad_global === null ? '—' : `${informe.porcentaje_compatibilidad_global}%`}
          </strong>
        </p>
      </header>

      <CuadroPerfilBipolar
        titulo="Perfil de personalidad (16PF)"
        descripcion="Curva ideal de la convocatoria y curva real del postulante, en estenes del 1 al 10."
        filas={personalidad}
        mostrarBruto
        porcentaje={informe.porcentaje_aproximacion_personalidad}
      />

      <CuadroPerfilBipolar
        titulo="Perfil de habilidades blandas"
        descripcion="Nivel ideal solicitado frente al nivel real en inteligencia emocional y competencias socioemocionales."
        filas={blandas}
        porcentaje={informe.porcentaje_aproximacion_habilidades}
      />

      <div className="informe-puntajes">
        <article className="informe-puntaje">
          <h3>Inteligencia general</h3>
          <p className="informe-puntaje__valor">
            {textoPuntaje(resumen.inteligencia?.puntaje, resumen.inteligencia?.maximo ?? 100)}
          </p>
          <p>{resumen.inteligencia?.nombre ?? 'Sin prueba de inteligencia calificada'}</p>
        </article>

        <article className="informe-puntaje">
          <h3>Habilidades específicas</h3>
          {resumen.habilidades_especificas?.length ? (
            <ul>
              {resumen.habilidades_especificas.map((prueba) => (
                <li key={prueba.codigo}>
                  <span>{prueba.nombre}</span>
                  <strong>{textoPuntaje(prueba.puntaje, prueba.maximo)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>Sin pruebas específicas calificadas.</p>
          )}
          <p className="informe-puntaje__subtotal">
            Subtotal {textoPuntaje(resumen.subtotal_habilidades_especificas?.puntaje, 100)}
          </p>
        </article>

        <article className="informe-puntaje">
          <h3>Entrevista y conocimientos técnicos</h3>
          <p className="informe-puntaje__valor">
            {textoPuntaje(resumen.entrevista?.total, resumen.entrevista?.maximo ?? 40)}
          </p>
          <ul>
            {(resumen.entrevista?.criterios ?? []).map((criterio) => (
              <li key={criterio.nombre}>
                <span>{criterio.nombre}</span>
                <strong>{textoPuntaje(criterio.puntaje, criterio.maximo)}</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="informe-puntaje informe-puntaje--total">
          <h3>Total general</h3>
          <p className="informe-puntaje__valor">
            {textoPuntaje(resumen.total_general?.puntaje, resumen.total_general?.maximo ?? 100)}
          </p>
          <p>Puntaje ponderado para el ranking de la convocatoria.</p>
        </article>
      </div>
    </section>
  )
}
