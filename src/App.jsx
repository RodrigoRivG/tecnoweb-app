import { BrowserRouter, Link, Route, Routes } from 'react-router'
import Encabezado from './componentes/Encabezado.jsx'
import Bienvenida from './paginas/Bienvenida.jsx'
import MiCuenta from './paginas/MiCuenta.jsx'
import Registro from './paginas/Registro.jsx'
import { SesionProvider } from './sesion/SesionContext.jsx'

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
        <Encabezado />
        <main>
          <Routes>
            <Route path="/" element={<Bienvenida />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/mi-cuenta" element={<MiCuenta />} />
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
