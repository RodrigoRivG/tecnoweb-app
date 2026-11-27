import Campo from '../Campo.jsx'
import { CANDIDATO_VACIO } from '../../utilidades/candidatosEmpresa.js'

export default function FormularioListaCandidatos({ candidatos, errores, onCambiar, onAgregar, onQuitar, leyenda }) {
  return (
    <fieldset className="grupo">
      <legend>Candidatos</legend>
      {leyenda && <p className="registro-paso-aviso">{leyenda}</p>}
      {candidatos.map((candidato, indice) => (
        <div key={indice} className="registro-candidato-bloque">
          <p className="registro-candidato-bloque__titulo">Candidato {indice + 1}</p>
          <Campo etiqueta="Nombres" error={errores[`candidatos.${indice}.nombres`]}>
            {(a11y) => (
              <input {...a11y} value={candidato.nombres} onChange={(e) => onCambiar(indice, 'nombres', e.target.value)} />
            )}
          </Campo>
          <Campo etiqueta="Apellido" error={errores[`candidatos.${indice}.apellido_paterno`]}>
            {(a11y) => (
              <input
                {...a11y}
                value={candidato.apellido_paterno}
                onChange={(e) => onCambiar(indice, 'apellido_paterno', e.target.value)}
              />
            )}
          </Campo>
          <Campo etiqueta="Cédula" error={errores[`candidatos.${indice}.ci_numero`]}>
            {(a11y) => (
              <input {...a11y} value={candidato.ci_numero} onChange={(e) => onCambiar(indice, 'ci_numero', e.target.value)} />
            )}
          </Campo>
          <Campo etiqueta="Fecha de nacimiento" error={errores[`candidatos.${indice}.fecha_nacimiento`]}>
            {(a11y) => (
              <input
                {...a11y}
                type="date"
                value={candidato.fecha_nacimiento}
                onChange={(e) => onCambiar(indice, 'fecha_nacimiento', e.target.value)}
              />
            )}
          </Campo>
          <Campo etiqueta="Correo" error={errores[`candidatos.${indice}.correo`]} className="campo--ancho">
            {(a11y) => (
              <input
                {...a11y}
                type="email"
                value={candidato.correo}
                onChange={(e) => onCambiar(indice, 'correo', e.target.value)}
              />
            )}
          </Campo>
          {candidatos.length > 1 && (
            <button type="button" className="boton boton--secundario boton--chico" onClick={() => onQuitar(indice)}>
              Quitar
            </button>
          )}
        </div>
      ))}
      <button type="button" className="boton boton--secundario" onClick={() => onAgregar({ ...CANDIDATO_VACIO })}>
        Agregar candidato
      </button>
    </fieldset>
  )
}