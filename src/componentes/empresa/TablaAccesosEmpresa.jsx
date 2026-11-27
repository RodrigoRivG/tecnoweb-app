import { Link } from 'react-router'

export default function TablaAccesosEmpresa({ accesos, mostrarClaves = true }) {
  if (!accesos?.length) {
    return <p className="registro-paso-aviso">Todavía no hay candidatos con acceso en esta vacante.</p>
  }

  return (
    <div className="tabla-envoltura" style={{ marginTop: '0.75rem' }}>
      <table className="tabla tabla--accesos">
        <thead>
          <tr>
            <th>Candidato</th>
            <th>Correo</th>
            {mostrarClaves && <th>Clave temporal</th>}
            <th>Evaluación</th>
            <th>Informe</th>
          </tr>
        </thead>
        <tbody>
          {accesos.map((acceso) => (
            <tr key={acceso.postulacion_id}>
              <td>{acceso.nombre}</td>
              <td className="tabla__celda-correo">{acceso.correo}</td>
              {mostrarClaves && (
                <td>{acceso.clave_temporal ? <code>{acceso.clave_temporal}</code> : '—'}</td>
              )}
              <td className="tabla__celda-estado">{acceso.estado_evaluacion ?? '—'}</td>
              <td>
                <Link to={`/empresa/informes/${acceso.postulacion_id}`}>Ver informe</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}