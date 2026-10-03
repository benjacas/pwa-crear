import { useContext, useState } from 'react'
import { Wallet, CalendarCheck2, CheckCircle2, AlertTriangle } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Skeleton from '../components/ui/Skeleton'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import ComprobanteModal, { IconoMetodoPago } from '../components/ComprobanteModal'
import { AlumnoActivoContext } from '../context/AlumnoActivoContext'
import { useCargos } from '../hooks/useCargos'
import { formatMoneda, formatFecha, formatMesLabel, infoEstadoCuota, infoMetodoPago } from '../utils/format'

function BadgeCuota({ cuota }) {
  const { label } = infoEstadoCuota(cuota.estado)
  const color = { PENDIENTE: 'yellow', EN_MORA: 'red', PAGO_PARCIAL: 'blue' }[cuota.estado] ?? 'gray'
  return <Badge color={color}>{label}</Badge>
}

export default function Pagos() {
  const { alumnoActivo } = useContext(AlumnoActivoContext)
  const { cuentaCorriente, pagos, cargando, error } = useCargos(alumnoActivo?.alumno_id)
  const [pagoComprobante, setPagoComprobante] = useState(null)

  if (cargando) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No se pudieron cargar los pagos"
        description="Hubo un problema al conectar con el servidor. Probá de nuevo en un momento."
      />
    )
  }

  const cuotasPendientes = cuentaCorriente?.cuotas_pendientes ?? []
  const pendienteTotal = cuentaCorriente?.total_exigible ?? 0

  const proximoPendiente = [...cuotasPendientes].sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento))[0]

  const pagosNoAnulados = pagos.filter((p) => !p.anulado)
  const ultimoPago = pagosNoAnulados.length > 0
    ? pagosNoAnulados.reduce((mas, p) => (p.fecha_pago > mas.fecha_pago ? p : mas))
    : null

  const historial = [...pagos].sort((a, b) => b.fecha_pago.localeCompare(a.fecha_pago))

  return (
    <div className="p-4 space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4">
          <div className="p-2 rounded-xl bg-amber-50 w-fit mb-2">
            <Wallet size={18} className="text-amber-500" />
          </div>
          <p className="text-lg font-bold text-gray-800 leading-tight">{formatMoneda(pendienteTotal)}</p>
          <p className="text-xs text-gray-400">Pendiente</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4">
          <div className="p-2 rounded-xl bg-emerald-50 w-fit mb-2">
            <CalendarCheck2 size={18} className="text-emerald-500" />
          </div>
          <p className="text-lg font-bold text-gray-800 leading-tight">
            {ultimoPago ? formatFecha(ultimoPago.fecha_pago.split('T')[0], { conAnio: false }) : '—'}
          </p>
          <p className="text-xs text-gray-400">Último pago</p>
        </div>
      </div>

      {/* Próximo cargo pendiente */}
      {pendienteTotal === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="¡Estás al día!"
          description="No tenés cuotas pendientes."
        />
      ) : proximoPendiente ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">Cuota de {formatMesLabel(proximoPendiente.periodo.slice(0, 7))}</p>
              <p className="text-xs text-gray-400 mt-0.5">Vence: {formatFecha(proximoPendiente.fecha_vencimiento)}</p>
            </div>
            <BadgeCuota cuota={proximoPendiente} />
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatMoneda(proximoPendiente.saldo_pendiente)}</p>
          <Button
            variant="primary"
            className="w-full justify-center"
            disabled
            title="Integración de pago pendiente"
          >
            Pagar
          </Button>
        </div>
      ) : null}

      {/* Historial */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Historial</h3>
        {historial.length === 0 ? (
          <p className="text-xs text-gray-400">Todavía no hay pagos registrados.</p>
        ) : (
          <ul className="space-y-1">
            {historial.map((pago) => (
              <li
                key={pago.id}
                onClick={() => setPagoComprobante(pago)}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl cursor-pointer hover:bg-primary-subtle transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{pago.concepto}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    Pagado el {formatFecha(pago.fecha_pago.split('T')[0], { conAnio: false })}
                    <span className="mx-0.5">·</span>
                    <IconoMetodoPago metodo={pago.medio_pago} size={12} className="text-gray-400" />
                    {infoMetodoPago(pago.medio_pago).label}
                  </p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <p className="text-sm font-semibold text-gray-800">{formatMoneda(pago.monto)}</p>
                  {pago.anulado && <Badge color="red">Anulado</Badge>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ComprobanteModal
        isOpen={pagoComprobante !== null}
        onClose={() => setPagoComprobante(null)}
        pago={pagoComprobante}
        alumno={alumnoActivo}
      />
    </div>
  )
}
