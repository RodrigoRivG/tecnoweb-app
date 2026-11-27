import { Link } from 'react-router'

export default function ResumenClavesCandidatos({ procesoId, accesos, titulo, descripcion, ampliar = false }) {
  return (
    <div className="contenedor seccion">
      <Link to={`/empresa/solicitudes/${procesoId}`}>← Volver a la vacante</Link>
      <h1 className="titulo-pagina" style={{ marginTop: '1rem' }}>
        {titulo}
      </h1>
      <p className="seccion__descripcion">{descripcion}</p>
      <div className="aviso aviso--exito" role="status" style={{ marginTop: '1rem' }}>
        <p>
          {ampliar
            ? 'Comparte la clave temporal solo con las personas nuevas. Las que ya evalúan no cambian.'
            : 'Comparte correo y clave temporal con cada candidato para que inicien sesión y rindan las pruebas.'}
        </p>
      </div>
      <table className="tabla" style={{ marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Clave temporal</th>
          </tr>
        </thead>
        <tbody>
          {accesos.map((acceso) => (
            <tr key={acceso.postulacion_id}>
              <td>{acceso.nombre}</td>
              <td>{acceso.correo}</td>
              <td>
                <code>{acceso.clave_temporal}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="formulario__acciones" style={{ marginTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <Link to={`/empresa/solicitudes/${procesoId}`} replace state={{}} className="boton boton--primario">
          Ver vacante e informes
        </Link>
        <Link to="/empresa" className="boton boton--secundario">
          Ir a mis vacantes
        </Link>
      </div>
    </div>
  )
}