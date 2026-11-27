import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import {
  crearNuevaVacanteEmpresa,
  descartarBorradorEmpresa,
  obtenerSolicitudesEmpresa,
  vacanteDescartable,
} from '../api/empresa.js'
import ConfirmacionDialog from '../componentes/ConfirmacionDialog.jsx'
import { ErrorCarga, Esqueleto, Vacio } from '../componentes/Estado.jsx'
import { useSesion } from '../sesion/SesionContext.jsx'
import { accionUrgenteVacante } from '../utilidades/flujoVacanteEmpresa.js'
import { useConsulta } from '../utilidades/useConsulta.js'

const ESTADOS = {
  PENDIENTE_PAGO: 'Pendiente de pago',
  PENDIENTE_CANDIDATOS: 'Pago listo — completar solicitud',
  PENDIENTE_APROBACION: 'Pendiente de revisión',
  EN_CURSO: 'En curso',
}

export default function PanelEmpresa() {
  const { usuario, cargando } = useSesion()
  if (cargando) return <p className="contenedor seccion">Cargando tu cuenta…</p>
  if (!usuario) return <Navigate to="/iniciar-sesion" replace state={{ desde: '/empresa' }} />
  if (usuario.rol?.codigo !== 'EMPRESA') return <Navigate to="/" replace />
  return <ListaVacantes />
}

function ListaVacantes() {
  const navegar = useNavigate()
  const { state } = useLocation()
  const consulta = useConsulta(obtenerSolicitudesEmpresa)
  const solicitudes = consulta.datos ?? []
  const [creando, setCreando] = useState(false)
  const [descartandoId, setDescartandoId] = useState(null)
  const [aviso, setAviso] = useState('')
  const [dialogo, setDialogo] = useState(null)

  function pedirNuevaVacante() {
    setDialogo({ tipo: 'nueva' })
  }

  async function confirmarNuevaVacante() {
    setCreando(true)
    setAviso('')
    try {
      const data = await crearNuevaVacanteEmpresa()
      setDialogo(null)
      await consulta.reintentar()
      navegar(`/empresa/solicitudes/${data.proceso_id}`, { replace: true, state: { vacanteNueva: true } })
    } catch (error) {
      setAviso(error.message || 'No se pudo abrir la nueva vacante.')
      setCreando(false)
    }
  }

  function pedirEliminar(procesoId, codigo) {
    setDialogo({ tipo: 'eliminar', procesoId, codigo })
  }

  async function confirmarEliminar() {
    if (dialogo?.tipo !== 'eliminar') return
    const { procesoId } = dialogo
    setDescartandoId(procesoId)
    setAviso('')
    try {
      await descartarBorradorEmpresa(procesoId)
      setDialogo(null)
      await consulta.reintentar()
    } catch (error) {
      setAviso(error.message || 'No se pudo descartar la vacante.')
    } finally {
      setDescartandoId(null)
    }
  }

  if (consulta.error) return <ErrorCarga error={consulta.error} onReintentar={consulta.reintentar} />

  return (
    <div className="contenedor seccion">
      <header className="seccion__cabecera">
        <div>
          <h1 className="titulo-pagina">Vacantes de tu empresa</h1>
          <p className="seccion__descripcion">
            Aquí ves cada puesto por separado. Puedes abrir una vacante nueva, sumar candidatos a una en curso y revisar los
            informes cuando terminen las evaluaciones.
          </p>
        </div>
        <button type="button" className="boton boton--secundario" disabled={creando} onClick={pedirNuevaVacante}>
          {creando ? 'Abriendo…' : 'Nueva vacante / puesto'}
        </button>
      </header>

      {state?.recienRegistrado && !state?.salirSinCompletar && (
        <div className="aviso aviso--exito" role="status" style={{ marginBottom: '1rem' }}>
          <p>
            <strong>Bienvenido.</strong> Tu cuenta ya está activa y tu primera vacante figura en la lista como borrador.
            Cuando quieras, sigue estos pasos: definir el puesto y el perfil (16PF y habilidades), registrar candidatos y
            pagar.
          </p>
          {state.procesoId && (
            <Link
              to={`/empresa/solicitudes/${state.procesoId}`}
              className="boton boton--primario"
              style={{ marginTop: '0.75rem' }}
            >
              Ir a mi primera vacante
            </Link>
          )}
        </div>
      )}

      {state?.borradorEliminado && (
        <p className="aviso aviso--exito" role="status" style={{ marginBottom: '1rem' }}>
          <strong>Listo.</strong> La vacante {state.borradorEliminado} se eliminó y ya no aparece en tu panel.
        </p>
      )}

      {aviso && (
        <p className="aviso aviso--error" role="alert">
          {aviso}
        </p>
      )}

      {consulta.cargando && !consulta.datos && <Esqueleto cantidad={2} />}
      {consulta.datos && solicitudes.length === 0 && <Vacio titulo="Todavía no tienes vacantes abiertas" />}

      <div className="rejilla rejilla--vacantes-empresa">
        {solicitudes.map((solicitud) => {
          const urgente = accionUrgenteVacante(solicitud)
          const nAccesos = solicitud.accesos?.length ?? 0
          return (
            <article key={solicitud.proceso_id} className="tarjeta tarjeta--vacante-empresa">
              <div className="vacante-tarjeta__cabecera">
                <p className="banco__codigo">{solicitud.codigo}</p>
                <span className="vacante-tarjeta__estado">{ESTADOS[solicitud.estado] ?? solicitud.estado}</span>
              </div>
              <h2 className="vacante-tarjeta__titulo">
                <Link to={`/empresa/solicitudes/${solicitud.proceso_id}`}>
                  {solicitud.datos_puesto_pendientes ? 'Puesto por definir' : solicitud.puesto?.cargo}
                </Link>
              </h2>
              {solicitud.datos_puesto_pendientes ? (
                <p className="vacante-tarjeta__meta">Borrador · completa el formulario de 4 pasos cuando quieras.</p>
              ) : (
                <p className="vacante-tarjeta__meta">
                  {solicitud.puesto?.carrera} · {solicitud.puesto?.vacantes} vacante(s)
                  {nAccesos > 0 && <> · {nAccesos} candidato{nAccesos === 1 ? '' : 's'} evaluando</>}
                  {(solicitud.candidatos_pendientes_pago ?? 0) > 0 && (
                    <> · {solicitud.candidatos_pendientes_pago} sin pagar</>
                  )}
                </p>
              )}
              {nAccesos > 0 && (
                <p className="vacante-tarjeta__hint">
                  Candidatos e informes están en el <Link to={`/empresa/solicitudes/${solicitud.proceso_id}`}>detalle de la vacante</Link>.
                </p>
              )}
              <div className="vacante-tarjeta__acciones">
                {urgente ? (
                  <>
                    <Link
                      to={urgente.ruta}
                      state={urgente.estado}
                      className="boton boton--primario"
                      title={urgente.descripcion}
                    >
                      {urgente.etiqueta}
                    </Link>
                    <Link to={`/empresa/solicitudes/${solicitud.proceso_id}`} className="boton boton--secundario">
                      Ver vacante
                    </Link>
                  </>
                ) : (
                  <Link to={`/empresa/solicitudes/${solicitud.proceso_id}`} className="boton boton--primario">
                    Abrir vacante
                  </Link>
                )}
                {vacanteDescartable(solicitud) && (
                  <button
                    type="button"
                    className="boton boton--secundario boton--chico"
                    disabled={descartandoId === solicitud.proceso_id}
                    onClick={() => pedirEliminar(solicitud.proceso_id, solicitud.codigo)}
                  >
                    {descartandoId === solicitud.proceso_id ? 'Eliminando…' : 'Eliminar borrador'}
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>

      <ConfirmacionDialog
        abierto={dialogo?.tipo === 'nueva'}
        titulo="¿Abrir una nueva vacante?"
        etiquetaConfirmar="Sí, crear borrador"
        etiquetaCancelar="Cancelar"
        confirmando={creando}
        onCancelar={() => !creando && setDialogo(null)}
        onConfirmar={confirmarNuevaVacante}
      >
        <p>Se guardará un borrador nuevo en tu panel, con su propio código.</p>
        <p>Podrás definir el puesto, registrar candidatos y pagar cuando te convenga; nada es obligatorio ahora.</p>
        <p>Si fue un clic por error, más tarde puedes quitarlo con <strong>Eliminar borrador</strong> en la tarjeta.</p>
      </ConfirmacionDialog>

      <ConfirmacionDialog
        abierto={dialogo?.tipo === 'eliminar'}
        titulo={dialogo?.tipo === 'eliminar' ? `¿Eliminar la vacante ${dialogo.codigo}?` : ''}
        etiquetaConfirmar="Eliminar"
        etiquetaCancelar="Cancelar"
        confirmarPeligroso
        confirmando={descartandoId != null}
        onCancelar={() => descartandoId == null && setDialogo(null)}
        onConfirmar={confirmarEliminar}
      >
        <p>Esta vacante aún no tiene pago ni candidatos guardados, así que puede quitarse del panel.</p>
        <p>La eliminación es definitiva: no podrás recuperarla después.</p>
      </ConfirmacionDialog>
    </div>
  )
}