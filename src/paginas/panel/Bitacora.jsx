import { useState } from 'react'
import { obtenerBitacoraAdmin } from '../../api/admin.js'
import { ErrorCarga, Esqueleto, Vacio } from '../../componentes/Estado.jsx'
import { useConsulta } from '../../utilidades/useConsulta.js'

const FILTROS_INICIALES = { page: 1 }
const FORMATO_FECHA_HORA = new Intl.DateTimeFormat('es-BO', {
  dateStyle: 'medium',
  timeStyle: 'medium',
  hour12: false,
  timeZone: 'America/La_Paz',
})

export default function Bitacora() {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)
  const [errorFechas, setErrorFechas] = useState(false)
  const { datos, error, cargando, reintentar } = useConsulta(obtenerBitacoraAdmin, filtros)
  const eventos = datos?.data ?? []
  const meta = datos?.meta

  function aplicarFiltros(evento) {
    evento.preventDefault()
    const valores = Object.fromEntries(new FormData(evento.currentTarget))
    const rangoInvalido = Boolean(valores.desde && valores.hasta && valores.desde > valores.hasta)
    setErrorFechas(rangoInvalido)

    if (!rangoInvalido) setFiltros({ ...valores, page: 1 })
  }

  function limpiarFiltros() {
    setErrorFechas(false)
    setFiltros(FILTROS_INICIALES)
  }

  return (
    <>
      <header className="panel__herramientas">
        <div>
          <h1 className="titulo-pagina">Bitácora de accesos</h1>
          <p className="panel__descripcion">Inicios de sesión exitosos y fallidos.</p>
        </div>
      </header>

      <form className="filtros bitacora__filtros" aria-label="Filtrar bitácora" onSubmit={aplicarFiltros} onReset={limpiarFiltros}>
        <label className="filtros__campo">
          Resultado
          <select name="resultado">
            <option value="">Todos</option>
            <option value="LOGIN_EXITOSO">Exitoso</option>
            <option value="LOGIN_FALLIDO">Fallido</option>
          </select>
        </label>
        <label className="filtros__campo">
          Desde
          <input type="date" name="desde" />
        </label>
        <label className="filtros__campo">
          Hasta
          <input type="date" name="hasta" aria-invalid={errorFechas || undefined} />
        </label>
        <button type="submit" className="boton boton--secundario">Aplicar filtros</button>
        <button type="reset" className="boton boton--secundario">Limpiar</button>
      </form>

      {errorFechas && <p className="aviso aviso--error" role="alert">La fecha final debe ser igual o posterior a la inicial.</p>}

      <section aria-label="Eventos de inicio de sesión" aria-busy={cargando}>
        {error && <ErrorCarga error={error} onReintentar={reintentar} />}
        {cargando && <Esqueleto cantidad={2} />}
        {!error && !cargando && eventos.length === 0 && <Vacio titulo="No se encontraron eventos de acceso" />}

        {!error && !cargando && eventos.length > 0 && (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th scope="col">Fecha y hora (Bolivia)</th>
                  <th scope="col">Resultado</th>
                  <th scope="col">Usuario</th>
                  <th scope="col">Dirección IP</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((evento) => {
                  const exitoso = evento.tipo === 'LOGIN_EXITOSO'
                  return (
                    <tr key={evento.id}>
                      <td><time dateTime={evento.fecha}>{FORMATO_FECHA_HORA.format(new Date(evento.fecha))}</time></td>
                      <td><span className={`insignia ${exitoso ? 'insignia--exito' : 'insignia--error'}`}>{exitoso ? 'Exitoso' : 'Fallido'}</span></td>
                      <td>{evento.correo ?? 'Sin cuenta identificada'}</td>
                      <td className="codigo">{evento.direccion_ip ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!error && meta?.last_page > 1 && (
        <nav className="paginacion bitacora__paginacion" aria-label="Páginas de la bitácora">
          <button
            type="button"
            className="boton boton--secundario boton--chico"
            disabled={cargando || meta.current_page <= 1}
            onClick={() => setFiltros({ ...filtros, page: meta.current_page - 1 })}
          >
            Anterior
          </button>
          <span>Página {meta.current_page} de {meta.last_page}</span>
          <button
            type="button"
            className="boton boton--secundario boton--chico"
            disabled={cargando || meta.current_page >= meta.last_page}
            onClick={() => setFiltros({ ...filtros, page: meta.current_page + 1 })}
          >
            Siguiente
          </button>
        </nav>
      )}
    </>
  )
}
