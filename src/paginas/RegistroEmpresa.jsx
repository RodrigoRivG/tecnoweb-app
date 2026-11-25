import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { obtenerCatalogoSolicitud, registrarSolicitudEmpresa } from '../api/empresa.js'
import Campo from '../componentes/Campo.jsx'
import { ErrorCarga, Esqueleto } from '../componentes/Estado.jsx'
import { useSesion } from '../sesion/SesionContext.jsx'

const CANDIDATO_VACIO = {
  nombres: '',
  apellido_paterno: '',
  ci_numero: '',
  fecha_nacimiento: '',
  correo: '',
}

export default function RegistroEmpresa() {
  const { usuario, cargando, iniciarSesion } = useSesion()
  const navegar = useNavigate()
  const [catalogo, setCatalogo] = useState(null)
  const [errorCatalogo, setErrorCatalogo] = useState(null)
  const [aviso, setAviso] = useState('')
  const [errores, setErrores] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [empresa, setEmpresa] = useState({
    razon_social: '',
    nit: '',
    correo_empresa: '',
    telefono: '',
    nombres: '',
    apellido_paterno: '',
    ci_numero: '',
    fecha_nacimiento: '',
    correo_contacto: '',
    password: '',
    password_confirmation: '',
  })
  const [puesto, setPuesto] = useState({
    cargo: '',
    area: '',
    vacantes: 1,
    descripcion_funciones: '',
    carrera_id: '',
  })
  const [niveles, setNiveles] = useState({})
  const [candidatos, setCandidatos] = useState([{ ...CANDIDATO_VACIO }])

  useEffect(() => {
    let activo = true
    obtenerCatalogoSolicitud()
      .then((data) => {
        if (!activo) return
        setCatalogo(data)
        const iniciales = {}
        ;[...(data.personalidad ?? []), ...(data.habilidades_blandas ?? [])].forEach((dimension) => {
          iniciales[dimension.dimension_id] = 5
        })
        setNiveles(iniciales)
        if (data.carreras?.[0]) setPuesto((actual) => ({ ...actual, carrera_id: String(data.carreras[0].id) }))
      })
      .catch((error) => activo && setErrorCatalogo(error))
    return () => {
      activo = false
    }
  }, [])

  if (cargando) return <p className="contenedor seccion">Cargando tu cuenta…</p>
  if (usuario?.rol?.codigo === 'EMPRESA') return <Navigate to="/empresa" replace />

  function cambiarEmpresa(evento) {
    const { name, value } = evento.target
    setEmpresa((actual) => ({ ...actual, [name]: value }))
  }

  function cambiarPuesto(evento) {
    const { name, value } = evento.target
    setPuesto((actual) => ({ ...actual, [name]: value }))
  }

  function cambiarCandidato(indice, campo, valor) {
    setCandidatos((lista) => lista.map((item, i) => (i === indice ? { ...item, [campo]: valor } : item)))
  }

  async function enviar(evento) {
    evento.preventDefault()
    setEnviando(true)
    setAviso('')
    setErrores({})
    try {
      const sesion = await registrarSolicitudEmpresa({
        ...empresa,
        ...puesto,
        carrera_id: Number(puesto.carrera_id),
        vacantes: Number(puesto.vacantes),
        niveles: Object.entries(niveles).map(([dimensionId, valor]) => ({
          dimension_id: Number(dimensionId),
          valor_ideal: Number(valor),
        })),
        candidatos,
      })
      iniciarSesion(sesion)
      navegar('/empresa', { replace: true })
    } catch (error) {
      const campos = error.errores ?? {}
      const textos = Object.values(campos).flat().filter(Boolean)
      setErrores(campos)
      setAviso(textos.length > 0 ? textos.join(' ') : (error.message || 'No se pudo registrar la solicitud.'))
      setEnviando(false)
    }
  }

  function errorDe(campo) {
    const mensajes = errores[campo]
    return Array.isArray(mensajes) ? mensajes[0] : undefined
  }

  return (
    <div className="contenedor seccion">
      <header className="seccion__cabecera">
        <div>
          <h1 className="titulo-pagina">Solicitud de empresa</h1>
          <p className="seccion__descripcion">
            Registra tu empresa, el puesto, el perfil ideal y la lista cerrada. El administrador revisa la solicitud antes de crear los accesos.
          </p>
        </div>
      </header>

      {errorCatalogo && <ErrorCarga error={errorCatalogo} />}
      {!catalogo && !errorCatalogo && <Esqueleto cantidad={4} />}

      {catalogo && (
        <form className="formulario" onSubmit={enviar}>
          {aviso && <p className="aviso aviso--error" role="alert">{aviso}</p>}

          <section className="tarjeta" aria-labelledby="titulo-empresa">
            <h2 id="titulo-empresa">Empresa y contacto</h2>
            <div className="rejilla">
              <Campo etiqueta="Razón social" error={errorDe('razon_social')}>{(props) => <input {...props} name="razon_social" value={empresa.razon_social} onChange={cambiarEmpresa} required />}</Campo>
              <Campo etiqueta="NIT" error={errorDe('nit')}>{(props) => <input {...props} name="nit" value={empresa.nit} onChange={cambiarEmpresa} required />}</Campo>
              <Campo etiqueta="Correo de la empresa" error={errorDe('correo_empresa')}>{(props) => <input {...props} type="email" name="correo_empresa" value={empresa.correo_empresa} onChange={cambiarEmpresa} required />}</Campo>
              <Campo etiqueta="Teléfono" opcional error={errorDe('telefono')}>{(props) => <input {...props} name="telefono" value={empresa.telefono} onChange={cambiarEmpresa} />}</Campo>
              <Campo etiqueta="Nombres del contacto" error={errorDe('nombres')}>{(props) => <input {...props} name="nombres" value={empresa.nombres} onChange={cambiarEmpresa} required />}</Campo>
              <Campo etiqueta="Apellido del contacto" error={errorDe('apellido_paterno')}>{(props) => <input {...props} name="apellido_paterno" value={empresa.apellido_paterno} onChange={cambiarEmpresa} required />}</Campo>
              <Campo etiqueta="Cédula del contacto" error={errorDe('ci_numero')}>{(props) => <input {...props} name="ci_numero" value={empresa.ci_numero} onChange={cambiarEmpresa} required />}</Campo>
              <Campo etiqueta="Fecha de nacimiento" error={errorDe('fecha_nacimiento')}>{(props) => <input {...props} type="date" name="fecha_nacimiento" value={empresa.fecha_nacimiento} onChange={cambiarEmpresa} required />}</Campo>
              <Campo etiqueta="Correo de acceso" error={errorDe('correo_contacto')}>{(props) => <input {...props} type="email" name="correo_contacto" value={empresa.correo_contacto} onChange={cambiarEmpresa} required />}</Campo>
              <Campo etiqueta="Contraseña" ayuda="Mínimo 8 caracteres, con letras y números." error={errorDe('password')}>{(props) => <input {...props} type="password" name="password" value={empresa.password} onChange={cambiarEmpresa} required minLength={8} />}</Campo>
              <Campo etiqueta="Confirmar contraseña" error={errorDe('password_confirmation')}>{(props) => <input {...props} type="password" name="password_confirmation" value={empresa.password_confirmation} onChange={cambiarEmpresa} required />}</Campo>
            </div>
          </section>

          <section className="tarjeta" aria-labelledby="titulo-puesto">
            <h2 id="titulo-puesto">Puesto</h2>
            <div className="rejilla">
              <Campo etiqueta="Cargo" error={errorDe('cargo')}>{(props) => <input {...props} name="cargo" value={puesto.cargo} onChange={cambiarPuesto} required />}</Campo>
              <Campo etiqueta="Área" opcional error={errorDe('area')}>{(props) => <input {...props} name="area" value={puesto.area} onChange={cambiarPuesto} />}</Campo>
              <Campo etiqueta="Vacantes" error={errorDe('vacantes')}>{(props) => <input {...props} type="number" min="1" max="50" name="vacantes" value={puesto.vacantes} onChange={cambiarPuesto} required />}</Campo>
              <Campo etiqueta="Carrera de referencia" error={errorDe('carrera_id')}>
                {(props) => (
                  <select {...props} name="carrera_id" value={puesto.carrera_id} onChange={cambiarPuesto} required>
                    {catalogo.carreras.map((carrera) => (
                      <option key={carrera.id} value={carrera.id}>{carrera.nombre}</option>
                    ))}
                  </select>
                )}
              </Campo>
            </div>
            <Campo etiqueta="Funciones" error={errorDe('descripcion_funciones')}>
              {(props) => <textarea {...props} name="descripcion_funciones" rows={4} value={puesto.descripcion_funciones} onChange={cambiarPuesto} required />}
            </Campo>
          </section>

          <section className="tarjeta" aria-labelledby="titulo-perfil">
            <h2 id="titulo-perfil">Perfil ideal, del 1 al 10</h2>
            {errorDe('niveles') && <p className="aviso aviso--error" role="alert">{errorDe('niveles')}</p>}
            <h3>Personalidad</h3>
            <div className="rejilla">
              {catalogo.personalidad.map((dimension) => (
                <Campo key={dimension.dimension_id} etiqueta={`${dimension.codigo ?? ''} ${dimension.nombre}`.trim()}>
                  {(props) => (
                    <input
                      {...props}
                      type="number"
                      min="1"
                      max="10"
                      value={niveles[dimension.dimension_id] ?? 5}
                      onChange={(evento) => setNiveles((actual) => ({ ...actual, [dimension.dimension_id]: evento.target.value }))}
                      required
                    />
                  )}
                </Campo>
              ))}
            </div>
            <h3>Habilidades blandas</h3>
            <div className="rejilla">
              {catalogo.habilidades_blandas.map((dimension) => (
                <Campo key={dimension.dimension_id} etiqueta={dimension.nombre}>
                  {(props) => (
                    <input
                      {...props}
                      type="number"
                      min="1"
                      max="10"
                      value={niveles[dimension.dimension_id] ?? 5}
                      onChange={(evento) => setNiveles((actual) => ({ ...actual, [dimension.dimension_id]: evento.target.value }))}
                      required
                    />
                  )}
                </Campo>
              ))}
            </div>
          </section>

          <section className="tarjeta" aria-labelledby="titulo-lista">
            <h2 id="titulo-lista">Lista cerrada</h2>
            {errorDe('candidatos') && <p className="aviso aviso--error" role="alert">{errorDe('candidatos')}</p>}
            {candidatos.map((candidato, indice) => (
              <div className="rejilla" key={indice} style={{ marginBottom: '1rem' }}>
                <Campo etiqueta="Nombres" error={errorDe(`candidatos.${indice}.nombres`)}>{(props) => <input {...props} value={candidato.nombres} onChange={(evento) => cambiarCandidato(indice, 'nombres', evento.target.value)} required />}</Campo>
                <Campo etiqueta="Apellido" error={errorDe(`candidatos.${indice}.apellido_paterno`)}>{(props) => <input {...props} value={candidato.apellido_paterno} onChange={(evento) => cambiarCandidato(indice, 'apellido_paterno', evento.target.value)} required />}</Campo>
                <Campo etiqueta="Cédula" error={errorDe(`candidatos.${indice}.ci_numero`)}>{(props) => <input {...props} value={candidato.ci_numero} onChange={(evento) => cambiarCandidato(indice, 'ci_numero', evento.target.value)} required />}</Campo>
                <Campo etiqueta="Fecha de nacimiento" error={errorDe(`candidatos.${indice}.fecha_nacimiento`)}>{(props) => <input {...props} type="date" value={candidato.fecha_nacimiento} onChange={(evento) => cambiarCandidato(indice, 'fecha_nacimiento', evento.target.value)} required />}</Campo>
                <Campo etiqueta="Correo" error={errorDe(`candidatos.${indice}.correo`)}>{(props) => <input {...props} type="email" value={candidato.correo} onChange={(evento) => cambiarCandidato(indice, 'correo', evento.target.value)} required />}</Campo>
              </div>
            ))}
            <button type="button" className="boton boton--secundario" onClick={() => setCandidatos((lista) => [...lista, { ...CANDIDATO_VACIO }])}>
              Agregar candidato
            </button>
          </section>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button type="submit" className="boton" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar solicitud'}</button>
            <Link to="/iniciar-sesion">Ya tengo cuenta</Link>
          </div>
        </form>
      )}
    </div>
  )
}
