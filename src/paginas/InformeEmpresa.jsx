import { Link, useParams } from 'react-router'
import { obtenerInformeEmpresa } from '../api/empresa.js'
import InformeCandidato from '../componentes/InformeCandidato.jsx'

export default function InformeEmpresa() {
  const { id } = useParams()

  return (
    <div className="contenedor contenedor--informe seccion">
      <Link to="/empresa">← Volver a mis solicitudes</Link>
      <InformeCandidato postulacionId={id} consultar={obtenerInformeEmpresa} />
    </div>
  )
}
