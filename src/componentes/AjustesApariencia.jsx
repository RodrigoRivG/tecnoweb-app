import { useState } from 'react'
import { Moon, SlidersHorizontal, Sun, X } from 'lucide-react'

const PERFILES = [
  { valor: 'adultos', etiqueta: 'Adultos' },
  { valor: 'jovenes', etiqueta: 'Jóvenes' },
  { valor: 'ninos', etiqueta: 'Niños' },
]
const TEXTO_MINIMO = 100
const TEXTO_MAXIMO = 150
const PASO_TEXTO = 10

function leerPreferencias() {
  const { tema, perfilVisual, tamanoTexto, contraste } = document.documentElement.dataset

  return {
    tema: tema === 'oscuro' ? 'oscuro' : 'claro',
    perfilVisual: PERFILES.some(({ valor }) => valor === perfilVisual) ? perfilVisual : 'adultos',
    tamanoTexto: ['110', '120', '130', '140', '150'].includes(tamanoTexto) ? tamanoTexto : String(TEXTO_MINIMO),
    contraste: contraste === 'alto' ? 'alto' : 'normal',
  }
}

export default function AjustesApariencia() {
  const [preferencias, setPreferencias] = useState(leerPreferencias)

  function cambiar(nombre, valor) {
    document.documentElement.dataset[nombre] = valor
    setPreferencias((actuales) => ({ ...actuales, [nombre]: valor }))

    try {
      localStorage.setItem(`tecno.${nombre}`, valor)
    } catch {
      // El ajuste se aplica durante la visita aunque el navegador no pueda guardarlo.
    }
  }

  const oscuro = preferencias.tema === 'oscuro'
  const IconoTema = oscuro ? Sun : Moon
  const etiquetaTema = oscuro ? 'Activar tema claro' : 'Activar tema oscuro'
  const porcentaje = `${preferencias.tamanoTexto} %`

  return (
    <div className="encabezado__controles">
      <button
        type="button"
        className="encabezado__ajustes"
        popoverTarget="ajustes-apariencia"
        aria-label="Apariencia y accesibilidad"
        title="Apariencia y accesibilidad"
      >
        <SlidersHorizontal size={20} aria-hidden="true" />
      </button>

      <div id="ajustes-apariencia" className="apariencia" popover="auto" role="dialog" aria-labelledby="titulo-apariencia">
        <div className="apariencia__fila">
          <h2 id="titulo-apariencia">Apariencia y accesibilidad</h2>
          <button
            type="button"
            className="apariencia__cerrar"
            popoverTarget="ajustes-apariencia"
            popoverTargetAction="hide"
            aria-label="Cerrar ajustes de apariencia"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <label className="apariencia__campo">
          Tema visual
          <select value={preferencias.perfilVisual} onChange={(evento) => cambiar('perfilVisual', evento.target.value)}>
            {PERFILES.map(({ valor, etiqueta }) => <option value={valor} key={valor}>{etiqueta}</option>)}
          </select>
        </label>

        <div className="apariencia__campo">
          <div className="apariencia__fila">
            <label htmlFor="tamano-texto">Tamaño de letra</label>
            <span aria-hidden="true">{porcentaje}</span>
          </div>
          <input
            id="tamano-texto"
            type="range"
            min={TEXTO_MINIMO}
            max={TEXTO_MAXIMO}
            step={PASO_TEXTO}
            value={preferencias.tamanoTexto}
            aria-valuetext={porcentaje}
            onChange={(evento) => cambiar('tamanoTexto', evento.target.value)}
          />
        </div>

        <label className="apariencia__contraste">
          <input type="checkbox" checked={preferencias.contraste === 'alto'} onChange={(evento) => cambiar('contraste', evento.target.checked ? 'alto' : 'normal')} />
          Alto contraste
        </label>
      </div>

      <button
        type="button"
        className="encabezado__tema"
        aria-label={etiquetaTema}
        title={etiquetaTema}
        onClick={() => cambiar('tema', oscuro ? 'claro' : 'oscuro')}
      >
        <IconoTema size={20} aria-hidden="true" />
      </button>
    </div>
  )
}
