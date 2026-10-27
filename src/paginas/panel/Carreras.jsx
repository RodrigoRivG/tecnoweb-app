import { carreras, facultadDe } from '../../datos/panel.js'
import ListadoPanel from './ListadoPanel.jsx'

export default function Carreras() {
  return (
    <ListadoPanel
      titulo="Carreras"
      descripcion="Carreras de cada facultad y sus áreas de preferencia."
      filas={carreras}
      textoDe={(carrera) => {
        const facultad = facultadDe(carrera.facultadId)

        return `${carrera.nombre} ${facultad.sigla} ${facultad.nombre} ${carrera.areas.join(' ')}`
      }}
      columnas={[
        ['carrera', 'Carrera'],
        ['facultad', 'Facultad'],
        ['areas', 'Áreas'],
      ]}
      fila={(carrera) => {
        const facultad = facultadDe(carrera.facultadId)

        return (
          <tr key={carrera.id}>
            <td>{carrera.nombre}</td>
            <td>
              {facultad.nombre}
              <span className="tabla__secundario">{facultad.sigla}</span>
            </td>
            <td>{carrera.areas.length > 0 ? carrera.areas.join(', ') : 'Sin áreas'}</td>
          </tr>
        )
      }}
    />
  )
}
