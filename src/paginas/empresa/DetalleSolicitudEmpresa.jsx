import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { descartarBorradorEmpresa, obtenerSolicitudesEmpresa, vacanteDescartable } from '../../api/empresa.js'
import TablaAccesosEmpresa from '../../componentes/empresa/TablaAccesosEmpresa.jsx'
import ConfirmacionDialog from '../../componentes/ConfirmacionDialog.jsx'
import { ErrorCarga } from '../../componentes/Estado.jsx'
import { useSesion } from '../../sesion/SesionContext.jsx'
import { accionUrgenteVacante } from '../../utilidades/flujoVacanteEmpresa.js'
import ResumenClavesCandidatos from '../../componentes/empresa/ResumenClavesCandidatos.jsx'
import { useConsulta } from '../../utilidades/useConsulta.js'

const ESTADOS = {
  PENDIENTE_PAGO: 'Pendiente de pago',
  PENDIENTE_CANDIDATOS: 'Pago listo — completar solicitud',
  PENDIENTE_APROBACION: 'Pendiente de revisión',
  EN_CURSO: 'En curso',
}

export default function DetalleSolicitudEmpresa() {
  const { procesoId } = useParams()
  const { state } = useLocation()
  const navegar = useNavigate()
  const { usuario, cargando } = useSesion()
  const consulta = useConsulta(obtenerSolicitudesEmpresa)
  const [descartando, setDescartando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)

  if (cargando) return <p className="contenedor seccion">Cargando…</p>
  if (!usuario) return <Navigate to="/iniciar-sesion" replace state={{ desde: `/empresa/solicitudes/${procesoId}` }} />
  if (usuario.rol?.codigo !== 'EMPRESA') return <Navigate to="/" replace />

  const solicitud = consulta.datos?.find((item) => String(item.proceso_id) === String(procesoId))

  if (consulta.error) return <ErrorCarga error={consulta.error} onReintentar={consulta.reintentar} />
  if (consulta.cargando && !solicitud) return <p className="contenedor seccion">Cargando solicitud…</p>
  if (!solicitud) {
    return (
      <div className="contenedor seccion">
        <p>No encontramos esa vacante.</p>
        <Link to="/empresa">Volver al panel</Link>
      </div>
    )
  }

  const urgente = accionUrgenteVacante(solicitud)

  if (state?.clavesCandidatos?.length) {
    return (
      <ResumenClavesCandidatos
        procesoId={procesoId}
        accesos={state.clavesCandidatos}
        ampliar={Boolean(state.ampliar)}
        titulo={state.ampliar ? 'Nuevos accesos creados' : 'Pago confirmado — accesos listos'}
        descripcion={
          state.ampliar
            ? 'Tras pagar la ampliación, estos candidatos ya pueden rendir.'
            : 'Comparte cada clave con su candidato.'
        }
      />
    )
  }

  async function ejecutarEliminar() {
    setDescartando(true)
    setAviso('')
    try {
      await descartarBorradorEmpresa(procesoId)
      setConfirmarEliminar(false)
      navegar('/empresa', { replace: true, state: { borradorEliminado: solicitud.codigo } })
    } catch (error) {
      setAviso(error.message || 'No se pudo descartar.')
      setDescartando(false)
    }
  }

  return (
    <div className="contenedor seccion">
      <Link to="/empresa">← Mis vacantes</Link>
      {state?.pagoOk && !state?.clavesCandidatos && (
        <p className="aviso aviso--exito" role="status" style={{ marginTop: '1rem' }}>
          <strong>Pago registrado.</strong>{' '}
          {state.trasPago === 'ampliacion'
            ? 'Los candidatos nuevos ya pueden evaluar.'
            : 'Revisa la tabla de abajo y comparte las claves temporales.'}
        </p>
      )}

      {(state?.vacanteNueva || state?.salirSinCompletar) && solicitud.datos_puesto_pendientes && (
        <div className="aviso aviso--exito" role="status" style={{ marginTop: '1rem' }}>
          {state?.salirSinCompletar ? (
            <>
              <p>
                <strong>Sin cambios guardados.</strong> Saliste del formulario antes de guardar; la vacante sigue en borrador
                en tu panel.
              </p>
              <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                Cuando quieras continuar, usa <strong>Definir puesto y perfil</strong> (cargo, 16PF y habilidades blandas).
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>Nueva vacante en borrador.</strong> Aún no obliga a completar nada: entra al formulario cuando te
                convenga.
              </p>
              <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                ¿La abriste por error? Pulsa <strong>Eliminar borrador</strong> más abajo. Si vas a usarla, el siguiente paso
                es definir puesto y perfil.
              </p>
            </>
          )}
        </div>
      )}

      {aviso && (
        <p className="aviso aviso--error" role="alert" style={{ marginTop: '1rem' }}>
          {aviso}
        </p>
      )}

      <header style={{ marginTop: '1rem' }}>
        <p className="banco__codigo">{solicitud.codigo}</p>
        <h1 className="titulo-pagina">
          {solicitud.datos_puesto_pendientes ? 'Puesto por definir' : solicitud.puesto?.cargo}
        </h1>
        <p className="seccion__descripcion">
          {ESTADOS[solicitud.estado] ?? solicitud.estado}
          {!solicitud.datos_puesto_pendientes && (
            <>
              {' '}
              · {solicitud.puesto?.carrera} · {solicitud.puesto?.vacantes} vacante(s) a cubrir ·{' '}
              {solicitud.accesos?.length ?? 0} candidato(s) con acceso
            </>
          )}
        </p>
      </header>

      {urgente && (
        <p className="aviso aviso--exito" role="status" style={{ marginTop: '1rem' }}>
          <strong>Siguiente paso:</strong> {urgente.descripcion}
        </p>
      )}

      <div className="formulario__acciones" style={{ marginTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        {urgente && (
          <Link to={urgente.ruta} state={urgente.estado} className="boton boton--primario">
            {urgente.etiqueta}
          </Link>
        )}
        {solicitud.estado === 'EN_CURSO' && !solicitud.datos_puesto_pendientes && (
          <Link to={`/empresa/solicitudes/${procesoId}/candidatos?ampliar=1`} className="boton boton--secundario">
            Agregar candidatos
          </Link>
        )}
        {vacanteDescartable(solicitud) && (
          <button
            type="button"
            className="boton boton--secundario"
            disabled={descartando}
            onClick={() => setConfirmarEliminar(true)}
          >
            {descartando ? 'Eliminando…' : 'Eliminar borrador'}
          </button>
        )}
      </div>

      <ConfirmacionDialog
        abierto={confirmarEliminar}
        titulo={`¿Eliminar la vacante ${solicitud.codigo}?`}
        etiquetaConfirmar="Eliminar"
        etiquetaCancelar="Cancelar"
        confirmarPeligroso
        confirmando={descartando}
        onCancelar={() => !descartando && setConfirmarEliminar(false)}
        onConfirmar={ejecutarEliminar}
      >
        <p>Solo puedes eliminarla mientras no hay pago ni candidatos guardados.</p>
        <p>Se borrará por completo y no podrás recuperarla después.</p>
      </ConfirmacionDialog>

      <section style={{ marginTop: '1.5rem' }}>
        <h2 className="grupo__subtitulo">Candidatos y informes</h2>
        <TablaAccesosEmpresa accesos={solicitud.accesos} />
      </section>
    </div>
  )
}