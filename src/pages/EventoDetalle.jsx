import { useParams } from 'react-router-dom'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import { useEventos } from '../hooks/useEventos'
import { formatFecha, infoTipoEvento } from '../utils/format'

// Reusa la lista de useEventos() (con desde=hoy) en vez de un fetch propio
// — /portal/eventos no tiene un GET por id, y esta pantalla solo se llega
// clickeando una tarjeta de la cartelera, así que el evento ya está ahí.
export default function EventoDetalle() {
  const { id } = useParams()
  const { eventos, cargando } = useEventos()

  if (cargando) return <Spinner className="mt-20" />

  const evento = eventos.find((e) => e.id === id)
  if (!evento) return <p className="p-4 text-sm text-gray-400">Evento no encontrado.</p>

  const { label, color } = infoTipoEvento(evento.tipo)

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-bold text-gray-800">{evento.nombre}</h1>
          <Badge color={color}>{label}</Badge>
        </div>
        <p className="text-sm text-gray-400 mt-1">{formatFecha(evento.fecha)}</p>
        {evento.lugar && <p className="text-sm text-gray-400">{evento.lugar}</p>}
      </div>

      {evento.descripcion && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <p className="text-sm text-gray-700 leading-relaxed">{evento.descripcion}</p>
        </div>
      )}
    </div>
  )
}
