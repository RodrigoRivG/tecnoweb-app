import { Link, useParams } from 'react-router'
import { obtenerInformePerfilPublico } from '../api/publico.js'
import InformeCandidato from '../componentes/InformeCandidato.jsx'

export default function PerfilPublicoInforme() {
  const { codigo } = useParams()

  return (
    <div className="contenedor contenedor--informe seccion">
      <Link to="/#titulo-perfiles" className="enlace-accion" style={{ display: 'inline-block', marginBottom: '1rem' }}>
        ← Volver a perfiles destacados
      </Link>
      <p className="seccion__descripcion" style={{ marginTop: 0 }}>
        Informe publicado con consentimiento del egresado. Se muestra solo el código de candidato, sin datos de contacto
        ni identidad civil.
      </p>
      <InformeCandidato postulacionId={codigo} consultar={obtenerInformePerfilPublico} />
    </div>
  )
}