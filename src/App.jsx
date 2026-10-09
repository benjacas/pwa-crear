import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import { AlumnoActivoProvider } from './context/AlumnoActivoContext'
import RequireRole from './routes/RequireRole'
import Shell from './components/layout/Shell'
import Login from './pages/Login'
import CambiarClave from './pages/CambiarClave'
import SeleccionarAlumno from './pages/SeleccionarAlumno'
import Home from './pages/Home'
import Pagos from './pages/Pagos'
import Asistencia from './pages/Asistencia'
import Clases from './pages/Clases'
import Horarios from './pages/Horarios'
import Evaluaciones from './pages/Evaluaciones'
import Perfil from './pages/Perfil'
import Notificaciones from './pages/Notificaciones'
import Eventos from './pages/Eventos'
import EventoDetalle from './pages/EventoDetalle'
import EventoButacas from './pages/EventoButacas'
import ResumenCompra from './pages/ResumenCompra'
import MisEntradas from './pages/MisEntradas'
import ElegirButacas from './pages/ElegirButacas'
import VestuarioEvento from './pages/VestuarioEvento'
import Vestuario from './pages/Vestuario'
import EntradaPublica from './pages/EntradaPublica'

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Pública a propósito: la abre cualquiera que escanee el QR de
                una entrada, sin sesión iniciada — fuera de RequireRole (no
                pide token) y fuera de Shell (sin barra de navegación ni
                AlumnoActivoProvider, no tiene nada que ver con "qué hija
                está viendo" un tutor logueado). */}
            <Route path="/entrada/:codigo" element={<EntradaPublica />} />

            {/* AlumnoActivoProvider envuelve login + selector + portal para
                que sobreviva la navegación entre esas 3 pantallas (si solo
                envolviera el layout con Shell, se remontaría con el mock al
                entrar y perdería los datos reales que cargó el login). */}
            <Route element={<AlumnoActivoProvider><Outlet /></AlumnoActivoProvider>}>
              <Route path="/login" element={<Login />} />
              <Route path="/cambiar-clave" element={<RequireRole><CambiarClave /></RequireRole>} />
              <Route path="/seleccionar-alumno" element={<RequireRole><SeleccionarAlumno /></RequireRole>} />
              <Route path="/" element={<RequireRole><Shell /></RequireRole>}>
                <Route index element={<Home />} />
                <Route path="pagos" element={<Pagos />} />
                <Route path="asistencia" element={<Asistencia />} />
                <Route path="clases" element={<Clases />} />
                <Route path="horarios" element={<Horarios />} />
                <Route path="evaluaciones" element={<Evaluaciones />} />
                <Route path="perfil" element={<Perfil />} />
                <Route path="notificaciones" element={<Notificaciones />} />
                <Route path="eventos" element={<Eventos />} />
                <Route path="eventos/:id" element={<EventoDetalle />} />
                <Route path="eventos/:id/butacas" element={<EventoButacas />} />
                <Route path="eventos/:id/resumen" element={<ResumenCompra />} />
                <Route path="eventos/:id/vestuario" element={<VestuarioEvento />} />
                <Route path="mis-entradas" element={<MisEntradas />} />
                <Route path="mis-entradas/:compraId/butacas" element={<ElegirButacas />} />
                <Route path="vestuario" element={<Vestuario />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  )
}
