import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import BottomNav from './BottomNav'
import { useNotificaciones } from '../../hooks/useNotificaciones'

// Rutas a las que se llega navegando desde otra página (no viven en
// BottomNav) — el header les muestra una flecha "volver" en vez del
// avatar. Header se renderiza una sola vez acá (layout compartido con
// <Outlet/>), así que ninguna página puede pasarle la prop directamente;
// por eso la decisión se toma acá, mirando la ruta actual.
const RUTAS_CON_VOLVER = ['/perfil', '/notificaciones', '/horarios', '/mis-entradas', '/vestuario']

function tieneVolver(pathname) {
  // /mis-entradas/:compraId/butacas: ruta con parámetro, no entra en la
  // lista de arriba (son todas exactas) — mismo criterio que /eventos.
  return RUTAS_CON_VOLVER.includes(pathname) || pathname.startsWith('/eventos') || pathname.startsWith('/mis-entradas/')
}

export default function Shell() {
  const location = useLocation()
  const mostrarVolver = tieneVolver(location.pathname)

  // Se llama una sola vez acá arriba (no en cada página por separado) para
  // que el estado se comparta entre el header y las páginas.
  const notificacionesApi = useNotificaciones()
  // noLeidas del hook, no un conteo manual de notifs: incluye las pendientes
  // del servidor que no entran en las últimas 30 que trae la lista.
  const { noLeidas } = notificacionesApi

  return (
    <div className="flex flex-col h-svh max-w-md mx-auto bg-primary-subtle">
      <Header noLeidas={noLeidas} mostrarVolver={mostrarVolver} />
      <main className="flex-1 overflow-y-auto">
        <Outlet context={{ notificacionesApi }} />
      </main>
      <BottomNav />
    </div>
  )
}
