import { useEffect, useState } from 'react'
import { obtenerBlobDocumento } from '../api/cliente.js'
import { formatearTamano } from '../utilidades/formato.js'

function useObjectUrl(archivo) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (!archivo) {
      setUrl(null)

      return undefined
    }

    const creada = URL.createObjectURL(archivo)
    setUrl(creada)

    return () => URL.revokeObjectURL(creada)
  }, [archivo])

  return url
}

/**
 * @param {File | undefined | null} archivoLocal
 * @param {{ id: number, nombre_archivo: string, mime_type?: string, tamano_bytes?: number } | null} documentoServidor
 */
export default function VistaPreviaDocumento({ archivoLocal, documentoServidor, etiqueta = 'Vista previa' }) {
  const urlLocal = useObjectUrl(archivoLocal ?? null)
  const [urlRemota, setUrlRemota] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (archivoLocal || !documentoServidor?.id) {
      setUrlRemota(null)
      setError(null)

      return undefined
    }

    let activo = true
    setCargando(true)
    setError(null)

    obtenerBlobDocumento(`/documentos/${documentoServidor.id}/archivo`)
      .then((blob) => {
        if (!activo) return
        setUrlRemota(URL.createObjectURL(blob))
      })
      .catch(() => activo && setError('No se pudo cargar la vista previa.'))
      .finally(() => activo && setCargando(false))

    return () => {
      activo = false
      setUrlRemota((anterior) => {
        if (anterior) URL.revokeObjectURL(anterior)

        return null
      })
    }
  }, [archivoLocal, documentoServidor?.id])

  const mime = archivoLocal?.type ?? documentoServidor?.mime_type ?? ''
  const nombre = archivoLocal?.name ?? documentoServidor?.nombre_archivo ?? 'Archivo'
  const tamano = archivoLocal?.size ?? documentoServidor?.tamano_bytes
  const url = urlLocal ?? urlRemota
  const esImagen = mime.startsWith('image/')
  const esPdf = mime === 'application/pdf' || nombre.toLowerCase().endsWith('.pdf')

  if (!archivoLocal && !documentoServidor) {
    return null
  }

  return (
    <figure className="requisito-previa" aria-label={etiqueta}>
      <p className="requisito-previa__titulo">
        {archivoLocal ? 'Archivo seleccionado (aún no enviado)' : 'Archivo en el sistema'}
      </p>
      <p className="requisito-previa__meta">
        <strong>{nombre}</strong>
        {tamano != null && <span> · {formatearTamano(tamano)}</span>}
      </p>

      {cargando && <p className="requisito-previa__cargando">Cargando vista previa…</p>}
      {error && <p className="requisito-previa__error">{error}</p>}

      {url && esImagen && (
        <img className="requisito-previa__imagen" src={url} alt={`Vista previa de ${nombre}`} />
      )}

      {url && esPdf && !esImagen && (
        <iframe className="requisito-previa__pdf" title={`PDF ${nombre}`} src={url} />
      )}

      {url && !esImagen && !esPdf && (
        <p className="requisito-previa__generico">Documento listo. Usa «Ver» o «Descargar» para abrirlo.</p>
      )}
    </figure>
  )
}