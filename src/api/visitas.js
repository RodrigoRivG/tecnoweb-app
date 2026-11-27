import { pedir } from './cliente.js'

export async function registrarVisita(ruta, claveVisita) {
  const respuesta = await pedir('/publico/visitas', {
    metodo: 'POST',
    cuerpo: { ruta, clave_visita: claveVisita },
  })

  return respuesta.data.total
}
