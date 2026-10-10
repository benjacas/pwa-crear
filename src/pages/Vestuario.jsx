import { useCallback, useContext, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { AlertTriangle, Shirt, Download } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Skeleton from '../components/ui/Skeleton'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import PagoOnlineHoja from '../components/PagoOnlineHoja'
import ComprobanteModal, { IconoMetodoPago } from '../components/ComprobanteModal'
import { AlumnoActivoContext } from '../context/AlumnoActivoContext'
import { useVestuario } from '../hooks/useVestuario'
import { usePagoOnline } from '../hooks/usePagoOnline'
import { useToast } from '../context/ToastContext'
import { crearOrdenPagoVestuario, descargarRecibo } from '../api/client'
import { formatFecha, formatMoneda, fechaLocalDeDatetime, infoEstadoCuotaVestuario, infoMetodoPago } from '../utils/format'

function BadgeCuotaVestuario({ cuota }) {
  const { label } = infoEstadoCuotaVestuario(cuota.estado)
  const color = { PENDIENTE: 'yellow', PAGO_PARCIAL: 'blue', PAGADO: 'green' }[cuota.estado] ?? 'gray'
  return <Badge color={color}>{label}</Badge>
}

// El vestuario no tiene mora (confirmado contra vestuario_service.py, ver
// utils/format.js) — por eso acá no hay ni aviso de vencimiento próximo ni
// mención de recargo por mora en ningún mensaje, a diferencia de Pagos.jsx.
function esCargoYaPagado(error) {
  return error?.status === 409
}

function esCargoNoEncontrado(error) {
  return error?.status === 404
}

// El endpoint de recibo (/pagos/{id}/recibo.pdf) acepta tanto pagos de
// cuota como de vestuario (ver PortalService.recibo() / generar_recibo()
// en el backend, confirmado leyendo el código — no es un botón sobrante:
// genera un PDF real con el concepto "Vestuario: {descripción} - cuota
// N/M"). Mismo patrón de descarga que ComprobanteModal.jsx.
async function descargar(alumnoId, pago, toast, setDescargando) {
  setDescargando(pago.id)
  try {
    const blob = await descargarRecibo(alumnoId, pago.id)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${pago.comprobante_numero ?? 'comprobante'}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch {
    toast('No se pudo descargar el recibo', 'error')
  } finally {
    setDescargando(null)
  }
}

export default function Vestuario() {
  const { alumnoActivo } = useContext(AlumnoActivoContext)
  const { notificacionesApi } = useOutletContext()
  const { cuentas, cargando, error, recargar } = useVestuario(alumnoActivo?.alumno_id)
  const toast = useToast()
  const [descargando, setDescargando] = useState(null)
  const [pagoComprobante, setPagoComprobante] = useState(null)

  const { recargar: recargarNotificaciones } = notificacionesApi

  // Pagado: recarga el vestuario, muestra el comprobante y decide el toast
  // según cómo haya quedado la cuenta — mismo patrón que Pagos.jsx (recarga
  // + comprobante + toast), con dos variantes propias de vestuario: si la
  // cuenta quedó lista para entrega, o si la cuota quedó con saldo (sin
  // mencionar mora en ningún caso, acá no existe).
  const onPagado = useCallback((cargoId, ordenPagada) => {
    recargar().then(({ cuentas: cuentasFrescas }) => {
      const todosPagos = cuentasFrescas.flatMap((c) => c.pagos)
      const noAnulados = todosPagos.filter((p) => !p.anulado)
      const nuevo = noAnulados.length > 0
        ? noAnulados.reduce((mas, p) => (p.fecha_pago > mas.fecha_pago ? p : mas))
        : null
      if (nuevo) setPagoComprobante(nuevo)

      const cuenta = cuentasFrescas.find((c) => c.cuotas.some((q) => q.id === cargoId))
      const cuotaFresca = cuenta?.cuotas.find((q) => q.id === cargoId)
      if (cuenta?.listo_para_entrega) {
        toast(`Con este pago el vestuario de ${cuenta.descripcion} quedó completo y listo para entrega.`, 'success')
      } else if (cuotaFresca && Number(cuotaFresca.saldo_pendiente) > 0) {
        toast(`Recibimos tu pago de ${formatMoneda(ordenPagada.monto)}. Quedó un saldo de ${formatMoneda(cuotaFresca.saldo_pendiente)}.`, 'info')
      } else {
        toast('¡Pago acreditado! Ya figura en tu cuenta.', 'success')
      }
    })
    recargarNotificaciones()
  }, [recargar, toast, recargarNotificaciones])

  const crearOrden = useCallback(
    (cargoId) => crearOrdenPagoVestuario(alumnoActivo?.alumno_id, cargoId),
    [alumnoActivo?.alumno_id],
  )
  const pagoOnline = usePagoOnline(alumnoActivo?.alumno_id, 'vestuario', crearOrden, onPagado)
  const { fase, orden, pendientes, error: errorPago, cerrarHoja } = pagoOnline

  // 409 (ya pagada) y 404 (no encontrada): nada que explicarle a la
  // familia, se refresca la lista sola — mismo patrón que el 409 de
  // Pagos.jsx.
  useEffect(() => {
    if (fase !== 'error') return
    if (esCargoYaPagado(errorPago)) {
      toast('Esta cuota ya está pagada.', 'info')
      recargar()
      cerrarHoja()
    } else if (esCargoNoEncontrado(errorPago)) {
      toast('No pudimos encontrar esta cuota.', 'info')
      recargar()
      cerrarHoja()
    }
  }, [fase, errorPago])

  if (cargando) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No se pudo cargar el vestuario"
        description="Hubo un problema al conectar con el servidor. Probá de nuevo en un momento."
      />
    )
  }

  const cuotaDelResumen = cuentas.flatMap((c) => c.cuotas).find((q) => q.id === pagoOnline.conceptoId)
  const errorEsSilencioso = fase === 'error' && (esCargoYaPagado(errorPago) || esCargoNoEncontrado(errorPago))
  const hojaAbierta = fase !== 'idle' && !errorEsSilencioso

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Vestuario</h1>

      {cuentas.length === 0 ? (
        <EmptyState
          icon={Shirt}
          title="Sin vestuario cargado"
          description={`Todavía no hay vestuario cargado para ${alumnoActivo?.nombre_completo ?? 'esta alumna'}.`}
        />
      ) : (
        <div className="space-y-4">
          {cuentas.map((cuenta) => {
            const pagado = cuenta.costo_total - cuenta.saldo_total
            const pct = cuenta.costo_total > 0 ? Math.min(100, Math.round((pagado / cuenta.costo_total) * 100)) : 100
            return (
              <div key={cuenta.id} className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-800">{cuenta.descripcion}</p>
                  {cuenta.listo_para_entrega && <Badge color="green">Listo para entrega</Badge>}
                </div>

                <div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {formatMoneda(pagado)} de {formatMoneda(cuenta.costo_total)} pagado
                  </p>
                </div>

                {cuenta.cuotas.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Cuotas</h3>
                    <ul className="space-y-2">
                      {cuenta.cuotas.map((cuota) => (
                        <li key={cuota.id} className="p-2.5 rounded-xl space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-700 truncate">{cuota.concepto}</p>
                              <p className="text-xs text-gray-400">Vence: {formatFecha(cuota.fecha_vencimiento)}</p>
                            </div>
                            <div className="text-right shrink-0 space-y-1">
                              <p className="text-sm font-semibold text-gray-800">{formatMoneda(cuota.saldo_pendiente)}</p>
                              <BadgeCuotaVestuario cuota={cuota} />
                            </div>
                          </div>
                          {cuota.estado !== 'PAGADO' && Number(cuota.saldo_pendiente) > 0 && (
                            <Button
                              variant="primary"
                              size="sm"
                              className="w-full justify-center"
                              disabled={fase === 'creando'}
                              onClick={() => pagoOnline.abrirPago(cuota.id)}
                            >
                              {pendientes.has(cuota.id) ? 'Retomar pago' : 'Pagar'}
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {cuenta.pagos.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pagos</h3>
                    <ul className="space-y-1">
                      {cuenta.pagos.map((pago) => (
                        <li key={pago.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">{pago.concepto}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              {formatFecha(fechaLocalDeDatetime(pago.fecha_pago), { conAnio: false })}
                              <span className="mx-0.5">·</span>
                              <IconoMetodoPago metodo={pago.medio_pago} size={12} className="text-gray-400" />
                              {infoMetodoPago(pago.medio_pago).label}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {pago.anulado ? (
                              <Badge color="red">Anulado</Badge>
                            ) : (
                              <button
                                type="button"
                                onClick={() => descargar(alumnoActivo.alumno_id, pago, toast, setDescargando)}
                                disabled={descargando === pago.id}
                                className="p-1.5 rounded-lg text-gray-400 hover:bg-primary-light hover:text-primary transition-colors disabled:opacity-50"
                                aria-label="Descargar recibo"
                              >
                                <Download size={14} />
                              </button>
                            )}
                            <p className="text-sm font-semibold text-gray-800">{formatMoneda(pago.monto)}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ComprobanteModal
        isOpen={pagoComprobante !== null}
        onClose={() => setPagoComprobante(null)}
        pago={pagoComprobante}
        alumno={alumnoActivo}
      />

      <PagoOnlineHoja
        abierta={hojaAbierta}
        onClose={cerrarHoja}
        titulo="Pagar vestuario"
        nombrePantalla="Vestuario"
        fase={fase}
        concepto={cuotaDelResumen?.concepto ?? 'Importe de la cuota'}
        importe={orden?.importe}
        recargo={orden?.recargo}
        total={orden?.monto}
        checkoutUrl={orden?.checkout_url}
        error={errorPago}
        onConfirmarSalida={pagoOnline.confirmarSalida}
        onRevisarAhora={pagoOnline.revisarAhora}
      />
    </div>
  )
}
