import { usuarios } from '../../datos/panel.js'
import ListadoPanel from './ListadoPanel.jsx'

function claseEstado(estado) {
  if (estado === 'Activo') {
    return 'insignia insignia--activo'
  }

  if (estado === 'Bloqueado' || estado === 'Inactivo') {
    return 'insignia insignia--alerta'
  }

  return 'insignia insignia--pendiente'
}

export default function Usuarios() {
  return (
    <ListadoPanel
      titulo="Usuarios"
      descripcion="Cuentas del sistema con su rol y estado."
      filas={usuarios}
      textoDe={(usuario) => `${usuario.nombre} ${usuario.correo} ${usuario.rol} ${usuario.estado}`}
      columnas={[
        ['nombre', 'Nombre'],
        ['correo', 'Correo'],
        ['rol', 'Rol'],
        ['estado', 'Estado'],
      ]}
      fila={(usuario) => (
        <tr key={usuario.id}>
          <td>{usuario.nombre}</td>
          <td>{usuario.correo}</td>
          <td>{usuario.rol}</td>
          <td><span className={claseEstado(usuario.estado)}>{usuario.estado}</span></td>
        </tr>
      )}
    />
  )
}
