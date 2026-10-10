import { useCallback, useContext, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Wallet, CalendarCheck2, CheckCircle2, AlertTriangle } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Skeleton from '../components/ui/Skeleton'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import PagoOnlineHoja from '../components/PagoOnlineHoja'
import ComprobanteModal, { IconoMetodoPago } from '../components/ComprobanteModal'
import { AlumnoActivoContext } from '../context/AlumnoActivoContext'
import { useCargos } from '../hooks/useCargos'
import { usePagoOnline } from '../hooks/usePagoOnline'
import { useToast } from '../context/ToastContext'
import { crearOrdenPagoCuota } from '../api/client'
import { formatMoneda, formatFecha, formatMesLabel, fechaLocalDeDatetime, infoEstadoCuota, infoMetodoPago, diasHasta } from '../utils/format'

function BadgeCuota({ cuota }) {
  const { label } = infoEstadoCuota(cuota.estado)
  const color = { PENDIENTE: 'yellow', EN_MORA: 'red', PAGO_PARCIAL: 'blue' }[cuota.estado] ?? 'gray'
  return <Badge color={color}>{label}</Badge>
}

// Lo que separa un error "de verdad" (mostrar la hoja con el mensaje) de un
// error que se resuelve solo (409: la cuota ya estaba saldada por otra vía
// — la secretaría la cobró en efectivo mientras la hoja estaba abierta, por
// ejemplo — ahí no hace falta ninguna explicación, solo refrescar la
// lista para que la cuota deje de aparecer como pendiente).
function esCuotaYaSaldada(error) {
  return error?.status === 409
}

export default function Pagos() {
  const { alumnoActivo } = useContext(AlumnoActivoContext)
  const { notificacionesApi } = useOutletContext()
  const { cuentaCorriente, pagos, cargando, error, recargar } = useCargos(alumnoActivo?.alumno_id)
  const toast = useToast()
  const [pagoComprobante, setPagoComprobante] = useState(null)

  const { recargar: recargarNotificaciones } = notificacionesApi

  // Pagado: se recarga la cuenta y los pagos y se muestra el comprobante.
  // Si la cuota quedó con saldo (la mora siguió corriendo entre crear la
  // orden y que Mercado Pago acreditara, y el pago ya no alcanza a cubrir
  // el nuevo total) no es un éxito simple: se avisa el saldo que falta y la
  // cuota se deja pendiente de vuelta (con su botón "Pagar" normal — no hay
  // ninguna orden activa para "retomar", el pago que se hizo ya se acreditó).
  const onPagado = useCallback((cuotaId, ordenPagada) => {
    recargar().then(({ cuentaCorriente: cc, pagos: pagosFrescos }) => {
      const noAnulados = pagosFrescos.filter((p) => !p.anulado)
      const nuevo = noAnulados.length > 0
        ? noAnulados.reduce((mas, p) => (p.fecha_pago > mas.fecha_pago ? p : mas))
        : null
      if (nuevo) setPagoComprobante(nuevo)

      const cuotaConSaldo = cc?.cuotas_pendientes?.find((c) => c.id === cuotaId)
      if (cuotaConSaldo && Number(cuotaConSaldo.saldo_pendiente) > 0) {
        const porMora = Number(cuotaConSaldo.recargo_mora) > 0 ? ' por recargo por mora' : ''
        toast(
          `Recibimos tu pago de ${formatMoneda(ordenPagada.monto)}. Quedó un saldo de ${formatMoneda(cuotaConSaldo.saldo_pendiente)}${porMora}.`,
          'info',
        )
      } else {
        toast('¡Pago acreditado! Ya figura en tu cuenta.', 'success')
      }
    })
    recargarNotificaciones()
  }, [recargar, toast, recargarNotificaciones])

  const crearOrden = useCallback(
    (cuotaId) => crearOrdenPagoCuota(alumnoActivo?.alumno_id, cuotaId),
    [alumnoActivo?.alumno_id],
  )
  const pagoOnline = usePagoOnline(alumnoActivo?.alumno_id, 'cuota', crearOrden, onPagado)
  const { fase, orden, pendientes, error: errorPago, cerrarHoja } = pagoOnline

  // 409: no se le pide nada a la familia, se refresca la lista sola.
  useEffect(() => {
    if (fase !== 'error' || !esCuotaYaSaldada(errorPago)) return
    toast('Esa cuota ya estaba saldada.', 'info')
    recargar()
    cerrarHoja()
  }, [fase, errorPago])

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

  const cuotasPendientes = [...(cuentaCorriente?.cuotas_pendientes ?? [])]
    .sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento))
  const pendienteTotal = cuentaCorriente?.total_exigible ?? 0

  const cuotaDelResumen = cuotasPendientes.find((c) => c.id === pagoOnline.conceptoId)
  const vencePronto = cuotaDelResumen && diasHasta(cuotaDelResumen.fecha_vencimiento) >= 0 && diasHasta(cuotaDelResumen.fecha_vencimiento) <= 3

  const pagosNoAnulados = pagos.filter((p) => !p.anulado)
  const ultimoPago = pagosNoAnulados.length > 0
    ? pagosNoAnulados.reduce((mas, p) => (p.fecha_pago > mas.fecha_pago ? p : mas))
    : null

  const historial = [...pagos].sort((a, b) => b.fecha_pago.localeCompare(a.fecha_pago))

  const hojaAbierta = fase !== 'idle' && !(fase === 'error' && esCuotaYaSaldada(errorPago))

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
            {ultimoPago ? formatFecha(fechaLocalDeDatetime(ultimoPago.fecha_pago), { conAnio: false }) : '—'}
          </p>
          <p className="text-xs text-gray-400">Último pago</p>
        </div>
      </div>

      {/* Cuotas pendientes */}
      {cuotasPendientes.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="¡Estás al día!"
          description="No tenés cuotas pendientes."
        />
      ) : (
        <div className="space-y-3">
          {cuotasPendientes.map((cuota) => (
            <div key={cuota.id} className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">Cuota de {formatMesLabel(cuota.periodo.slice(0, 7))}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Vence: {formatFecha(cuota.fecha_vencimiento)}</p>
                </div>
                <BadgeCuota cuota={cuota} />
              </div>
              <p className="text-2xl font-bold text-gray-800">{formatMoneda(cuota.saldo_pendiente)}</p>
              <Button
                variant="primary"
                className="w-full justify-center"
                disabled={fase === 'creando'}
                onClick={() => pagoOnline.abrirPago(cuota.id)}
              >
                {pendientes.has(cuota.id) ? 'Retomar pago' : 'Pagar'}
              </Button>
            </div>
          ))}
        </div>
      )}

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
                    Pagado el {formatFecha(fechaLocalDeDatetime(pago.fecha_pago), { conAnio: false })}
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

      <PagoOnlineHoja
        abierta={hojaAbierta}
        onClose={cerrarHoja}
        titulo="Pagar cuota"
        nombrePantalla="Pagos"
        fase={fase}
        concepto="Importe de la cuota"
        importe={orden?.importe}
        recargo={orden?.recargo}
        total={orden?.monto}
        checkoutUrl={orden?.checkout_url}
        aviso={vencePronto ? 'Si el pago se acredita después del vencimiento, se suma el recargo por mora.' : null}
        error={errorPago}
        onConfirmarSalida={pagoOnline.confirmarSalida}
        onRevisarAhora={pagoOnline.revisarAhora}
      />
    </div>
  )
}
