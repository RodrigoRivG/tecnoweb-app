import { useEffect } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router'
import Encabezado from './componentes/Encabezado.jsx'
import Bienvenida from './paginas/Bienvenida.jsx'
import DetallePostulacion from './paginas/DetallePostulacion.jsx'
import IniciarSesion from './paginas/IniciarSesion.jsx'
import MiCuenta from './paginas/MiCuenta.jsx'
import Carreras from './paginas/panel/Carreras.jsx'
import Facultades from './paginas/panel/Facultades.jsx'
import PanelLayout from './paginas/panel/PanelLayout.jsx'
import Usuarios from './paginas/panel/Usuarios.jsx'
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
            <Route path="/panel" element={<PanelLayout />}>
              <Route index element={<Navigate to="facultades" replace />} />
              <Route path="facultades" element={<Facultades />} />
              <Route path="carreras" element={<Carreras />} />
              <Route path="usuarios" element={<Usuarios />} />
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
