import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit3,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Search,
  Sliders,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import {
  actualizarConfiguracionPruebaAdmin,
  actualizarPreguntaAdmin,
  crearPreguntaAdmin,
  eliminarPreguntaAdmin,
  obtenerCatalogoPruebasAdmin,
  obtenerPreguntasAdmin,
  subirImagenPreguntaAdmin,
} from '../../api/admin.js'
import Campo from '../../componentes/Campo.jsx'
import { ErrorCarga, Esqueleto } from '../../componentes/Estado.jsx'

// Plantillas preconfiguradas para creación ágil de opciones
const PLANTILLAS = {
  likert5: {
    nombre: 'Escala Likert (1 a 5)',
    icono: '⭐',
    descripcion: 'Para Inteligencia Emocional y Habilidades Blandas',
    opciones: [
      { etiqueta: '1', texto: 'Totalmente en desacuerdo', puntaje: '1' },
      { etiqueta: '2', texto: 'En desacuerdo', puntaje: '2' },
      { etiqueta: '3', texto: 'Neutro / Ocasionalmente', puntaje: '3' },
      { etiqueta: '4', texto: 'De acuerdo', puntaje: '4' },
      { etiqueta: '5', texto: 'Totalmente de acuerdo', puntaje: '5' },
    ],
  },
  cattell3: {
    nombre: '16PF Cattell (3 Opciones)',
    icono: '🎭',
    descripcion: 'Formato estándar de Personalidad (A / B / C)',
    opciones: [
      { etiqueta: 'A', texto: 'Verdadero / En desacuerdo', puntaje: '2' },
      { etiqueta: 'B', texto: 'En duda / Término medio', puntaje: '1' },
      { etiqueta: 'C', texto: 'Falso / De acuerdo', puntaje: '0' },
    ],
  },
  multiple4: {
    nombre: 'Opción Múltiple (A, B, C, D)',
    icono: '🔘',
    descripcion: 'Pruebas de razonamiento con 1 respuesta correcta',
    opciones: [
      { etiqueta: 'A', texto: 'Primera alternativa', puntaje: '0' },
      { etiqueta: 'B', texto: 'Segunda alternativa (Correcta)', puntaje: '1' },
      { etiqueta: 'C', texto: 'Tercera alternativa', puntaje: '0' },
      { etiqueta: 'D', texto: 'Cuarta alternativa', puntaje: '0' },
    ],
  },
  verdaderoFalso: {
    nombre: 'Verdadero / Falso',
    icono: '✅',
    descripcion: 'Evaluación binaria de afirmación o negación',
    opciones: [
      { etiqueta: 'V', texto: 'Verdadero', puntaje: '1' },
      { etiqueta: 'F', texto: 'Falso', puntaje: '0' },
    ],
  },
}

const FORMULARIO_INICIAL = {
  id: null,
  prueba_id: '',
  dimension_id: '',
  orden: '',
  enunciado: '',
  imagen_archivo_id: null,
  imagen_url: null,
  opciones: [
    { etiqueta: 'A', texto: '', puntaje: '1' },
    { etiqueta: 'B', texto: '', puntaje: '0' },
  ],
}

function sugerirSiguienteEtiqueta(opciones) {
  if (!opciones || opciones.length === 0) return 'A'
  const ult = opciones[opciones.length - 1]?.etiqueta?.trim()?.toUpperCase() || ''
  if (/^[A-Z]$/.test(ult)) {
    const code = ult.charCodeAt(0)
    return code < 90 ? String.fromCharCode(code + 1) : 'Z'
  }
  if (/^\d+$/.test(ult)) {
    return String(parseInt(ult, 10) + 1)
  }
  return String.fromCharCode(65 + Math.min(opciones.length, 25))
}

export default function Preguntas() {
  const [catalogo, setCatalogo] = useState({ pruebas: [], dimensiones: [], resumen: {} })
  const [preguntas, setPreguntas] = useState([])
  const [metaPaginacion, setMetaPaginacion] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
  })

  const [cargandoInicial, setCargandoInicial] = useState(true)
  const [cargandoPreguntas, setCargandoPreguntas] = useState(false)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)

  // Prueba activa (al entrar, se selecciona exclusivamente esta prueba)
  const [pruebaActivaId, setPruebaActivaId] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const [porPagina, setPorPagina] = useState(10)

  // Estado del modal (crear / editar)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [form, setForm] = useState(FORMULARIO_INICIAL)
  const [erroresForm, setErroresForm] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [subiendoImagen, setSubiendoImagen] = useState(false)
  const [eliminandoId, setEliminandoId] = useState(null)

  // Configuración de muestreo / examen aleatorio de la prueba
  const [mostrarModalConfig, setMostrarModalConfig] = useState(false)
  const [formConfig, setFormConfig] = useState({ limite_preguntas: '' })
  const [guardandoConfig, setGuardandoConfig] = useState(false)

  // Carga inicial: Catálogo y selección de la primera prueba
  useEffect(() => {
    async function inicializar() {
      setCargandoInicial(true)
      setError(null)
      try {
        const cat = await obtenerCatalogoPruebasAdmin()
        setCatalogo(cat)

        // Seleccionar por defecto la primera prueba nuclear (ej. TEST_PERSONALIDAD)
        const primerPrueba = cat.pruebas?.[0]
        if (primerPrueba) {
          setPruebaActivaId(primerPrueba.id)
          const res = await obtenerPreguntasAdmin({
            prueba_id: primerPrueba.id,
            page: 1,
            per_page: 10,
          })
          setPreguntas(res.data || [])
          if (res.meta) setMetaPaginacion(res.meta)
        }
      } catch (err) {
        setError(err.message || 'Error al conectar con el servidor.')
      } finally {
        setCargandoInicial(false)
      }
    }
    inicializar()
  }, [])

  // Cargar preguntas cuando cambie la prueba activa, página, cantidad por página o búsqueda
  async function cargarPreguntas(pId, pag = 1, cant = porPagina, query = busqueda) {
    if (!pId) return
    setCargandoPreguntas(true)
    try {
      const params = {
        prueba_id: pId,
        page: pag,
        per_page: cant,
      }
      if (query.trim()) params.q = query.trim()

      const res = await obtenerPreguntasAdmin(params)
      setPreguntas(res.data || [])
      if (res.meta) setMetaPaginacion(res.meta)

      // Actualizar contadores del catálogo en segundo plano
      const cat = await obtenerCatalogoPruebasAdmin()
      setCatalogo(cat)
    } catch (err) {
      setAviso({ tipo: 'error', mensaje: err.message || 'Error al cargar las preguntas.' })
    } finally {
      setCargandoPreguntas(false)
    }
  }

  // Cambio de prueba activa
  function cambiarPrueba(idPrueba) {
    setPruebaActivaId(idPrueba)
    setPaginaActual(1)
    setBusqueda('')
    cargarPreguntas(idPrueba, 1, porPagina, '')
  }

  // Cambio de página
  function cambiarPagina(nuevaPagina) {
    if (nuevaPagina < 1 || nuevaPagina > metaPaginacion.last_page) return
    setPaginaActual(nuevaPagina)
    cargarPreguntas(pruebaActivaId, nuevaPagina, porPagina, busqueda)
    window.scrollTo({ top: 120, behavior: 'smooth' })
  }

  // Separar las 4 pruebas principales de las pruebas secundarias
  const { pruebasPrincipales, otrasPruebas } = useMemo(() => {
    const principales = []
    const otras = []
    catalogo.pruebas.forEach((p) => {
      if (p.es_nuclear) {
        principales.push(p)
      } else {
        otras.push(p)
      }
    })
    return { pruebasPrincipales: principales, otrasPruebas: otras }
  }, [catalogo.pruebas])

  const pruebaSeleccionada = useMemo(() => {
    return catalogo.pruebas.find((p) => p.id === pruebaActivaId) || null
  }, [catalogo.pruebas, pruebaActivaId])

  // Abrir modal de creación
  function abrirCrear() {
    setModoModal('crear')
    setErroresForm({})
    setForm({
      ...FORMULARIO_INICIAL,
      prueba_id: pruebaActivaId ? String(pruebaActivaId) : (catalogo.pruebas[0]?.id?.toString() || ''),
      opciones: [
        { etiqueta: 'A', texto: '', puntaje: '1' },
        { etiqueta: 'B', texto: '', puntaje: '0' },
      ],
    })
    setMostrarModal(true)
  }

  // Abrir modal de edición
  function abrirEditar(pregunta) {
    setModoModal('editar')
    setErroresForm({})
    setForm({
      id: pregunta.id,
      prueba_id: String(pregunta.prueba_id),
      dimension_id: pregunta.dimension_id ? String(pregunta.dimension_id) : '',
      orden: pregunta.orden ? String(pregunta.orden) : '',
      enunciado: pregunta.enunciado || '',
      imagen_archivo_id: pregunta.imagen_archivo_id || null,
      imagen_url: pregunta.imagen_url || null,
      opciones: pregunta.opciones.map((o) => ({
        id: o.id,
        etiqueta: o.etiqueta,
        texto: o.texto,
        puntaje: String(o.puntaje),
      })),
      tiene_respuestas: pregunta.tiene_respuestas,
    })
    setMostrarModal(true)
  }

  // Abrir modal de configuración de muestreo de la prueba
  function abrirConfiguracion() {
    setFormConfig({
      limite_preguntas: pruebaSeleccionada?.limite_preguntas ? String(pruebaSeleccionada.limite_preguntas) : '',
    })
    setMostrarModalConfig(true)
  }

  // Guardar configuración de muestreo aleatorio
  async function manejarGuardarConfig(e) {
    e.preventDefault()
    setGuardandoConfig(true)
    try {
      const limite = formConfig.limite_preguntas ? parseInt(formConfig.limite_preguntas, 10) : null
      await actualizarConfiguracionPruebaAdmin(pruebaActivaId, { limite_preguntas: limite })

      const cat = await obtenerCatalogoPruebasAdmin()
      setCatalogo(cat)
      setMostrarModalConfig(false)
      setAviso({
        tipo: 'exito',
        mensaje: limite
          ? `Configuración guardada: cada postulante responderá una muestra de ${limite} preguntas aleatorias.`
          : 'Configuración guardada: cada postulante responderá todas las preguntas del banco.',
      })
    } catch (err) {
      setAviso({ tipo: 'error', mensaje: err.message || 'Error al guardar la configuración de muestreo.' })
    } finally {
      setGuardandoConfig(false)
    }
  }

  // Duplicar pregunta
  function duplicarPregunta(pregunta) {
    setModoModal('crear')
    setErroresForm({})
    setForm({
      id: null,
      prueba_id: String(pregunta.prueba_id),
      dimension_id: pregunta.dimension_id ? String(pregunta.dimension_id) : '',
      orden: '',
      enunciado: pregunta.enunciado ? `${pregunta.enunciado} (Copia)` : '',
      imagen_archivo_id: pregunta.imagen_archivo_id || null,
      imagen_url: pregunta.imagen_url || null,
      opciones: pregunta.opciones.map((o) => ({
        etiqueta: o.etiqueta,
        texto: o.texto,
        puntaje: String(o.puntaje),
      })),
    })
    setMostrarModal(true)
    setAviso({
      tipo: 'exito',
      mensaje: `Pregunta duplicada en el formulario. Puedes editar el enunciado o la imagen y guardarla.`,
    })
  }

  // Subir imagen para la pregunta
  async function manejarSubirImagen(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setSubiendoImagen(true)
    setErroresForm((prev) => ({ ...prev, imagen: undefined }))
    try {
      const archivoCreado = await subirImagenPreguntaAdmin(file)
      setForm((prev) => ({
        ...prev,
        imagen_archivo_id: archivoCreado.id,
        imagen_url: archivoCreado.url,
      }))
    } catch (err) {
      setErroresForm((prev) => ({ ...prev, imagen: [err.message || 'Error al subir la imagen.'] }))
    } finally {
      setSubiendoImagen(false)
      // Limpiar input para permitir seleccionar la misma imagen si se desea
      e.target.value = ''
    }
  }

  // Quitar imagen
  function quitarImagen() {
    setForm((prev) => ({
      ...prev,
      imagen_archivo_id: null,
      imagen_url: null,
    }))
  }

  // Aplicar plantilla rápida de opciones
  function aplicarPlantilla(clave) {
    const plantilla = PLANTILLAS[clave]
    if (!plantilla) return
    setForm((prev) => ({
      ...prev,
      opciones: plantilla.opciones.map((o) => ({ ...o })),
    }))
  }

  // Marcar una opción como única correcta
  function marcarComoUnicaCorrecta(indexSeleccionado) {
    setForm((prev) => ({
      ...prev,
      opciones: prev.opciones.map((opt, idx) => ({
        ...opt,
        puntaje: idx === indexSeleccionado ? '1' : '0',
      })),
    }))
  }

  function agregarOpcion() {
    if (form.opciones.length >= 10) return
    const sigEtiqueta = sugerirSiguienteEtiqueta(form.opciones)
    setForm((prev) => ({
      ...prev,
      opciones: [...prev.opciones, { etiqueta: sigEtiqueta, texto: '', puntaje: '0' }],
    }))
  }

  function eliminarOpcion(idx) {
    if (form.opciones.length <= 2) {
      alert('La pregunta debe tener al menos 2 opciones de respuesta.')
      return
    }
    setForm((prev) => ({
      ...prev,
      opciones: prev.opciones.filter((_, i) => i !== idx),
    }))
  }

  function actualizarOpcion(idx, campo, valor) {
    setForm((prev) => {
      const nuevas = [...prev.opciones]
      nuevas[idx] = { ...nuevas[idx], [campo]: valor }
      return { ...prev, opciones: nuevas }
    })
  }

  // Guardar pregunta
  async function manejarGuardar(e) {
    e.preventDefault()
    setGuardando(true)
    setErroresForm({})
    setAviso(null)

    if (!form.enunciado.trim() && !form.imagen_archivo_id) {
      setErroresForm({ enunciado: ['Debes ingresar al menos un enunciado escrito o subir una imagen ilustrativa.'] })
      setGuardando(false)
      return
    }

    if (form.opciones.length < 2) {
      setErroresForm({ opciones: ['Se requieren al menos 2 opciones de respuesta.'] })
      setGuardando(false)
      return
    }

    for (let i = 0; i < form.opciones.length; i++) {
      if (!form.opciones[i].texto.trim()) {
        setErroresForm({ [`opciones.${i}.texto`]: ['El texto de la opción no puede estar vacío.'] })
        setGuardando(false)
        return
      }
    }

    const payload = {
      prueba_id: parseInt(form.prueba_id, 10),
      dimension_id: form.dimension_id ? parseInt(form.dimension_id, 10) : null,
      orden: form.orden ? parseInt(form.orden, 10) : null,
      enunciado: form.enunciado.trim() || null,
      imagen_archivo_id: form.imagen_archivo_id || null,
      opciones: form.opciones.map((o) => ({
        id: o.id || undefined,
        etiqueta: o.etiqueta.trim().toUpperCase(),
        texto: o.texto.trim(),
        puntaje: parseFloat(o.puntaje) || 0,
      })),
    }

    try {
      if (modoModal === 'crear') {
        await crearPreguntaAdmin(payload)
        setAviso({ tipo: 'exito', mensaje: 'Pregunta agregada con éxito al banco.' })
      } else {
        await actualizarPreguntaAdmin(form.id, payload)
        setAviso({ tipo: 'exito', mensaje: 'Pregunta actualizada exitosamente.' })
      }

      setMostrarModal(false)
      await cargarPreguntas(pruebaActivaId, paginaActual, porPagina, busqueda)
    } catch (err) {
      if (err.errors) {
        setErroresForm(err.errors)
      } else {
        setAviso({ tipo: 'error', mensaje: err.message || 'Error al guardar la pregunta.' })
      }
    } finally {
      setGuardando(false)
    }
  }

  // Eliminar pregunta
  async function manejarEliminar(pregunta) {
    if (pregunta.tiene_respuestas) {
      alert('Esta pregunta no puede ser eliminada porque ya ha sido respondida en evaluaciones previas.')
      return
    }

    const confirmar = window.confirm(
      `¿Deseas eliminar permanentemente la Pregunta #${pregunta.orden}?\nEsta acción es irreversible.`
    )
    if (!confirmar) return

    setEliminandoId(pregunta.id)
    try {
      const res = await eliminarPreguntaAdmin(pregunta.id)
      setAviso({ tipo: 'exito', mensaje: res.message || 'Pregunta eliminada exitosamente.' })
      await cargarPreguntas(pruebaActivaId, paginaActual, porPagina, busqueda)
    } catch (err) {
      setAviso({ tipo: 'error', mensaje: err.message || 'No fue posible eliminar la pregunta.' })
    } finally {
      setEliminandoId(null)
    }
  }

  if (cargandoInicial) {
    return <Esqueleto cantidad={4} />
  }

  if (error) {
    return <ErrorCarga mensaje={error} reintentar={() => window.location.reload()} />
  }

  return (
    <div>
      {/* 1. Cabecera Limpia */}
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <h1 className="titulo-pagina" style={{ margin: '0 0 0.2rem' }}>
            Banco de Preguntas
          </h1>
          <p style={{ margin: 0, color: 'var(--texto-suave)', fontSize: '0.9rem' }}>
            Gestiona los reactivos y opciones organizados por prueba psicométrica.
          </p>
        </div>

        <button type="button" className="boton boton--primario" onClick={abrirCrear}>
          <Plus size={16} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />
          Nueva Pregunta
        </button>
      </header>

      {/* Aviso */}
      {aviso && (
        <div className={`aviso aviso--${aviso.tipo}`} role="alert" style={{ marginBottom: '1rem' }}>
          <p>{aviso.mensaje}</p>
        </div>
      )}

      {/* 2. Pestañas Limpias para los 4 Tests Principales (+ Selector para Otros) */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.5rem',
          borderBottom: '2px solid var(--borde)',
          paddingBottom: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        {pruebasPrincipales.map((p) => {
          const estaActiva = p.id === pruebaActivaId
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => cambiarPrueba(p.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: estaActiva ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                background: estaActiva ? 'var(--primario)' : 'var(--superficie)',
                color: estaActiva ? '#fff' : 'var(--texto)',
                boxShadow: estaActiva ? '0 2px 6px rgba(0,0,0,0.12)' : 'none',
                transition: 'all 0.15s ease-in-out',
              }}
            >
              <span>{p.nombre}</span>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '12px',
                  background: estaActiva ? 'rgba(255,255,255,0.25)' : 'var(--superficie-suave)',
                  color: estaActiva ? '#fff' : 'var(--texto-suave)',
                }}
              >
                {p.preguntas_count}
              </span>
            </button>
          )
        })}

        {/* Menú para pruebas técnicas adicionales si existen */}
        {otrasPruebas.length > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--texto-suave)' }}>Otras pruebas:</span>
            <select
              className="campo__control"
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', width: 'auto' }}
              value={otrasPruebas.some((o) => o.id === pruebaActivaId) ? pruebaActivaId : ''}
              onChange={(e) => {
                if (e.target.value) cambiarPrueba(parseInt(e.target.value, 10))
              }}
            >
              <option value="" disabled>
                -- Seleccionar otra prueba --
              </option>
              {otrasPruebas.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.nombre} ({op.preguntas_count} preguntas)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 3. Barra de Control: Conteo de la prueba, Búsqueda y Paginación */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginBottom: '1rem',
          background: 'var(--superficie)',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          border: '1px solid var(--borde)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--texto)' }}>
            <strong>{pruebaSeleccionada?.nombre}</strong>
            <span style={{ color: 'var(--texto-suave)', marginLeft: '0.4rem' }}>
              ({metaPaginacion.total} en el banco)
            </span>
          </span>

          <span
            style={{
              fontSize: '0.78rem',
              padding: '0.2rem 0.55rem',
              borderRadius: '999px',
              background: pruebaSeleccionada?.limite_preguntas ? 'var(--destacado-suave)' : 'var(--superficie-suave)',
              color: pruebaSeleccionada?.limite_preguntas ? 'var(--destacado)' : 'var(--texto-suave)',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
            title="Cantidad de preguntas aleatorias que responderá cada estudiante"
          >
            🎲 Examen: {pruebaSeleccionada?.limite_preguntas ? `${pruebaSeleccionada.limite_preguntas} aleatorias` : 'Todas las del banco'}
          </span>

          <button
            type="button"
            className="boton boton--secundario boton--chico"
            onClick={abrirConfiguracion}
            style={{ fontSize: '0.78rem', padding: '0.2rem 0.55rem' }}
            title="Configurar cuántas preguntas aleatorias responderá el postulante"
          >
            <Sliders size={13} style={{ marginRight: '0.25rem' }} />
            Configurar Muestreo
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Buscador */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '0.65rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--texto-suave)',
              }}
            />
            <input
              type="text"
              className="campo__control"
              style={{ padding: '0.35rem 0.5rem 0.35rem 2rem', fontSize: '0.85rem' }}
              placeholder="Buscar pregunta..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setPaginaActual(1)
                cargarPreguntas(pruebaActivaId, 1, porPagina, e.target.value)
              }}
            />
          </div>

          {/* Por página */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--texto-suave)' }}>Por pág:</span>
            <select
              className="campo__control"
              style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem', width: 'auto' }}
              value={porPagina}
              onChange={(e) => {
                const nuevaCant = parseInt(e.target.value, 10)
                setPorPagina(nuevaCant)
                setPaginaActual(1)
                cargarPreguntas(pruebaActivaId, 1, nuevaCant, busqueda)
              }}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>

          <button
            type="button"
            className="boton boton--secundario boton--chico"
            onClick={() => cargarPreguntas(pruebaActivaId, paginaActual, porPagina, busqueda)}
            title="Recargar"
          >
            <RefreshCw size={14} className={cargandoPreguntas ? 'animacion-rotar' : ''} />
          </button>
        </div>
      </div>

      {/* 4. Lista Paginada de Preguntas */}
      {cargandoPreguntas ? (
        <Esqueleto cantidad={3} />
      ) : preguntas.length === 0 ? (
        <div className="tarjeta" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.5rem' }}>
            Esta prueba no tiene preguntas registradas
          </p>
          <p style={{ color: 'var(--texto-suave)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            {busqueda
              ? 'No hay resultados que coincidan con la búsqueda.'
              : 'Empieza agregando la primera pregunta para esta evaluación psicométrica.'}
          </p>
          <button type="button" className="boton boton--primario" onClick={abrirCrear}>
            <Plus size={16} style={{ marginRight: '0.35rem' }} />
            Crear Pregunta
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.85rem' }}>
          {preguntas.map((preg) => (
            <article
              key={preg.id}
              className="tarjeta"
              style={{
                padding: '1.1rem',
                borderLeft: '4px solid var(--primario)',
                background: 'var(--superficie)',
              }}
            >
              {/* Encabezado del ítem */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  marginBottom: '0.65rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      background: 'var(--superficie-suave)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                    }}
                  >
                    #{preg.orden}
                  </span>

                  {preg.dimension && (
                    <span
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: 'var(--primario-suave)',
                        color: 'var(--primario)',
                      }}
                    >
                      {preg.dimension.codigo}: {preg.dimension.nombre}
                    </span>
                  )}

                  {preg.tiene_respuestas && (
                    <span
                      className="insignia insignia--advertencia"
                      style={{ fontSize: '0.72rem' }}
                      title="Pregunta respondida por postulantes"
                    >
                      🔒 Respondida ({preg.respuestas_count})
                    </span>
                  )}
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    type="button"
                    className="boton boton--secundario boton--chico"
                    onClick={() => duplicarPregunta(preg)}
                    title="Clonar como nueva"
                  >
                    <Copy size={13} style={{ marginRight: '0.2rem' }} />
                    Duplicar
                  </button>

                  <button
                    type="button"
                    className="boton boton--secundario boton--chico"
                    onClick={() => abrirEditar(preg)}
                    title="Editar pregunta"
                  >
                    <Edit3 size={13} style={{ marginRight: '0.2rem' }} />
                    Editar
                  </button>

                  <button
                    type="button"
                    className="boton boton--peligro boton--chico"
                    onClick={() => manejarEliminar(preg)}
                    disabled={preg.tiene_respuestas || eliminandoId === preg.id}
                    title={preg.tiene_respuestas ? 'No eliminable (con respuestas)' : 'Eliminar'}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Si incluye lámina o imagen gráfica */}
              {preg.imagen_url && (
                <div
                  style={{
                    marginBottom: '0.85rem',
                    padding: '0.5rem',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid var(--borde)',
                    textAlign: 'center',
                  }}
                >
                  <img
                    src={preg.imagen_url}
                    alt={`Lámina Pregunta #${preg.orden}`}
                    style={{
                      maxHeight: '180px',
                      maxWidth: '100%',
                      objectFit: 'contain',
                      borderRadius: '4px',
                      display: 'inline-block',
                    }}
                  />
                </div>
              )}

              {/* Enunciado */}
              {preg.enunciado && (
                <p
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    margin: '0 0 0.85rem',
                    color: 'var(--texto)',
                    lineHeight: 1.4,
                  }}
                >
                  {preg.enunciado}
                </p>
              )}

              {/* Opciones de respuesta */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '0.45rem',
                }}
              >
                {preg.opciones?.map((opc) => {
                  const tienePuntaje = opc.puntaje > 0
                  return (
                    <div
                      key={opc.id || opc.etiqueta}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.4rem 0.65rem',
                        borderRadius: '6px',
                        background: tienePuntaje ? 'var(--superficie-suave)' : 'transparent',
                        border: '1px solid var(--borde)',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                        <span
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            flexShrink: 0,
                            background: tienePuntaje ? 'var(--primario)' : 'var(--borde)',
                            color: tienePuntaje ? '#fff' : 'var(--texto-suave)',
                          }}
                        >
                          {opc.etiqueta}
                        </span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {opc.texto}
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                          background: tienePuntaje ? 'var(--exito-suave)' : 'transparent',
                          color: tienePuntaje ? 'var(--exito)' : 'var(--texto-suave)',
                        }}
                      >
                        {opc.puntaje > 0 ? `+${opc.puntaje} pt` : '0 pt'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 5. Controles de Paginación */}
      {metaPaginacion.total > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginTop: '1.25rem',
            padding: '0.75rem 1rem',
            background: 'var(--superficie)',
            borderRadius: '8px',
            border: '1px solid var(--borde)',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: 'var(--texto-suave)' }}>
            Mostrando preguntas <strong>{metaPaginacion.from}</strong> a <strong>{metaPaginacion.to}</strong> de{' '}
            <strong>{metaPaginacion.total}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              type="button"
              className="boton boton--secundario boton--chico"
              onClick={() => cambiarPagina(metaPaginacion.current_page - 1)}
              disabled={metaPaginacion.current_page <= 1}
            >
              <ChevronLeft size={16} />
              <span>Anterior</span>
            </button>

            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                padding: '0 0.5rem',
                color: 'var(--texto)',
              }}
            >
              Página {metaPaginacion.current_page} de {metaPaginacion.last_page}
            </span>

            <button
              type="button"
              className="boton boton--secundario boton--chico"
              onClick={() => cambiarPagina(metaPaginacion.current_page + 1)}
              disabled={metaPaginacion.current_page >= metaPaginacion.last_page}
            >
              <span>Siguiente</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CREAR / EDITAR PREGUNTA (CON SOPORTE DE IMÁGENES)                  */}
      {/* ========================================================================= */}
      {mostrarModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1000,
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            className="tarjeta"
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '1.5rem',
              borderRadius: '14px',
            }}
          >
            {/* Cabecera Modal */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                borderBottom: '1px solid var(--borde)',
                paddingBottom: '0.75rem',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
                  {modoModal === 'crear' ? 'Nueva Pregunta' : `Editar Pregunta #${form.orden}`}
                </h2>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--texto-suave)' }}>
                  {pruebaSeleccionada?.nombre}
                </p>
              </div>
              <button
                type="button"
                className="boton boton--secundario boton--chico"
                onClick={() => setMostrarModal(false)}
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={manejarGuardar}>
              {/* Prueba & Dimensión */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                  marginBottom: '0.85rem',
                }}
              >
                <Campo etiqueta="Prueba *" error={erroresForm.prueba_id?.[0]}>
                  <select
                    required
                    className="campo__control"
                    value={form.prueba_id}
                    disabled={modoModal === 'editar'}
                    onChange={(e) => setForm({ ...form, prueba_id: e.target.value })}
                  >
                    {catalogo.pruebas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </Campo>

                <Campo etiqueta="Dimensión / Factor Evaluado" error={erroresForm.dimension_id?.[0]}>
                  <select
                    className="campo__control"
                    value={form.dimension_id}
                    onChange={(e) => setForm({ ...form, dimension_id: e.target.value })}
                  >
                    <option value="">-- Sin Dimensión Específica --</option>
                    {catalogo.dimensiones.map((d) => (
                      <option key={d.id} value={d.id}>
                        [{d.tipo}] {d.codigo} - {d.nombre}
                      </option>
                    ))}
                  </select>
                </Campo>
              </div>

              {/* Orden & Enunciado */}
              <div style={{ marginBottom: '0.85rem' }}>
                <Campo
                  etiqueta="Número de Orden (Opcional)"
                  error={erroresForm.orden?.[0]}
                  ayuda="Déjalo vacío para asignarlo correlativamente al final de la prueba."
                >
                  <input
                    type="number"
                    min="1"
                    className="campo__control"
                    placeholder="Automático si está vacío"
                    value={form.orden}
                    onChange={(e) => setForm({ ...form, orden: e.target.value })}
                  />
                </Campo>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <Campo etiqueta="Enunciado de la Pregunta" error={erroresForm.enunciado?.[0]}>
                  <textarea
                    rows="3"
                    className="campo__control"
                    placeholder="Escribe la pregunta o afirmación reactiva..."
                    value={form.enunciado}
                    onChange={(e) => setForm({ ...form, enunciado: e.target.value })}
                  />
                </Campo>
              </div>

              {/* SUBIDA DE IMAGEN / LÁMINA GRÁFICA */}
              <div
                style={{
                  background: 'var(--superficie-suave)',
                  border: '1px dashed var(--borde)',
                  borderRadius: '10px',
                  padding: '0.85rem',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                  }}
                >
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <ImageIcon size={15} style={{ color: 'var(--primario)' }} />
                    Lámina o Imagen Gráfica (Opcional)
                  </label>
                  {form.imagen_url && (
                    <button
                      type="button"
                      className="boton boton--peligro boton--chico"
                      onClick={quitarImagen}
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                    >
                      <Trash2 size={12} style={{ marginRight: '0.2rem' }} />
                      Quitar Imagen
                    </button>
                  )}
                </div>

                {form.imagen_url ? (
                  <div style={{ textAlign: 'center', padding: '0.5rem', background: '#fff', borderRadius: '6px' }}>
                    <img
                      src={form.imagen_url}
                      alt="Vista previa de la lámina"
                      style={{
                        maxHeight: '140px',
                        maxWidth: '100%',
                        objectFit: 'contain',
                        borderRadius: '4px',
                      }}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--texto-suave)', marginTop: '0.3rem' }}>
                      Imagen vinculada correctamente a la pregunta
                    </div>
                  </div>
                ) : (
                  <div>
                    <label
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        padding: '1rem',
                        cursor: subiendoImagen ? 'wait' : 'pointer',
                        borderRadius: '6px',
                        background: '#fff',
                        border: '1px solid var(--borde)',
                        color: 'var(--texto-suave)',
                        fontSize: '0.85rem',
                      }}
                    >
                      <UploadCloud size={24} style={{ color: 'var(--primario)' }} />
                      <span>{subiendoImagen ? 'Subiendo imagen...' : 'Haz clic para seleccionar o subir imagen'}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--texto-suave)' }}>
                        Formatos: PNG, JPG, WEBP (Máx. 5MB)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        disabled={subiendoImagen}
                        onChange={manejarSubirImagen}
                      />
                    </label>
                    {erroresForm.imagen && (
                      <p style={{ color: 'var(--error)', fontSize: '0.75rem', margin: '0.3rem 0 0' }}>
                        {erroresForm.imagen[0]}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Plantillas Rápidas */}
              <div
                style={{
                  background: 'var(--superficie-suave)',
                  border: '1px solid var(--borde)',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    marginBottom: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  <Sparkles size={14} style={{ color: 'var(--primario)' }} />
                  <span>Plantillas Rápidas de Opciones:</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {Object.entries(PLANTILLAS).map(([clave, plant]) => (
                    <button
                      key={clave}
                      type="button"
                      className="boton boton--secundario boton--chico"
                      style={{ fontSize: '0.78rem', padding: '0.25rem 0.55rem' }}
                      onClick={() => aplicarPlantilla(clave)}
                    >
                      <span style={{ marginRight: '0.25rem' }}>{plant.icono}</span>
                      {plant.nombre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opciones de Respuesta */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    Opciones de Respuesta ({form.opciones.length} alternativas)
                  </label>
                  <button
                    type="button"
                    className="boton boton--secundario boton--chico"
                    onClick={agregarOpcion}
                    disabled={form.opciones.length >= 10}
                    style={{ fontSize: '0.75rem' }}
                  >
                    <Plus size={13} style={{ marginRight: '0.2rem' }} />
                    Agregar Opción
                  </button>
                </div>

                <div style={{ display: 'grid', gap: '0.45rem' }}>
                  {form.opciones.map((opc, idx) => (
                    <div
                      key={opc.id || idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '50px 1fr 90px auto auto',
                        gap: '0.4rem',
                        alignItems: 'center',
                        background: 'var(--superficie)',
                        border: '1px solid var(--borde)',
                        padding: '0.4rem 0.6rem',
                        borderRadius: '6px',
                      }}
                    >
                      <input
                        type="text"
                        maxLength="1"
                        className="campo__control"
                        style={{ textAlign: 'center', fontWeight: 700, padding: '0.35rem 0.2rem' }}
                        value={opc.etiqueta}
                        onChange={(e) => actualizarOpcion(idx, 'etiqueta', e.target.value.toUpperCase())}
                      />

                      <input
                        type="text"
                        required
                        className="campo__control"
                        placeholder={`Texto opción ${opc.etiqueta}...`}
                        style={{ padding: '0.35rem 0.5rem' }}
                        value={opc.texto}
                        onChange={(e) => actualizarOpcion(idx, 'texto', e.target.value)}
                      />

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          className="campo__control"
                          style={{ textAlign: 'right', padding: '0.35rem 0.3rem' }}
                          value={opc.puntaje}
                          onChange={(e) => actualizarOpcion(idx, 'puntaje', e.target.value)}
                        />
                        <span style={{ fontSize: '0.7rem', color: 'var(--texto-suave)' }}>pts</span>
                      </div>

                      <button
                        type="button"
                        className="boton boton--secundario boton--chico"
                        onClick={() => marcarComoUnicaCorrecta(idx)}
                        title="Marcar como la opción correcta (1 pt)"
                        style={{
                          padding: '0.3rem 0.45rem',
                          background: parseFloat(opc.puntaje) > 0 ? 'var(--exito-suave)' : 'transparent',
                          color: parseFloat(opc.puntaje) > 0 ? 'var(--exito)' : 'inherit',
                        }}
                      >
                        <CheckCircle2 size={13} />
                      </button>

                      <button
                        type="button"
                        className="boton boton--peligro boton--chico"
                        style={{ padding: '0.3rem 0.45rem' }}
                        onClick={() => eliminarOpcion(idx)}
                        disabled={form.opciones.length <= 2}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones Pie */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.65rem',
                  borderTop: '1px solid var(--borde)',
                  paddingTop: '1rem',
                }}
              >
                <button
                  type="button"
                  className="boton boton--secundario"
                  onClick={() => setMostrarModal(false)}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button type="submit" className="boton boton--primario" disabled={guardando}>
                  {guardando ? 'Guardando...' : modoModal === 'crear' ? 'Guardar Pregunta' : 'Actualizar Pregunta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CONFIGURACIÓN DE MUESTREO ALEATORIO (ENFOQUE B)                   */}
      {/* ========================================================================= */}
      {mostrarModalConfig && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1000,
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            className="tarjeta"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '1.5rem',
              borderRadius: '14px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                borderBottom: '1px solid var(--borde)',
                paddingBottom: '0.75rem',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.15rem', margin: 0 }}>
                  Configuración de Examen
                </h2>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--texto-suave)' }}>
                  {pruebaSeleccionada?.nombre}
                </p>
              </div>
              <button
                type="button"
                className="boton boton--secundario boton--chico"
                onClick={() => setMostrarModalConfig(false)}
                aria-label="Cerrar modal"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={manejarGuardarConfig}>
              <div style={{ marginBottom: '1.25rem' }}>
                <Campo
                  etiqueta="Cantidad de Preguntas Aleatorias por Examen"
                  ayuda="Si defines un límite (ej. 20), el sistema extraerá 20 preguntas al azar del banco para cada estudiante, garantizando un examen único e impidiendo que copien. Si lo dejas vacío, el estudiante responderá todas las preguntas del banco."
                >
                  <input
                    type="number"
                    min="1"
                    max={metaPaginacion.total > 0 ? metaPaginacion.total : 500}
                    className="campo__control"
                    placeholder="Ej. 20 (Dejar vacío para todas las del banco)"
                    value={formConfig.limite_preguntas}
                    onChange={(e) => setFormConfig({ ...formConfig, limite_preguntas: e.target.value })}
                  />
                </Campo>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.65rem',
                  borderTop: '1px solid var(--borde)',
                  paddingTop: '1rem',
                }}
              >
                <button
                  type="button"
                  className="boton boton--secundario"
                  onClick={() => setMostrarModalConfig(false)}
                  disabled={guardandoConfig}
                >
                  Cancelar
                </button>

                <button type="submit" className="boton boton--primario" disabled={guardandoConfig}>
                  {guardandoConfig ? 'Guardando...' : 'Guardar Configuración'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
