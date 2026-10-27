/** Catálogo de ejemplo. Vive solo en el navegador. */

export const facultades = [
  {
    id: 1,
    sigla: 'FICCT',
    nombre: 'Facultad de Ingeniería en Ciencias de la Computación y Telecomunicaciones',
    ppaMinimo: '51.00',
  },
  {
    id: 2,
    sigla: 'FCJPS',
    nombre: 'Facultad de Ciencias Jurídicas, Políticas, Sociales y Relaciones Internacionales',
    ppaMinimo: '60.00',
  },
  {
    id: 3,
    sigla: 'FCEAF',
    nombre: 'Facultad de Ciencias Económicas, Administrativas y Financieras',
    ppaMinimo: '51.00',
  },
]

export const carreras = [
  { id: 1, facultadId: 1, nombre: 'Ingeniería Informática', areas: [] },
  { id: 2, facultadId: 1, nombre: 'Ingeniería de Sistemas', areas: [] },
  { id: 3, facultadId: 1, nombre: 'Ingeniería en Redes y Telecomunicaciones', areas: [] },
  { id: 4, facultadId: 2, nombre: 'Derecho', areas: ['Penal', 'Civil', 'Laboral'] },
  { id: 5, facultadId: 3, nombre: 'Contaduría Pública', areas: [] },
  { id: 6, facultadId: 3, nombre: 'Administración de Empresas', areas: [] },
]

export const usuarios = [
  { id: 1, nombre: 'Admin Talento', correo: 'admin@talento.test', rol: 'Administrador', estado: 'Activo' },
  { id: 2, nombre: 'María Quispe', correo: 'maria.quispe@talento.test', rol: 'Ayudante', estado: 'Activo' },
  { id: 3, nombre: 'Ana Rojas', correo: 'ana.rojas@talento.test', rol: 'Egresado', estado: 'Activo' },
  { id: 4, nombre: 'Luis Fernández', correo: 'luis.fernandez@talento.test', rol: 'Egresado', estado: 'Activo' },
  { id: 5, nombre: 'Camila Soto', correo: 'camila.soto@talento.test', rol: 'Egresado', estado: 'Bloqueado' },
  { id: 6, nombre: 'Jorge Paz', correo: 'jorge.paz@talento.test', rol: 'Candidato externo', estado: 'Pendiente' },
  { id: 7, nombre: 'Contacto Norte', correo: 'contacto@norte.test', rol: 'Empresa', estado: 'Activo' },
  { id: 8, nombre: 'Elena Cruz', correo: 'elena.cruz@talento.test', rol: 'Ayudante', estado: 'Inactivo' },
]

export function facultadDe(id) {
  return facultades.find((facultad) => facultad.id === id)
}
