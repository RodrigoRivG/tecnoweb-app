import { useEffect, useState } from 'react'
import {
  actualizarLibroAdmin,
  actualizarPreguntaAdmin,
  actualizarTiempoFamilia,
  crearLibroAdmin,
  crearPreguntaAdmin,
  eliminarPreguntaAdmin,
  obtenerCatalogoPruebasAdmin,
  obtenerCarrerasAdmin,
  obtenerJerarquiaBanco,
  obtenerPreguntasAdmin,
  subirImagenPreguntaAdmin,
} from '../../api/admin.js'
import { ErrorCarga, Esqueleto, Vacio } from '../../componentes/Estado.jsx'

export default function BancoEvaluaciones() {
  const [familias, setFamilias] = useState(null)
  const [error, setError] = useState(null)
  const [familiaCodigo, setFamiliaCodigo] = useState('PERSONALIDAD')
  const [libroId, setLibroId] = useState(null)
  const [preguntas, setPreguntas] = useState([])
  const [total, setTotal] = useState(0)
  const [cargandoPreguntas, setCargandoPreguntas] = useState(true)
  const [marca, setMarca] = useState(0)
  const [carreras, setCarreras] = useState([])
  const [dimensiones, setDimensiones] = useState([])
  const [formLibro, setFormLibro] = useState(null)
  const [formPregunta, setFormPregunta] = useState(null)

  useEffect(() => {
    let activo = true
    obtenerJerarquiaBanco()
      .then((data) => {
        if (!activo) return
        setFamilias(data)
        const primera = data?.[0]
        const libro = primera?.detalle?.[0]
        if (primera) setFamiliaCodigo(primera.codigo)
        if (libro) setLibroId(libro.id)
        else setCargandoPreguntas(false)
      })
      .catch((err) => {
        if (activo) setError(err)
      })
    return () => {
      activo = false
    }
  }, [])

  useEffect(() => {
    obtenerCarrerasAdmin()
      .then((data) => setCarreras(data ?? []))
      .catch(() => setCarreras([]))
    obtenerCatalogoPruebasAdmin()
      .then((data) => setDimensiones(data?.dimensiones ?? []))
      .catch(() => setDimensiones([]))
  }, [])

  useEffect(() => {
    if (!libroId) return undefined
    let activo = true
    obtenerPreguntasAdmin({ prueba_id: libroId, page: 1, per_page: 500 })
      .then((respuesta) => {
        if (!activo) return
        setPreguntas(respuesta.data ?? [])
        setTotal(respuesta.meta?.total ?? respuesta.data?.length ?? 0)
      })
      .catch((err) => {
        if (activo) setError(err)
      })
      .finally(() => {
        if (activo) setCargandoPreguntas(false)
      })
    return () => {
      activo = false
    }
  }, [libroId, marca])

  if (error) {
    return <ErrorCarga error={error} onReintentar={() => window.location.reload()} />
  }

  if (!familias) {
    return <Esqueleto cantidad={3} />
  }

  const familia = familias.find((item) => item.codigo === familiaCodigo) ?? familias[0]
  const libro = familia?.detalle?.find((item) => item.id === libroId) ?? null

  function elegirFamilia(codigo) {
    const siguiente = familias.find((item) => item.codigo === codigo)
    setCargandoPreguntas(true)
    setFamiliaCodigo(codigo)
    setLibroId(siguiente?.detalle?.[0]?.id ?? null)
    setPreguntas([])
    setTotal(0)
    if (!siguiente?.detalle?.[0]) setCargandoPreguntas(false)
  }

  async function recargar(seleccionarId) {
    const data = await obtenerJerarquiaBanco()
    setFamilias(data)
    if (seleccionarId) {
      const duena = data.find((item) => item.detalle?.some((libroItem) => libroItem.id === seleccionarId))
      if (duena) setFamiliaCodigo(duena.codigo)
      setLibroId(seleccionarId)
      setMarca((valor) => valor + 1)
    }
  }

  async function cambiarActivo(item, activo) {
    const data = await actualizarLibroAdmin(item.id, {
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion ?? '',
      familia: familia.codigo,
      activo,
      carrera_ids: (item.carreras ?? []).map((carrera) => carrera.id),
    })
    setFamilias((lista) => lista.map((familiaItem) => (
      familiaItem.codigo !== familia.codigo
        ? familiaItem
        : {
            ...familiaItem,
            detalle: familiaItem.detalle.map((libroItem) => (
              libroItem.id === item.id ? { ...libroItem, activa: data.activa, carreras: data.carreras } : libroItem
            )),
          }
    )))
  }

  return (
    <div className="banco">
      <header className="banco__cabecera">
        <h1>Banco de evaluaciones</h1>
        <p>Familia, libro y preguntas cargadas. Cada libro se rinde completo.</p>
      </header>

      <div className="banco__familias" role="tablist" aria-label="Familias">
        {familias.map((item) => (
          <button
            key={item.codigo}
            type="button"
            role="tab"
            aria-selected={item.codigo === familia?.codigo}
            className={`banco__familia-pill${item.codigo === familia?.codigo ? ' banco__familia-pill--activa' : ''}`}
            onClick={() => elegirFamilia(item.codigo)}
          >
            <span className="banco__familia-nombre">{item.nombre}</span>
            <span className="banco__familia-meta">
              <span>{item.libros} {item.libros === 1 ? 'libro' : 'libros'}</span>
              <span>{item.modo_etiqueta}</span>
            </span>
          </button>
        ))}
      </div>

      {familia && (
        <TiempoFamilia
          item={familia}
          onGuardado={(codigo, segundos) => {
            setFamilias((lista) => lista.map((familiaItem) => (
              familiaItem.codigo === codigo ? { ...familiaItem, tiempo_pregunta_seg: segundos } : familiaItem
            )))
          }}
        />
      )}

      <div className="banco__cuerpo">
        <section className="banco__libros" aria-label="Libros">
          <div className="banco__columna-cabecera">
            <h2>Libros</h2>
            <button type="button" className="boton boton--chico" onClick={() => setFormLibro({ familia: familia.codigo })}>
              + Nuevo libro
            </button>
          </div>
          {familia?.detalle?.length ? (
            <ul>
              {familia.detalle.map((item) => (
                <li key={item.id} className="banco__libro-fila">
                  <button
                    type="button"
                    className={`banco__libro${item.id === libro?.id ? ' banco__libro--activo' : ''}${item.activa === false ? ' banco__libro--inactivo' : ''}`}
                    title={item.codigo}
                    onClick={() => {
                      setCargandoPreguntas(true)
                      setLibroId(item.id)
                    }}
                  >
                    <strong className="banco__libro-nombre">{item.nombre}</strong>
                    <span className="banco__codigo">{item.codigo}</span>
                    <span className="banco__libro-meta">
                      {item.preguntas} preguntas · {item.activa === false ? 'Inactivo' : 'Activo'}
                    </span>
                    {item.carreras?.length > 0 && (
                      <span className="banco__carreras">
                        {item.carreras.map((carrera) => (
                          <em key={carrera.id}>{carrera.nombre}</em>
                        ))}
                      </span>
                    )}
                  </button>
                  <label className="banco__interruptor">
                    <input
                      type="checkbox"
                      checked={item.activa !== false}
                      onChange={(evento) => cambiarActivo(item, evento.target.checked).catch((err) => setError(err))}
                    />
                    <span className="banco__interruptor-pista" aria-hidden="true" />
                    <span>Activo</span>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <Vacio titulo="Esta familia no tiene libros" />
          )}
        </section>

        <section className="banco__inspector" aria-label="Preguntas del libro">
          {libro && (
            <header className="banco__inspector-cabecera">
              <div>
                <span className="banco__badge">{familia.nombre}</span>
                <h2>{libro.nombre}</h2>
                <p>{libro.codigo} · {total} preguntas · {libro.activa === false ? 'Inactivo' : 'Activo'}</p>
              </div>
              <button type="button" className="boton boton--chico" onClick={() => setFormPregunta(preguntaVacia())}>
                + Agregar pregunta
              </button>
            </header>
          )}

          {cargandoPreguntas && <Esqueleto cantidad={4} />}

          {!cargandoPreguntas && libro && preguntas.length === 0 && (
            <Vacio titulo="Este libro todavía no tiene preguntas" />
          )}

          <ol className="banco__preguntas">
            {preguntas.map((pregunta) => (
              <li key={pregunta.id} className="banco__pregunta">
                <div className="banco__pregunta-acciones">
                  <p className="banco__orden">Ítem {pregunta.orden}</p>
                  <button type="button" className="boton boton--chico boton--secundario" onClick={() => setFormPregunta(pregunta)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="boton boton--chico boton--peligro"
                    onClick={() => {
                      if (!window.confirm('¿Eliminar esta pregunta?')) return
                      eliminarPreguntaAdmin(pregunta.id)
                        .then(() => recargar(libro.id))
                        .catch((err) => setError(err))
                    }}
                  >
                    Eliminar
                  </button>
                </div>
                {pregunta.dimension?.etiqueta && (
                  <p className="banco__factor">{pregunta.dimension.etiqueta}</p>
                )}
                <p>{pregunta.enunciado}</p>
                {pregunta.imagen_url && (
                  <img src={pregunta.imagen_url} alt="" className="banco__lamina" />
                )}
                <ul className="banco__opciones">
                  {pregunta.opciones?.map((opcion) => (
                    <li key={opcion.id}>
                      <span><b>{opcion.etiqueta}</b> {opcion.texto}</span>
                      <strong className="banco__puntaje">{Number(opcion.puntaje)}</strong>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {formLibro && (
        <FormularioLibro
          familia={familia}
          carreras={carreras}
          onCerrar={() => setFormLibro(null)}
          onCreado={(data) => {
            setFormLibro(null)
            recargar(data.id).catch((err) => setError(err))
          }}
        />
      )}

      {formPregunta && libro && (
        <FormularioPregunta
          libro={libro}
          familia={familia.codigo}
          dimensiones={dimensiones}
          pregunta={formPregunta.id ? formPregunta : null}
          onCerrar={() => setFormPregunta(null)}
          onGuardado={() => {
            setFormPregunta(null)
            recargar(libro.id).catch((err) => setError(err))
          }}
        />
      )}
    </div>
  )
}

function preguntaVacia() {
  return {
    enunciado: '',
    imagen_archivo_id: null,
    imagen_url: null,
    dimension_id: '',
    opciones: [
      { etiqueta: 'A', texto: '', puntaje: 0 },
      { etiqueta: 'B', texto: '', puntaje: 0 },
    ],
  }
}

function TiempoFamilia({ item, onGuardado }) {
  const [borrador, setBorrador] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState(null)
  const segundos = borrador ?? item.tiempo_pregunta_seg ?? 60

  async function guardar(evento) {
    evento.preventDefault()
    setGuardando(true)
    setAviso(null)
    try {
      const data = await actualizarTiempoFamilia(item.codigo, Number(segundos))
      setBorrador(null)
      onGuardado(item.codigo, data.tiempo_pregunta_seg)
    } catch (err) {
      setAviso(err.message || 'No se pudo guardar el tiempo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="banco__tiempo-bar">
      <p className="banco__tiempo-etiqueta">
        Tiempo por pregunta en <strong>{item.nombre}</strong>
      </p>
      <form className="banco__tiempo" onSubmit={guardar}>
        <label>
          Segundos
          <input
            type="number"
            min="5"
            max="3600"
            value={segundos}
            onChange={(evento) => setBorrador(evento.target.value)}
          />
        </label>
        <button type="submit" className="boton boton--chico" disabled={guardando}>
          {guardando ? '…' : 'Guardar'}
        </button>
      </form>
      {aviso && <small className="banco__tiempo-aviso">{aviso}</small>}
    </div>
  )
}

function FormularioLibro({ familia, carreras, onCerrar, onCreado }) {
  const [nombre, setNombre] = useState('')
  const [codigo, setCodigo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [activo, setActivo] = useState(true)
  const [carreraIds, setCarreraIds] = useState([])
  const [aviso, setAviso] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const especifica = familia.codigo === 'HABILIDAD_ESPECIFICA'

  async function guardar(evento) {
    evento.preventDefault()
    setGuardando(true)
    setAviso(null)
    try {
      const data = await crearLibroAdmin({
        nombre,
        codigo: codigo.trim() || null,
        descripcion,
        familia: familia.codigo,
        activo,
        carrera_ids: especifica ? carreraIds : [],
      })
      onCreado(data)
    } catch (err) {
      setAviso(err.message || 'No se pudo crear el libro.')
      setGuardando(false)
    }
  }

  return (
    <div className="banco__dialogo" role="dialog" aria-modal="true" aria-label="Nuevo libro">
      <form className="banco__dialogo-caja" onSubmit={guardar}>
        <h2>Nuevo libro de {familia.nombre}</h2>
        <label>
          Nombre
          <input value={nombre} onChange={(evento) => setNombre(evento.target.value)} required maxLength={120} />
        </label>
        <label>
          Código
          <input value={codigo} onChange={(evento) => setCodigo(evento.target.value)} placeholder="Se genera si lo dejas vacío" />
        </label>
        <label>
          Descripción
          <textarea value={descripcion} onChange={(evento) => setDescripcion(evento.target.value)} rows={3} />
        </label>
        <label className="banco__interruptor banco__interruptor--fila">
          <input type="checkbox" checked={activo} onChange={(evento) => setActivo(evento.target.checked)} />
          <span className="banco__interruptor-pista" aria-hidden="true" />
          <span>Activo para las próximas postulaciones</span>
        </label>
        {especifica && (
          <fieldset>
            <legend>Carreras</legend>
            {carreras.map((carrera) => (
              <label key={carrera.id}>
                <input
                  type="checkbox"
                  checked={carreraIds.includes(carrera.id)}
                  onChange={(evento) => {
                    setCarreraIds((lista) => (
                      evento.target.checked ? [...lista, carrera.id] : lista.filter((id) => id !== carrera.id)
                    ))
                  }}
                />
                {carrera.nombre}
              </label>
            ))}
          </fieldset>
        )}
        {aviso && <p className="aviso aviso--error">{aviso}</p>}
        <div className="banco__dialogo-acciones">
          <button type="button" className="boton boton--secundario" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="boton" disabled={guardando}>{guardando ? 'Guardando…' : 'Crear libro'}</button>
        </div>
      </form>
    </div>
  )
}

function FormularioPregunta({ libro, familia, dimensiones, pregunta, onCerrar, onGuardado }) {
  const exigeDimension = familia === 'PERSONALIDAD' || familia === 'HABILIDAD_BLANDA'
  const [enunciado, setEnunciado] = useState(pregunta?.enunciado ?? '')
  const [imagenId, setImagenId] = useState(pregunta?.imagen_archivo_id ?? null)
  const [imagenUrl, setImagenUrl] = useState(pregunta?.imagen_url ?? null)
  const [dimensionId, setDimensionId] = useState(pregunta?.dimension_id ? String(pregunta.dimension_id) : '')
  const [opciones, setOpciones] = useState(pregunta?.opciones?.map((opcion) => ({
    id: opcion.id,
    etiqueta: opcion.etiqueta,
    texto: opcion.texto,
    puntaje: Number(opcion.puntaje),
  })) ?? preguntaVacia().opciones)
  const [aviso, setAviso] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const factores = dimensiones.filter((dimension) => dimension.tipo === familia)

  function cambiarOpcion(indice, campo, valor) {
    setOpciones((lista) => lista.map((opcion, i) => (i === indice ? { ...opcion, [campo]: valor } : opcion)))
  }

  function marcarCorrecta(indice) {
    setOpciones((lista) => lista.map((opcion, i) => ({ ...opcion, puntaje: i === indice ? 1 : 0 })))
  }

  async function subir(evento) {
    const archivo = evento.target.files?.[0]
    if (!archivo) return
    setAviso(null)
    try {
      const recorte = archivo.type === 'image/svg+xml' ? archivo : await recortarCuadrado(archivo)
      const subida = await subirImagenPreguntaAdmin(recorte)
      setImagenId(subida.id)
      setImagenUrl(subida.url)
    } catch (err) {
      setAviso(err.message || 'No se pudo subir la imagen.')
    }
  }

  async function guardar(evento) {
    evento.preventDefault()
    setGuardando(true)
    setAviso(null)
    const cuerpo = {
      prueba_id: libro.id,
      enunciado,
      imagen_archivo_id: imagenId,
      dimension_id: dimensionId ? Number(dimensionId) : null,
      opciones: opciones.map((opcion) => ({
        id: opcion.id,
        etiqueta: opcion.etiqueta,
        texto: opcion.texto,
        puntaje: Number(opcion.puntaje),
      })),
    }
    try {
      if (pregunta?.id) await actualizarPreguntaAdmin(pregunta.id, cuerpo)
      else await crearPreguntaAdmin(cuerpo)
      onGuardado()
    } catch (err) {
      setAviso(err.message || 'No se pudo guardar la pregunta.')
      setGuardando(false)
    }
  }

  return (
    <div className="banco__dialogo" role="dialog" aria-modal="true" aria-label="Pregunta">
      <form className="banco__dialogo-caja" onSubmit={guardar}>
        <h2>{pregunta?.id ? `Editar ítem ${pregunta.orden}` : `Nueva pregunta de ${libro.nombre}`}</h2>
        <label>
          Enunciado
          <textarea value={enunciado} onChange={(evento) => setEnunciado(evento.target.value)} rows={4} />
        </label>
        <label>
          Imagen recortada
          <input type="file" accept="image/*" onChange={subir} />
        </label>
        {imagenUrl && <img src={imagenUrl} alt="" className="banco__lamina" />}
        {exigeDimension && (
          <label>
            Factor o dimensión
            <select value={dimensionId} onChange={(evento) => setDimensionId(evento.target.value)} required>
              <option value="">Selecciona</option>
              {factores.map((dimension) => (
                <option key={dimension.id} value={dimension.id}>
                  {dimension.factor ? `Factor ${dimension.factor} — ${dimension.nombre}` : dimension.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
        <fieldset>
          <legend>Opciones</legend>
          {opciones.map((opcion, indice) => (
            <div key={opcion.id ?? indice} className="banco__opcion-editor">
              <input
                value={opcion.etiqueta}
                maxLength={1}
                aria-label="Letra"
                onChange={(evento) => cambiarOpcion(indice, 'etiqueta', evento.target.value.toUpperCase())}
                required
              />
              <input
                value={opcion.texto}
                aria-label="Texto de la opción"
                onChange={(evento) => cambiarOpcion(indice, 'texto', evento.target.value)}
                required
              />
              <input
                type="number"
                min="0"
                max="5"
                step="1"
                aria-label="Puntaje"
                value={opcion.puntaje}
                onChange={(evento) => cambiarOpcion(indice, 'puntaje', evento.target.value)}
                required
              />
              <button type="button" className="boton boton--chico boton--secundario" onClick={() => marcarCorrecta(indice)}>
                Correcta
              </button>
            </div>
          ))}
          {opciones.length < 8 && (
            <button
              type="button"
              className="boton boton--chico boton--secundario"
              onClick={() => setOpciones((lista) => [...lista, { etiqueta: String.fromCharCode(65 + lista.length), texto: '', puntaje: 0 }])}
            >
              Otra opción
            </button>
          )}
        </fieldset>
        {aviso && <p className="aviso aviso--error">{aviso}</p>}
        <div className="banco__dialogo-acciones">
          <button type="button" className="boton boton--secundario" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="boton" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar pregunta'}</button>
        </div>
      </form>
    </div>
  )
}

async function recortarCuadrado(archivo) {
  const bitmap = await createImageBitmap(archivo)
  const lado = Math.min(bitmap.width, bitmap.height)
  const origenX = Math.floor((bitmap.width - lado) / 2)
  const origenY = Math.floor((bitmap.height - lado) / 2)
  const destino = Math.min(lado, 1200)
  const lienzo = document.createElement('canvas')
  lienzo.width = destino
  lienzo.height = destino
  lienzo.getContext('2d').drawImage(bitmap, origenX, origenY, lado, lado, 0, 0, destino, destino)
  const blob = await new Promise((resolver) => lienzo.toBlob(resolver, 'image/png'))
  return new File([blob], 'pregunta.png', { type: 'image/png' })
}
