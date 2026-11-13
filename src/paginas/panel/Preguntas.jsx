import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Copy,
  Edit3,
  FileCheck,
  FileQuestion,
  Filter,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import {
  actualizarPreguntaAdmin,
  crearPreguntaAdmin,
  eliminarPreguntaAdmin,
  obtenerCatalogoPruebasAdmin,
  obtenerPreguntasAdmin,
} from '../../api/admin.js'
import Campo from '../../componentes/Campo.jsx'
import { ErrorCarga, Esqueleto } from '../../componentes/Estado.jsx'

// Plantillas preconfiguradas para creación ultra-rápida de opciones
const PLANTILLAS = {
  likert5: {
    nombre: 'Escala Likert (1 a 5)',
    icono: '⭐',
    descripcion: 'Inteligencia Emocional y Habilidades Blandas',
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
  opciones: [
    { etiqueta: 'A', texto: '', puntaje: '1' },
    { etiqueta: 'B', texto: '', puntaje: '0' },
  ],
}

// Devuelve la siguiente etiqueta secuencial sugerida (A -> B -> C... o 1 -> 2 -> 3...)
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
  const [cargando, setCargando] = useState(true)
  const [cargandoPreguntas, setCargandoPreguntas] = useState(false)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)

  // Filtros
  const [filtroPrueba, setFiltroPrueba] = useState('')
  const [filtroDimension, setFiltroDimension] = useState('')
  const [busqueda, setBusqueda] = useState('')

  // Estado del modal (crear / editar)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear') // 'crear' | 'editar'
  const [form, setForm] = useState(FORMULARIO_INICIAL)
  const [erroresForm, setErroresForm] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState(null)

  // Carga inicial del catálogo y preguntas
  useEffect(() => {
    async function inicializar() {
      setCargando(true)
      setError(null)
      try {
        const cat = await obtenerCatalogoPruebasAdmin()
        setCatalogo(cat)

        // Si hay pruebas, preseleccionar la primera o listar todas
        const datosPreguntas = await obtenerPreguntasAdmin({})
        setPreguntas(datosPreguntas)
      } catch (err) {
        setError(err.message || 'Error al cargar el banco de preguntas.')
      } finally {
        setCargando(false)
      }
    }
    inicializar()
  }, [])

  // Recargar preguntas cuando cambien los filtros principales
  async function recargarPreguntas(filtrosPersonalizados = {}) {
    setCargandoPreguntas(true)
    try {
      const pId = filtrosPersonalizados.prueba_id !== undefined ? filtrosPersonalizados.prueba_id : filtroPrueba
      const dId = filtrosPersonalizados.dimension_id !== undefined ? filtrosPersonalizados.dimension_id : filtroDimension
      const q = filtrosPersonalizados.q !== undefined ? filtrosPersonalizados.q : busqueda

      const params = {}
      if (pId) params.prueba_id = pId
      if (dId) params.dimension_id = dId
      if (q) params.q = q

      const datos = await obtenerPreguntasAdmin(params)
      setPreguntas(datos)

      // Actualizar conteos del catálogo en segundo plano
      const cat = await obtenerCatalogoPruebasAdmin()
      setCatalogo(cat)
    } catch (err) {
      setAviso({ tipo: 'error', mensaje: err.message || 'Error al filtrar preguntas.' })
    } finally {
      setCargandoPreguntas(false)
    }
  }

  // Filtrado local instantáneo por búsqueda si ya están cargadas
  const preguntasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return preguntas.filter((p) => {
      if (filtroPrueba && String(p.prueba_id) !== String(filtroPrueba)) return false
      if (filtroDimension && String(p.dimension_id) !== String(filtroDimension)) return false
      if (!q) return true
      const coincideEnunciado = p.enunciado?.toLowerCase().includes(q)
      const coincideOpcion = p.opciones?.some((o) => o.texto?.toLowerCase().includes(q) || o.etiqueta?.toLowerCase().includes(q))
      return coincideEnunciado || coincideOpcion
    })
  }, [preguntas, filtroPrueba, filtroDimension, busqueda])

  // Abrir modal de creación
  function abrirCrear(pruebaIdPorDefecto = '') {
    const pId = pruebaIdPorDefecto || filtroPrueba || (catalogo.pruebas[0]?.id?.toString() || '')
    setModoModal('crear')
    setErroresForm({})
    setForm({
      ...FORMULARIO_INICIAL,
      prueba_id: pId,
      dimension_id: filtroDimension || '',
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
      prueba_id: pregunta.prueba_id?.toString() || '',
      dimension_id: pregunta.dimension_id?.toString() || '',
      orden: pregunta.orden?.toString() || '',
      enunciado: pregunta.enunciado || '',
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

  // Duplicar pregunta existente como base de una nueva
  function duplicarPregunta(pregunta) {
    setModoModal('crear')
    setErroresForm({})
    setForm({
      id: null,
      prueba_id: pregunta.prueba_id?.toString() || '',
      dimension_id: pregunta.dimension_id?.toString() || '',
      orden: '', // Dejar vacío para asignación automática al final
      enunciado: `${pregunta.enunciado} (Copia)`,
      opciones: pregunta.opciones.map((o) => ({
        etiqueta: o.etiqueta,
        texto: o.texto,
        puntaje: String(o.puntaje),
      })),
    })
    setMostrarModal(true)
    setAviso({
      tipo: 'exito',
      mensaje: `Pregunta clonada en el formulario. Puedes editar el enunciado o las opciones y guardar.`,
    })
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

  // Marcar una opción como única correcta (asigna 1 pto y 0 a las demás)
  function marcarComoUnicaCorrecta(indexSeleccionado) {
    setForm((prev) => ({
      ...prev,
      opciones: prev.opciones.map((opt, idx) => ({
        ...opt,
        puntaje: idx === indexSeleccionado ? '1' : '0',
      })),
    }))
  }

  // Agregar una nueva opción a la lista
  function agregarOpcion() {
    if (form.opciones.length >= 10) return
    const sigEtiqueta = sugerirSiguienteEtiqueta(form.opciones)
    setForm((prev) => ({
      ...prev,
      opciones: [...prev.opciones, { etiqueta: sigEtiqueta, texto: '', puntaje: '0' }],
    }))
  }

  // Eliminar una opción
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

  // Manejar cambio en campos de opciones
  function actualizarOpcion(idx, campo, valor) {
    setForm((prev) => {
      const nuevas = [...prev.opciones]
      nuevas[idx] = { ...nuevas[idx], [campo]: valor }
      return { ...prev, opciones: nuevas }
    })
  }

  // Guardar pregunta (crear o editar)
  async function manejarGuardar(e) {
    e.preventDefault()
    setGuardando(true)
    setErroresForm({})
    setAviso(null)

    // Validaciones locales rápidas
    if (!form.enunciado.trim()) {
      setErroresForm({ enunciado: ['El enunciado de la pregunta es obligatorio.'] })
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
      enunciado: form.enunciado.trim(),
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
        setAviso({ tipo: 'exito', mensaje: 'Pregunta agregada con éxito al banco de preguntas.' })
      } else {
        await actualizarPreguntaAdmin(form.id, payload)
        setAviso({ tipo: 'exito', mensaje: 'Pregunta actualizada exitosamente.' })
      }

      setMostrarModal(false)
      await recargarPreguntas()
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
      alert('Esta pregunta no puede ser eliminada porque ya ha sido respondida por postulantes en evaluaciones previas.')
      return
    }

    const confirmar = window.confirm(
      `¿Estás seguro de eliminar permanentemente la Pregunta #${pregunta.orden}?\n"${pregunta.enunciado}"\nEsta acción eliminará también sus ${pregunta.opciones.length} opciones.`
    )
    if (!confirmar) return

    setEliminandoId(pregunta.id)
    try {
      const res = await eliminarPreguntaAdmin(pregunta.id)
      setAviso({ tipo: 'exito', mensaje: res.message || 'Pregunta eliminada exitosamente.' })
      await recargarPreguntas()
    } catch (err) {
      setAviso({ tipo: 'error', mensaje: err.message || 'No fue posible eliminar la pregunta.' })
    } finally {
      setEliminandoId(null)
    }
  }

  if (cargando) {
    return <Esqueleto cantidad={4} />
  }

  if (error) {
    return <ErrorCarga mensaje={error} reintentar={() => recargarPreguntas()} />
  }

  return (
    <div>
      {/* Cabecera Principal */}
      <header className="seccion__cabecera" style={{ marginBottom: '1.25rem' }}>
        <div>
          <span className="convocatoria__facultad" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Evaluación Psicométrica & Técnica
          </span>
          <h1 className="titulo-pagina" style={{ margin: '0.2rem 0' }}>
            Banco de Preguntas
          </h1>
          <p className="seccion__descripcion" style={{ margin: 0 }}>
            Administra los reactivos, factores evaluados, opciones de respuesta y matrices de puntaje para cada prueba psicométrica.
          </p>
        </div>

        <button type="button" className="boton boton--primario" onClick={() => abrirCrear()}>
          <Plus size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
          Nueva Pregunta
        </button>
      </header>

      {/* Alerta de aviso */}
      {aviso && (
        <div className={`aviso aviso--${aviso.tipo}`} role="alert" style={{ marginBottom: '1.25rem' }}>
          <p>{aviso.mensaje}</p>
        </div>
      )}

      {/* Tarjetas de Métricas Institucionales */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div className="tarjeta" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '12px',
              background: 'var(--primario-suave)',
              color: 'var(--primario)',
              display: 'flex',
            }}
          >
            <FileQuestion size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.1 }}>
              {catalogo.resumen?.total_preguntas ?? 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--texto-suave)', marginTop: '0.2rem' }}>
              Preguntas en Banco
            </div>
          </div>
        </div>

        <div className="tarjeta" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '12px',
              background: 'var(--superficie-suave)',
              color: 'var(--texto)',
              display: 'flex',
            }}
          >
            <Layers size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.1 }}>
              {catalogo.resumen?.total_pruebas ?? 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--texto-suave)', marginTop: '0.2rem' }}>
              Pruebas Psicotécnicas
            </div>
          </div>
        </div>

        <div className="tarjeta" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '12px',
              background: 'var(--destacado-suave)',
              color: 'var(--destacado)',
              display: 'flex',
            }}
          >
            <Sparkles size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.1 }}>
              {catalogo.resumen?.total_dimensiones ?? 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--texto-suave)', marginTop: '0.2rem' }}>
              Dimensiones Evaluadas
            </div>
          </div>
        </div>

        <div className="tarjeta" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '12px',
              background: 'var(--exito-suave)',
              color: 'var(--exito)',
              display: 'flex',
            }}
          >
            <FileCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.1 }}>
              {preguntasFiltradas.length}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--texto-suave)', marginTop: '0.2rem' }}>
              Preguntas Mostradas
            </div>
          </div>
        </div>
      </div>

      {/* Selector Rápido de Pruebas (Pills) */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setFiltroPrueba('')
            recargarPreguntas({ prueba_id: '' })
          }}
          className={`boton ${filtroPrueba === '' ? 'boton--primario' : 'boton--secundario'} boton--chico`}
          style={{ whiteSpace: 'nowrap', borderRadius: '20px' }}
        >
          Todas las Pruebas ({catalogo.resumen?.total_preguntas ?? 0})
        </button>

        {catalogo.pruebas.map((p) => {
          const activa = String(filtroPrueba) === String(p.id)
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setFiltroPrueba(String(p.id))
                recargarPreguntas({ prueba_id: String(p.id) })
              }}
              className={`boton ${activa ? 'boton--primario' : 'boton--secundario'} boton--chico`}
              style={{ whiteSpace: 'nowrap', borderRadius: '20px' }}
            >
              {p.nombre} ({p.preguntas_count ?? 0})
            </button>
          )
        })}
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="filtros" style={{ marginBottom: '1.5rem', alignItems: 'center' }}>
        <div className="filtros__campo" style={{ flex: '1 1 200px' }}>
          <label htmlFor="filtro-prueba">Prueba Psicotécnica</label>
          <select
            id="filtro-prueba"
            className="campo__control"
            value={filtroPrueba}
            onChange={(e) => {
              const val = e.target.value
              setFiltroPrueba(val)
              recargarPreguntas({ prueba_id: val })
            }}
          >
            <option value="">-- Todas las Pruebas --</option>
            {catalogo.pruebas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.preguntas_count ?? 0} preguntas)
              </option>
            ))}
          </select>
        </div>

        <div className="filtros__campo" style={{ flex: '1 1 200px' }}>
          <label htmlFor="filtro-dimension">Dimensión Psicométrica</label>
          <select
            id="filtro-dimension"
            className="campo__control"
            value={filtroDimension}
            onChange={(e) => {
              const val = e.target.value
              setFiltroDimension(val)
              recargarPreguntas({ dimension_id: val })
            }}
          >
            <option value="">-- Todas las Dimensiones --</option>
            {catalogo.dimensiones.map((d) => (
              <option key={d.id} value={d.id}>
                [{d.tipo}] {d.codigo} - {d.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="filtros__campo" style={{ flex: '2 1 260px' }}>
          <label htmlFor="filtro-busqueda">Buscar en Enunciados u Opciones</label>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--texto-suave)',
              }}
            />
            <input
              id="filtro-busqueda"
              type="text"
              className="campo__control"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Ej. iniciativa, liderazgo, problemas..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <button
          type="button"
          className="boton boton--secundario"
          style={{ height: '42px', alignSelf: 'flex-end' }}
          onClick={() => recargarPreguntas()}
          disabled={cargandoPreguntas}
          title="Actualizar listado"
        >
          <RefreshCw size={16} className={cargandoPreguntas ? 'animacion-rotar' : ''} />
        </button>
      </div>

      {/* Listado de Preguntas */}
      {cargandoPreguntas ? (
        <Esqueleto cantidad={3} />
      ) : preguntasFiltradas.length === 0 ? (
        <div className="tarjeta" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <Filter size={40} style={{ color: 'var(--texto-suave)', marginBottom: '0.75rem', opacity: 0.7 }} />
          <h2 style={{ fontSize: '1.15rem', margin: '0 0 0.5rem' }}>No se encontraron preguntas</h2>
          <p style={{ color: 'var(--texto-suave)', maxWidth: '460px', margin: '0 auto 1.25rem' }}>
            No hay reactivos que coincidan con los filtros seleccionados. Puedes cambiar de prueba o agregar una nueva pregunta.
          </p>
          <button type="button" className="boton boton--primario" onClick={() => abrirCrear()}>
            <Plus size={16} style={{ marginRight: '0.35rem' }} />
            Crear Nueva Pregunta
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {preguntasFiltradas.map((preg) => (
            <article
              key={preg.id}
              className="tarjeta"
              style={{
                borderLeft: preg.dimension?.tipo === 'PERSONALIDAD'
                  ? '4px solid var(--primario)'
                  : preg.dimension?.tipo === 'HABILIDAD_BLANDA'
                  ? '4px solid var(--exito)'
                  : '4px solid var(--borde)',
                padding: '1.25rem',
                transition: 'box-shadow 0.2s',
              }}
            >
              {/* Cabecera de la Tarjeta */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  marginBottom: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      background: 'var(--superficie-suave)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                    }}
                  >
                    #{preg.orden}
                  </span>

                  <span className="insignia insignia--neutro" style={{ fontSize: '0.75rem' }}>
                    {preg.prueba?.nombre || 'Prueba Psicométrica'}
                  </span>

                  {preg.dimension && (
                    <span
                      style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background:
                          preg.dimension.tipo === 'PERSONALIDAD'
                            ? 'var(--primario-suave)'
                            : 'var(--exito-suave)',
                        color:
                          preg.dimension.tipo === 'PERSONALIDAD'
                            ? 'var(--primario)'
                            : 'var(--exito)',
                      }}
                    >
                      {preg.dimension.codigo}: {preg.dimension.nombre}
                    </span>
                  )}

                  {preg.tiene_respuestas && (
                    <span
                      className="insignia insignia--advertencia"
                      style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      title="Esta pregunta tiene respuestas de candidatos registradas en intentos previos"
                    >
                      🔒 Con Respuestas ({preg.respuestas_count})
                    </span>
                  )}
                </div>

                {/* Acciones de la Pregunta */}
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className="boton boton--secundario boton--chico"
                    onClick={() => duplicarPregunta(preg)}
                    title="Clonar como nueva pregunta"
                  >
                    <Copy size={14} style={{ marginRight: '0.25rem' }} />
                    Duplicar
                  </button>

                  <button
                    type="button"
                    className="boton boton--secundario boton--chico"
                    onClick={() => abrirEditar(preg)}
                    title="Editar reactivo y opciones"
                  >
                    <Edit3 size={14} style={{ marginRight: '0.25rem' }} />
                    Editar
                  </button>

                  <button
                    type="button"
                    className="boton boton--peligro boton--chico"
                    onClick={() => manejarEliminar(preg)}
                    disabled={preg.tiene_respuestas || eliminandoId === preg.id}
                    title={
                      preg.tiene_respuestas
                        ? 'No se puede eliminar: tiene intentos de postulantes registrados'
                        : 'Eliminar pregunta'
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Enunciado de la Pregunta */}
              <p
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  margin: '0 0 1rem',
                  color: 'var(--texto)',
                  lineHeight: 1.45,
                }}
              >
                {preg.enunciado}
              </p>

              {/* Opciones de Respuesta */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: '0.5rem',
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
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        background: tienePuntaje ? 'var(--superficie-suave)' : 'transparent',
                        border: '1px solid var(--borde)',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            flexShrink: 0,
                            background: tienePuntaje ? 'var(--primario)' : 'var(--borde)',
                            color: tienePuntaje ? '#fff' : 'var(--texto-suave)',
                          }}
                        >
                          {opc.etiqueta}
                        </span>
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: 'var(--texto)',
                          }}
                        >
                          {opc.texto}
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          flexShrink: 0,
                          padding: '0.15rem 0.4rem',
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

      {/* ========================================================================= */}
      {/* MODAL DE CREACIÓN / EDICIÓN DE PREGUNTAS                                 */}
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
              maxWidth: '720px',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '1.75rem',
              borderRadius: '16px',
            }}
          >
            {/* Cabecera del Modal */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1.25rem',
                borderBottom: '1px solid var(--borde)',
                paddingBottom: '1rem',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.3rem', margin: '0 0 0.25rem' }}>
                  {modoModal === 'crear' ? 'Nueva Pregunta Psicotécnica' : `Editar Pregunta #${form.orden}`}
                </h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--texto-suave)' }}>
                  Configura el enunciado, el factor de medición y las alternativas con sus respectivas ponderaciones.
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

            {/* Aviso dentro del modal si tiene respuestas */}
            {form.tiene_respuestas && (
              <div className="aviso aviso--advertencia" style={{ marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <p>
                  <strong>Atención:</strong> Esta pregunta ya registra respuestas en evaluaciones de postulantes.
                  Puedes actualizar el enunciado y ponderaciones, pero no puedes remover opciones que tengan respuestas asociadas.
                </p>
              </div>
            )}

            <form onSubmit={manejarGuardar}>
              {/* Fila 1: Prueba & Dimensión */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                }}
              >
                <Campo etiqueta="Prueba Psicotécnica *" error={erroresForm.prueba_id?.[0]}>
                  <select
                    required
                    className="campo__control"
                    value={form.prueba_id}
                    disabled={modoModal === 'editar'}
                    onChange={(e) => setForm({ ...form, prueba_id: e.target.value })}
                  >
                    <option value="">-- Seleccionar Prueba --</option>
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

              {/* Fila 2: Orden & Enunciado */}
              <div style={{ marginBottom: '1rem' }}>
                <Campo
                  etiqueta="Número de Orden (Opcional)"
                  error={erroresForm.orden?.[0]}
                  ayuda="Déjalo vacío para asignación correlativa automática al final de la prueba."
                >
                  <input
                    type="number"
                    min="1"
                    className="campo__control"
                    placeholder="Ej. 1, 2, 3... (Automático si está vacío)"
                    value={form.orden}
                    onChange={(e) => setForm({ ...form, orden: e.target.value })}
                  />
                </Campo>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <Campo etiqueta="Enunciado de la Pregunta *" error={erroresForm.enunciado?.[0]}>
                  <textarea
                    required
                    rows="3"
                    className="campo__control"
                    placeholder="Escribe claramente la pregunta o afirmación reactiva..."
                    value={form.enunciado}
                    onChange={(e) => setForm({ ...form, enunciado: e.target.value })}
                  />
                </Campo>
              </div>

              {/* Barra de Plantillas Rápidas (PRESETS) */}
              <div
                style={{
                  background: 'var(--superficie-suave)',
                  border: '1px solid var(--borde)',
                  borderRadius: '12px',
                  padding: '0.85rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    marginBottom: '0.6rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}
                >
                  <Sparkles size={16} style={{ color: 'var(--primario)' }} />
                  <span>Plantillas Rápidas de Opciones:</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {Object.entries(PLANTILLAS).map(([clave, plant]) => (
                    <button
                      key={clave}
                      type="button"
                      className="boton boton--secundario boton--chico"
                      style={{ fontSize: '0.8rem' }}
                      onClick={() => aplicarPlantilla(clave)}
                      title={plant.descripcion}
                    >
                      <span style={{ marginRight: '0.3rem' }}>{plant.icono}</span>
                      {plant.nombre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sección de Opciones de Respuesta */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem',
                  }}
                >
                  <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                    Opciones de Respuesta ({form.opciones.length} alternativas)
                  </label>
                  <button
                    type="button"
                    className="boton boton--secundario boton--chico"
                    onClick={agregarOpcion}
                    disabled={form.opciones.length >= 10}
                  >
                    <Plus size={14} style={{ marginRight: '0.25rem' }} />
                    Agregar Opción
                  </button>
                </div>

                <div style={{ display: 'grid', gap: '0.6rem' }}>
                  {form.opciones.map((opc, idx) => (
                    <div
                      key={opc.id || idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '60px 1fr 100px auto auto',
                        gap: '0.5rem',
                        alignItems: 'center',
                        background: 'var(--superficie)',
                        border: '1px solid var(--borde)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                      }}
                    >
                      {/* Etiqueta (A, B, C...) */}
                      <input
                        type="text"
                        maxLength="1"
                        className="campo__control"
                        style={{ textAlign: 'center', fontWeight: 700, textTransform: 'uppercase' }}
                        value={opc.etiqueta}
                        onChange={(e) => actualizarOpcion(idx, 'etiqueta', e.target.value.toUpperCase())}
                        title="Etiqueta identificadora (ej. A, B, 1)"
                      />

                      {/* Texto de la Opción */}
                      <input
                        type="text"
                        required
                        className="campo__control"
                        placeholder={`Texto para la opción ${opc.etiqueta}...`}
                        value={opc.texto}
                        onChange={(e) => actualizarOpcion(idx, 'texto', e.target.value)}
                      />

                      {/* Puntaje */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          className="campo__control"
                          style={{ textAlign: 'right' }}
                          value={opc.puntaje}
                          onChange={(e) => actualizarOpcion(idx, 'puntaje', e.target.value)}
                          title="Puntaje otorgado al elegir esta opción"
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--texto-suave)' }}>pts</span>
                      </div>

                      {/* Botón rápido marcar correcta (1 pto) */}
                      <button
                        type="button"
                        className="boton boton--secundario boton--chico"
                        onClick={() => marcarComoUnicaCorrecta(idx)}
                        title="Marcar como la única opción correcta (1 pt)"
                        style={{
                          padding: '0.35rem 0.5rem',
                          background: parseFloat(opc.puntaje) > 0 ? 'var(--exito-suave)' : 'transparent',
                          color: parseFloat(opc.puntaje) > 0 ? 'var(--exito)' : 'inherit',
                          borderColor: parseFloat(opc.puntaje) > 0 ? 'var(--exito)' : 'var(--borde)',
                        }}
                      >
                        <CheckCircle2 size={14} />
                      </button>

                      {/* Eliminar opción */}
                      <button
                        type="button"
                        className="boton boton--peligro boton--chico"
                        style={{ padding: '0.35rem 0.5rem' }}
                        onClick={() => eliminarOpcion(idx)}
                        disabled={form.opciones.length <= 2}
                        title="Eliminar esta opción"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones del Pie del Modal */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  borderTop: '1px solid var(--borde)',
                  paddingTop: '1.25rem',
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
                  {guardando ? (
                    <>
                      <RefreshCw size={16} className="animacion-rotar" style={{ marginRight: '0.35rem' }} />
                      Guardando...
                    </>
                  ) : modoModal === 'crear' ? (
                    <>
                      <Plus size={16} style={{ marginRight: '0.35rem' }} />
                      Guardar Pregunta
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} style={{ marginRight: '0.35rem' }} />
                      Actualizar Pregunta
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
