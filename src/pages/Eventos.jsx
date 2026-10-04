import { Link } from 'react-router-dom'
import { PartyPopper, Shirt, ChevronRight } from 'lucide-react'
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

      {/* No se puede filtrar vestuario por evento (es de la alumna en
          general, no de un evento puntual) — por eso vive acá, como
          sección aparte de la cartelera, y no adentro de EventoDetalle.jsx:
          ponerlo ahí insinuaría un vínculo con ese evento que no existe. */}
      <Link
        to="/vestuario"
        className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-card p-4 hover:shadow-card-md transition-shadow"
      >
        <div className="p-2.5 rounded-xl bg-primary-light text-primary shrink-0">
          <Shirt size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800">Vestuario</p>
          <p className="text-xs text-gray-400">Cuotas y pagos de disfraces/trajes</p>
        </div>
        <ChevronRight size={16} className="text-gray-300 shrink-0" />
      </Link>

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
