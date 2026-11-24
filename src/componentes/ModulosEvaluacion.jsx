import { useNavigate } from 'react-router'
import { obtenerModulosPrueba } from '../api/egresado.js'
import { ErrorCarga, Esqueleto, Vacio } from './Estado.jsx'
import { useConsulta } from '../utilidades/useConsulta.js'

const ACCION = {
  PENDIENTE: 'Rendir',
  EN_PROGRESO: 'Continuar',
  FINALIZADO: 'Ver resultado',
}

const ORDEN_FAMILIAS = ['PERSONALIDAD', 'INTELIGENCIA', 'HABILIDAD_BLANDA', 'HABILIDAD_ESPECIFICA']

export default function ModulosEvaluacion({ postulacionId }) {
  const navigate = useNavigate()
  const consulta = useConsulta(obtenerModulosPrueba, postulacionId)
  const modulos = consulta.datos ?? []
  const grupos = ORDEN_FAMILIAS
    .map((codigo) => ({
      codigo,
      nombre: modulos.find((modulo) => modulo.familia === codigo)?.modulo ?? codigo,
      items: modulos.filter((modulo) => modulo.familia === codigo),
    }))
    .filter((grupo) => grupo.items.length > 0)

  if (consulta.error) {
    return <ErrorCarga error={consulta.error} onReintentar={consulta.reintentar} />
  }

  if (!consulta.datos) {
    return <Esqueleto cantidad={2} />
  }

  if (modulos.length === 0) {
    return null
  }

  return (
    <section className="modulos-prueba" aria-labelledby="titulo-modulos">
      <header>
        <h2 id="titulo-modulos">Tus 4 módulos</h2>
        <p>
          Personalidad, inteligencia y habilidades blandas asignan un libro. En habilidades específicas rindes los tres libros de tu carrera.
        </p>
      </header>

      {modulos.every((modulo) => modulo.estado === 'BLOQUEADA') ? (
        <Vacio titulo="Tus pruebas todavía no están habilitadas">
          Se habilitan cuando la etapa anterior queda aprobada.
        </Vacio>
      ) : (
        <div className="modulos-prueba__grupos">
          {grupos.map((grupo) => (
            <section key={grupo.codigo} className="modulos-prueba__grupo" aria-label={grupo.nombre}>
              <h3>{grupo.nombre}</h3>
              <ul className="modulos-prueba__lista">
                {grupo.items.map((modulo) => {
                  const bloqueado = modulo.estado === 'BLOQUEADA'

                  return (
                    <li key={modulo.proceso_prueba_id} className="modulos-prueba__item">
                      <div>
                        <p className="modulos-prueba__modulo">{modulo.codigo}</p>
                        <h4>{modulo.nombre}</h4>
                        <p className={`modulos-prueba__estado modulos-prueba__estado--${modulo.estado.toLowerCase()}`}>
                          {etiqueta(modulo.estado)}
                          {modulo.estado === 'EN_PROGRESO' && modulo.segundos_restantes != null
                            ? ` · ${modulo.segundos_restantes}s de la pregunta`
                            : ''}
                          {modulo.estado === 'FINALIZADO' && modulo.puntaje_normalizado !== null
                            ? ` · ${modulo.puntaje_normalizado} / 100`
                            : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="boton boton--chico"
                        disabled={bloqueado}
                        onClick={() => navigate(`/postulaciones/${postulacionId}/test?proceso_prueba_id=${modulo.proceso_prueba_id}`)}
                      >
                        {bloqueado ? 'Bloqueada' : ACCION[modulo.estado]}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </section>
  )
}

function etiqueta(estado) {
  return {
    BLOQUEADA: 'Bloqueada',
    PENDIENTE: 'Pendiente',
    EN_PROGRESO: 'En progreso',
    FINALIZADO: 'Finalizado',
  }[estado] ?? estado
}
