import { useState } from 'react'
import { CheckCircle2, Banknote, Landmark, CreditCard, Download } from 'lucide-react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { useToast } from '../context/ToastContext'
import { descargarRecibo } from '../api/client'
import { formatMoneda, formatFecha, infoMetodoPago } from '../utils/format'

const ICONOS_METODO = { banknote: Banknote, landmark: Landmark, 'credit-card': CreditCard }

export function IconoMetodoPago({ metodo, size = 14, className = '' }) {
  const { icono } = infoMetodoPago(metodo)
  const Icon = ICONOS_METODO[icono] ?? Banknote
  return <Icon size={size} className={className} />
}

async function descargarComprobante(obtenerBlob, pago, toast, setDescargando) {
  setDescargando(true)
  try {
    const blob = await obtenerBlob(pago)
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
    setDescargando(false)
  }
}

// `alumno` es opcional: lo usan Pagos.jsx/Vestuario.jsx (comprobante de una
// hija puntual, muestra su nombre) pero no MisEntradas.jsx (el pago es de
// toda la familia, no hay una sola alumna a la que atribuírselo).
// `obtenerBlob` también es opcional — default: la ruta por alumna
// (descargarRecibo), igual que antes de agregar esta prop. MisEntradas.jsx
// inyecta descargarReciboEntradas (sin alumnoId, recibo por familia).
export default function ComprobanteModal({ isOpen, onClose, pago, alumno, obtenerBlob = (p) => descargarRecibo(alumno.alumno_id, p.id) }) {
  const toast = useToast()
  const [descargando, setDescargando] = useState(false)
  if (!pago) return null
  const { label: metodoLabel } = infoMetodoPago(pago.medio_pago)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Comprobante" size="sm">
      <div className="flex flex-col items-center text-center gap-1 mb-5">
        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
          <CheckCircle2 size={28} className="text-emerald-500" />
        </div>
        <p className="text-base font-semibold text-gray-800">¡Pago confirmado!</p>
        <p className="text-xs text-gray-400">N.º {pago.comprobante_numero ?? '—'}</p>
      </div>

      <dl className="space-y-3 text-sm">
        {alumno && (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-gray-400">Alumno/a</dt>
            <dd className="font-medium text-gray-800 text-right">{alumno.nombre_completo ?? '—'}</dd>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <dt className="text-gray-400">Concepto</dt>
          <dd className="font-medium text-gray-800 text-right">{pago.concepto}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-gray-400">Método</dt>
          <dd className="font-medium text-gray-800 flex items-center gap-1.5">
            <IconoMetodoPago metodo={pago.medio_pago} className="text-gray-400" />
            {metodoLabel}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-gray-400">Fecha</dt>
          <dd className="font-medium text-gray-800">{formatFecha(pago.fecha_pago.split('T')[0])}</dd>
        </div>
      </dl>

      <div className="border-t border-gray-100 mt-4 pt-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">Total</span>
        <span className="text-xl font-bold text-gray-800">{formatMoneda(pago.monto)}</span>
      </div>

      <Button
        variant="primary"
        className="w-full justify-center mt-5"
        disabled={descargando}
        onClick={() => descargarComprobante(obtenerBlob, pago, toast, setDescargando)}
      >
        <Download size={16} />
        {descargando ? 'Descargando...' : 'Descargar recibo'}
      </Button>
    </Modal>
  )
}
