import { useContext, useState } from 'react'
import { AlertTriangle, Shirt, Download } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import { IconoMetodoPago } from '../components/ComprobanteModal'
import { AlumnoActivoContext } from '../context/AlumnoActivoContext'
import { useVestuario } from '../hooks/useVestuario'
import { useToast } from '../context/ToastContext'
import { descargarRecibo } from '../api/client'
import { formatFecha, formatMoneda, infoEstadoCuotaVestuario, infoMetodoPago } from '../utils/format'

function BadgeCuotaVestuario({ cuota }) {
  const { label } = infoEstadoCuotaVestuario(cuota.estado)
  const color = { PENDIENTE: 'yellow', PAGO_PARCIAL: 'blue', PAGADO: 'green' }[cuota.estado] ?? 'gray'
  return <Badge color={color}>{label}</Badge>
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
  const { cuentas, cargando, error } = useVestuario(alumnoActivo?.alumno_id)
  const toast = useToast()
  const [descargando, setDescargando] = useState(null)

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
                    <ul className="space-y-1">
                      {cuenta.cuotas.map((cuota) => (
                        <li key={cuota.numero_cuota} className="flex items-center justify-between gap-2 p-2.5 rounded-xl">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">{cuota.concepto}</p>
                            <p className="text-xs text-gray-400">Vence: {formatFecha(cuota.fecha_vencimiento)}</p>
                          </div>
                          <div className="text-right shrink-0 space-y-1">
                            <p className="text-sm font-semibold text-gray-800">{formatMoneda(cuota.saldo_pendiente)}</p>
                            <BadgeCuotaVestuario cuota={cuota} />
                          </div>
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
                              {formatFecha(pago.fecha_pago.split('T')[0], { conAnio: false })}
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
    </div>
  )
}
