import { carreras, facultades } from '../../datos/panel.js'
import { formatearPuntaje } from '../../utilidades/formato.js'
import ListadoPanel from './ListadoPanel.jsx'

export default function Facultades() {
  return (
    <ListadoPanel
      titulo="Facultades"
      descripcion="Facultades activas y el PPA mínimo que exigen para postular."
      filas={facultades}
      textoDe={(facultad) => `${facultad.sigla} ${facultad.nombre}`}
      columnas={[
        ['sigla', 'Sigla'],
        ['nombre', 'Facultad'],
        ['ppa', 'PPA mínimo', 'numero'],
        ['carreras', 'Carreras', 'numero'],
      ]}
      fila={(facultad) => (
        <tr key={facultad.id}>
          <td className="codigo">{facultad.sigla}</td>
          <td>{facultad.nombre}</td>
          <td className="numero">{formatearPuntaje(facultad.ppaMinimo)}</td>
          <td className="numero">{carreras.filter((carrera) => carrera.facultadId === facultad.id).length}</td>
        </tr>
      )}
    />
  )
}
