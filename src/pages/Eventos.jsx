import { Link } from 'react-router-dom'
import { PartyPopper } from 'lucide-react'
import Skeleton from '../components/ui/Skeleton'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { useEventos } from '../hooks/useEventos'
import { formatFecha, infoTipoEvento } from '../utils/format'

export default function Eventos() {
  const { eventos, cargando } = useEventos()

  if (cargando) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Eventos</h1>

      {eventos.length === 0 ? (
        <EmptyState
          icon={PartyPopper}
          title="No hay eventos próximos"
          description="Todavía no hay eventos cargados. Volvé a revisar más adelante."
        />
      ) : (
        <ul className="space-y-3">
          {eventos.map((evento) => {
            const { label, color } = infoTipoEvento(evento.tipo)
            return (
              <li key={evento.id}>
                <Link
                  to={`/eventos/${evento.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 shadow-card p-4 hover:shadow-card-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-800">{evento.nombre}</p>
                    <Badge color={color}>{label}</Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatFecha(evento.fecha)}{evento.lugar ? ` · ${evento.lugar}` : ''}
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
