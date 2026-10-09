import { useNavigate } from 'react-router-dom'
import { Ticket, CheckCircle2, Download, Armchair } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import QRCode from '../components/QRCode'
import { useEntradas } from '../hooks/useEntradas'
import { descargarEntradaPng } from '../utils/descargarEntrada'
import { urlEntrada } from '../utils/qr'
import { formatFecha, formatHora, formatMoneda, hoyLocalISO, motivoButacas } from '../utils/format'

const ESTADOS_COMPRA = {
  PENDIENTE: { label: 'Pendiente de pago', color: 'yellow' },
  PAGADA: { label: 'Pagada', color: 'green' },
  // El backend filtra las compras ANULADA antes de que lleguen acá — nunca
  // debería aparecer, pero se contempla el label por si el filtro cambia.
  ANULADA: { label: 'Anulada', color: 'red' },
}

const ESTADOS_CARGO = {
  PENDIENTE: { label: 'Pendiente', color: 'yellow' },
  PAGADO: { label: 'Pagado', color: 'green' },
}

function infoEstadoCompra(estado) {
  return ESTADOS_COMPRA[estado] ?? { label: estado, color: 'gray' }
}

function infoEstadoCargo(estado) {
  return ESTADOS_CARGO[estado] ?? { label: estado, color: 'gray' }
}

function FilaEntrada({ compra, entrada }) {
  const anulada = compra.estado === 'ANULADA'

  if (entrada.usada) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50">
        <CheckCircle2 size={16} className="text-gray-400 shrink-0" />
        <p className="text-sm text-gray-500">Entrada {entrada.numero}: ya ingresó</p>
      </div>
    )
  }

  if (anulada) {
    return (
      <div className="p-3 rounded-xl bg-gray-50">
        <p className="text-sm text-gray-500">Entrada {entrada.numero}: anulada</p>
      </div>
    )
  }

  if (!entrada.codigo || !entrada.butaca) {
    return (
      <div className="p-3 rounded-xl bg-amber-50">
        <p className="text-sm text-amber-700">
          Entrada {entrada.numero}: {compra.motivo_bloqueo ?? 'Todavía no se eligieron las butacas.'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-xl border border-gray-100">
      <QRCode texto={urlEntrada(entrada.codigo)} tamano={160} />
      <p className="text-sm font-semibold text-gray-800">
        Fila {entrada.butaca.fila} · Butaca {entrada.butaca.numero}
      </p>
      <Button
        variant="secondary"
        size="sm"
        className="w-full justify-center"
        onClick={() => descargarEntradaPng(compra, entrada)}
      >
        <Download size={14} />
        Descargar entrada
      </Button>
    </div>
  )
}

function AccionButacas({ compra }) {
  const navigate = useNavigate()
  const irAElegir = () => navigate(`/mis-entradas/${compra.id}/butacas`)

  if (compra.puede_elegir_butacas) {
    return (
      <Button variant="primary" className="w-full justify-center" onClick={irAElegir}>
        <Armchair size={16} />
        Elegir butacas
      </Button>
    )
  }

  if (compra.puede_cambiar_butacas) {
    return (
      <div className="space-y-1.5">
        <Button variant="secondary" className="w-full justify-center" onClick={irAElegir}>
          <Armchair size={16} />
          Cambiar butacas
        </Button>
        {compra.cambios_restantes > 0 && (
          <p className="text-xs text-gray-400 text-center">
            Te queda {compra.cambios_restantes} cambio de butacas.
          </p>
        )}
      </div>
    )
  }

  const motivo = motivoButacas(compra)
  return motivo ? <p className="text-xs text-gray-400">{motivo}</p> : null
}

function TarjetaCompra({ compra }) {
  const { label: labelCompra, color: colorCompra } = infoEstadoCompra(compra.estado)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{compra.evento.nombre}</p>
          {compra.funcion ? (
            <p className="text-xs text-gray-400 mt-0.5">
              {formatFecha(compra.funcion.fecha)}
              {compra.funcion.hora ? ` · ${formatHora(compra.funcion.hora)} hs` : ''}
              {' · '}{compra.funcion.sala_nombre}
            </p>
          ) : (
            <p className="text-xs text-amber-600 mt-0.5">La academia todavía no te asignó una función.</p>
          )}
        </div>
        <Badge color={colorCompra}>{labelCompra}</Badge>
      </div>

      {compra.cargos.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Cargos</h3>
          <ul className="space-y-1">
            {compra.cargos.map((cargo) => {
              const { label, color } = infoEstadoCargo(cargo.estado)
              return (
                <li key={cargo.numero} className="flex items-center justify-between gap-2 py-1 text-sm">
                  <div className="min-w-0">
                    <span className="text-gray-700">Cuota {cargo.numero}</span>
                    {cargo.fecha_vencimiento && (
                      <span className="text-gray-400"> · vence {formatFecha(cargo.fecha_vencimiento, { conAnio: false })}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {cargo.importe != null && <span className="font-medium text-gray-800">{formatMoneda(cargo.importe)}</span>}
                    <Badge color={color}>{label}</Badge>
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="text-xs text-gray-400 mt-2">El pago se registra en la academia.</p>
        </div>
      )}

      {compra.entradas.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Entradas</h3>
          <div className="space-y-2">
            {compra.entradas.map((entrada) => (
              <FilaEntrada key={entrada.numero} compra={compra} entrada={entrada} />
            ))}
          </div>
        </div>
      )}

      <AccionButacas compra={compra} />
    </div>
  )
}

export default function MisEntradas() {
  const { compras, cargando, error } = useEntradas()

  if (cargando) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={Ticket}
        title="No pudimos cargar tus entradas"
        description="Si ya descargaste tu entrada, mostrala desde la galería."
      />
    )
  }

  if (compras.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold text-gray-800 mb-4">Mis entradas</h1>
        <EmptyState icon={Ticket} title="Todavía no tenés entradas" description="Las compras que hagas van a aparecer acá." />
      </div>
    )
  }

  const hoy = hoyLocalISO()
  const fechaDeCompra = (compra) => compra.funcion?.fecha ?? compra.evento.fecha
  const proximas = compras.filter((c) => fechaDeCompra(c) >= hoy)
  const pasadas = compras.filter((c) => fechaDeCompra(c) < hoy)

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Mis entradas</h1>

      {proximas.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500">Próximas</h2>
          {proximas.map((compra) => <TarjetaCompra key={compra.id} compra={compra} />)}
        </div>
      )}

      {pasadas.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500">Pasadas</h2>
          {pasadas.map((compra) => <TarjetaCompra key={compra.id} compra={compra} />)}
        </div>
      )}
    </div>
  )
}
