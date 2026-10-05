import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { CreditCard, AlertTriangle, Star, PartyPopper, CheckCircle2, Bell, ShieldAlert } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import { formatFechaRelativa, infoTipoNotificacion } from '../utils/format'

const ICONOS_TIPO = {
  'credit-card': CreditCard,
  'alert-triangle': AlertTriangle,
  star: Star,
  'party-popper': PartyPopper,
  'check-circle': CheckCircle2,
  bell: Bell,
  'shield-alert': ShieldAlert,
}

export default function Notificaciones() {
  const navigate = useNavigate()
  const { notificacionesApi } = useOutletContext()
  const { notifs, cargando, marcarLeida, marcarTodas } = notificacionesApi
  const [seleccionada, setSeleccionada] = useState(null)

  if (cargando) return <Spinner className="mt-20" />

  const hayNoLeidas = notifs.some((n) => !n.leida)
  // orden (timestamp numérico) en vez de fecha.localeCompare: desde que hay
  // dos fuentes, fecha puede ser 'YYYY-MM-DD' (calculadas) o datetime local
  // ya convertido (servidor) — comparar por string mezclaría mal los formatos.
  const ordenadas = [...notifs].sort((a, b) => {
    if (a.leida !== b.leida) return a.leida ? 1 : -1
    return b.orden - a.orden
  })

  // Si tiene ctaRuta navega directo (todos los tipos actuales la tienen); el
  // modal queda como respaldo para un futuro tipo 'general' sin ruta propia.
  function abrir(n) {
    marcarLeida(n)
    if (n.ctaRuta) {
      navigate(n.ctaRuta)
    } else {
      setSeleccionada(n)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Notificaciones</h1>
        {hayNoLeidas && (
          <button type="button" onClick={marcarTodas} className="text-xs font-medium text-primary">
            Marcar todas
          </button>
        )}
      </div>

      {ordenadas.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-8">No tenés notificaciones por ahora.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-2">
          <ul className="divide-y divide-gray-100">
            {ordenadas.map((n) => {
              const info = infoTipoNotificacion(n.tipo)
              const Icon = ICONOS_TIPO[info.icono] ?? Bell
              return (
                <li
                  key={n.id}
                  onClick={() => abrir(n)}
                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    n.leida ? 'hover:bg-gray-50' : 'bg-primary-light'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${info.classes}`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {!n.leida && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                      <p className="text-sm font-medium text-gray-800 truncate">{n.titulo}</p>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{n.mensaje}</p>
                  </div>
                  <span className="text-[11px] text-gray-400 shrink-0 mt-0.5">{formatFechaRelativa(n.fecha)}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <Modal
        isOpen={seleccionada !== null}
        onClose={() => setSeleccionada(null)}
        title={infoTipoNotificacion(seleccionada?.tipo).label}
        size="sm"
      >
        {seleccionada && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">{seleccionada.titulo}</p>
              <p className="text-sm text-gray-600 mt-1">{seleccionada.mensaje}</p>
              <p className="text-xs text-gray-400 mt-2">{formatFechaRelativa(seleccionada.fecha)}</p>
            </div>
            {seleccionada.ctaRuta && (
              <Button variant="primary" className="w-full justify-center" onClick={() => navigate(seleccionada.ctaRuta)}>
                Ver más
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
