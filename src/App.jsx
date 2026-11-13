import { useEffect } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router'
import Encabezado from './componentes/Encabezado.jsx'
import Bienvenida from './paginas/Bienvenida.jsx'
import DetallePostulacion from './paginas/DetallePostulacion.jsx'
import IniciarSesion from './paginas/IniciarSesion.jsx'
import MiCuenta from './paginas/MiCuenta.jsx'
import RendirTest from './paginas/RendirTest.jsx'
import Carreras from './paginas/panel/Carreras.jsx'
import Convocatorias from './paginas/panel/Convocatorias.jsx'
import Facultades from './paginas/panel/Facultades.jsx'
import PanelLayout from './paginas/panel/PanelLayout.jsx'
import Preguntas from './paginas/panel/Preguntas.jsx'
import Postulaciones from './paginas/panel/Postulaciones.jsx'
import Usuarios from './paginas/panel/Usuarios.jsx'
import RolesPermisos from './paginas/panel/RolesPermisos.jsx'
import Registro from './paginas/Registro.jsx'
import { SesionProvider } from './sesion/SesionContext.jsx'

function TemaBienvenida() {
  const { pathname } = useLocation()

  useEffect(() => {
    const enClaro =
      ['/', '/iniciar-sesion', '/registro'].includes(pathname) ||
      pathname.startsWith('/panel') ||
      pathname.startsWith('/postulaciones')

    document.documentElement.classList.toggle('tema-claro', enClaro)

    return () => document.documentElement.classList.remove('tema-claro')
  }, [pathname])

  return null
}

function NoEncontrada() {
  return (
    <div className="contenedor seccion">
      <h1 className="titulo-pagina">Página no encontrada</h1>
      <p><Link to="/">Volver al inicio</Link></p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SesionProvider>
        <TemaBienvenida />
        <Encabezado />
        <main>
          <Routes>
            <Route path="/" element={<Bienvenida />} />
            <Route path="/iniciar-sesion" element={<IniciarSesion />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/mi-cuenta" element={<MiCuenta />} />
            <Route path="/postulaciones/:id" element={<DetallePostulacion />} />
            <Route path="/postulaciones/:id/test" element={<RendirTest />} />
            <Route path="/panel" element={<PanelLayout />}>
              <Route index element={<Navigate to="facultades" replace />} />
              <Route path="facultades" element={<Facultades />} />
              <Route path="carreras" element={<Carreras />} />
              <Route path="convocatorias" element={<Convocatorias />} />
              <Route path="preguntas" element={<Preguntas />} />
              <Route path="postulaciones" element={<Postulaciones />} />
              <Route path="postulaciones/:id" element={<DetallePostulacion />} />
              <Route path="usuarios" element={<Usuarios />} />
              <Route path="roles-permisos" element={<RolesPermisos />} />
            </Route>
            <Route path="*" element={<NoEncontrada />} />
          </Routes>
        </main>
        <footer className="pie">
          <div className="contenedor">Bolsa de talento para egresados</div>
        </footer>
      </SesionProvider>
    </BrowserRouter>
  )
}
