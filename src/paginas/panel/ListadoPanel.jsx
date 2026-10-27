import { useState } from 'react'

/** Título, buscador y tabla filtrada de una sección del panel. */
export default function ListadoPanel({ titulo, descripcion, filas, textoDe, columnas, fila }) {
  const [consulta, setConsulta] = useState('')
  const texto = consulta.trim().toLocaleLowerCase('es')
  const visibles = texto ? filas.filter((item) => textoDe(item).toLocaleLowerCase('es').includes(texto)) : filas
  const nombre = titulo.toLocaleLowerCase('es')

  return (
    <>
      <div className="panel__herramientas">
        <div>
          <h1 className="titulo-pagina">{titulo}</h1>
          <p className="panel__descripcion">{descripcion}</p>
        </div>
        <label className="panel__buscar">
          <span className="visualmente-oculto">Buscar {nombre}</span>
          <input
            type="search"
            value={consulta}
            placeholder={`Buscar ${nombre}`}
            onChange={(evento) => setConsulta(evento.target.value)}
          />
        </label>
      </div>

      {visibles.length === 0 ? (
        <div className="vacio">
          <p className="vacio__titulo">Sin resultados</p>
          <p>Prueba con otro nombre, sigla o correo.</p>
        </div>
      ) : (
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead>
              <tr>
                {columnas.map(([clave, etiqueta, clase]) => <th key={clave} className={clase}>{etiqueta}</th>)}
              </tr>
            </thead>
            <tbody>{visibles.map(fila)}</tbody>
          </table>
        </div>
      )}
    </>
  )
}
