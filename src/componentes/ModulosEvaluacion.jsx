import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router'
import { obtenerModulosPrueba } from '../api/egresado.js'
import { ErrorCarga, Esqueleto, Vacio } from './Estado.jsx'
import { useConsulta } from '../utilidades/useConsulta.js'

const ORDEN_FAMILIAS = ['PERSONALIDAD', 'INTELIGENCIA', 'HABILIDAD_BLANDA', 'HABILIDAD_ESPECIFICA']

export default function ModulosEvaluacion({ postulacionId, refresco = 0, alCompletarEtapa }) {
  const navigate = useNavigate()
  const consulta = useConsulta(obtenerModulosPrueba, postulacionId)

  useEffect(() => {
    if (refresco > 0) {
      consulta.reintentar()
    }
  }, [refresco, consulta.reintentar])

  const modulos = consulta.datos ?? []

  const modulosOrdenados = useMemo(
    () => ORDEN_FAMILIAS.flatMap((codigo) => modulos.filter((modulo) => modulo.familia === codigo)),
    [modulos]
  )

  const destino = useMemo(() => elegirModuloDestino(modulosOrdenados), [modulosOrdenados])

  const habilitados = modulosOrdenados.filter((m) => m.estado !== 'BLOQUEADA')
  const pendientes = habilitados.filter((m) => m.estado === 'PENDIENTE' || m.estado === 'EN_PROGRESO')
  const todosFinalizados = habilitados.length > 0 && habilitados.every((m) => m.estado === 'FINALIZADO')
  const etapaSincronizada = useRef(false)

  useEffect(() => {
    etapaSincronizada.current = false
  }, [postulacionId])

  useEffect(() => {
    if (!todosFinalizados || !consulta.datos || etapaSincronizada.current) return
    etapaSincronizada.current = true
    alCompletarEtapa?.()
  }, [todosFinalizados, consulta.datos, alCompletarEtapa])

  if (consulta.error) {
    return <ErrorCarga error={consulta.error} onReintentar={consulta.reintentar} />
  }

  if (!consulta.datos) {
    return <Esqueleto cantidad={1} />
  }

  if (modulos.length === 0) {
    return null
  }

  if (modulos.every((modulo) => modulo.estado === 'BLOQUEADA')) {
    return (
      <section className="modulos-prueba modulos-prueba--paso" aria-labelledby="titulo-modulos">
        <header>
          <h2 id="titulo-modulos">Paso 4: Evaluaciones psicométricas</h2>
          <p>Completa los requisitos documentales para habilitar las cuatro pruebas del proceso.</p>
        </header>
        <Vacio titulo="Tus pruebas todavía no están habilitadas">
          Se habilitan cuando la documentación obligatoria queda completa y validada.
        </Vacio>
      </section>
    )
  }

  const etiquetaBoton = destino?.estado === 'EN_PROGRESO' ? 'Continuar evaluación' : 'Siguiente'

  function irEvaluaciones() {
    if (!destino?.proceso_prueba_id) return
    navigate(`/postulaciones/${postulacionId}/test?proceso_prueba_id=${destino.proceso_prueba_id}`)
  }

  return (
    <section className="modulos-prueba modulos-prueba--paso" aria-labelledby="titulo-modulos">
      <header>
        <h2 id="titulo-modulos">Paso 4: Evaluaciones psicométricas</h2>
        <p>
          {todosFinalizados ? (
            <>
              Completaste los {habilitados.length} módulos en línea asignados a tu postulación. No necesitas rendir
              más pruebas en este paso.
            </>
          ) : (
            <>
              {habilitados.length === 1
                ? '1 módulo asignado'
                : `${habilitados.length} módulos asignados`}{' '}
              (personalidad, inteligencia, habilidades blandas y específicas).
              {pendientes.length > 0
                ? ` Te falta${pendientes.length === 1 ? '' : 'n'} ${pendientes.length} por rendir.`
                : ''}
            </>
          )}
        </p>
      </header>

      {todosFinalizados ? (
        <div className="modulos-prueba__listo aviso aviso--exito" role="status">
          <div>
            <p style={{ margin: '0 0 0.5rem' }}>
              <strong>Tu parte en línea está lista.</strong> El equipo evaluador revisará tu expediente y, si
              corresponde, te convocará a entrevista u otros pasos del proceso.
            </p>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              Consulta el avance en la sección <strong>Progreso de la Postulación</strong>, arriba en esta página.
            </p>
          </div>
          {destino && (
            <button
              type="button"
              className="boton boton--secundario boton--chico modulos-prueba__listo-accion"
              onClick={irEvaluaciones}
            >
              Consultar resultados de mis pruebas
            </button>
          )}
        </div>
      ) : (
        <div className="modulos-prueba__cta tarjeta">
          <p className="modulos-prueba__cta-texto">
            En la siguiente pantalla verás cada prueba, sus instrucciones y podrás rendirlas en el orden que prefieras.
          </p>
          <button type="button" className="boton boton--primario" onClick={irEvaluaciones} disabled={!destino}>
            {etiquetaBoton} →
          </button>
        </div>
      )}
    </section>
  )
}

function elegirModuloDestino(modulosOrdenados) {
  const enProgreso = modulosOrdenados.find((m) => m.estado === 'EN_PROGRESO')
  if (enProgreso) return enProgreso

  const pendiente = modulosOrdenados.find((m) => m.estado === 'PENDIENTE')
  if (pendiente) return pendiente

  const habilitado = modulosOrdenados.find((m) => m.estado !== 'BLOQUEADA')
  return habilitado ?? modulosOrdenados[0] ?? null
}