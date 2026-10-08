import { Link } from 'react-router-dom'
import { AlertTriangle, Loader2 } from 'lucide-react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Spinner from './ui/Spinner'
import { formatMoneda } from '../utils/format'

// Hoja compartida por Pagos.jsx (cuotas) y Vestuario.jsx (cuotas de
// vestuario): confirmación de pago, espera de Mercado Pago, y el mapeo de
// errores que no son silenciosos (422 falta de email, 502/503, lo que sea
// sin manejo especial). Los errores "ya está pagado" / "no encontrado" NO
// llegan acá: cada pantalla los intercepta antes (toast + recarga) y nunca
// abre la hoja para esos — por eso esta hoja no sabe nada de 409 ni 404.
//
// `importe`/`recargo`/`total` van en pesos (no formateados): la hoja los
// pasa por formatMoneda(). `recargo` solo se muestra si es mayor a 0.
// `aviso` es opcional (el de "vence pronto" de cuotas; vestuario no manda
// ninguno, no tiene mora).
export default function PagoOnlineHoja({
  abierta, onClose, titulo, fase, concepto, importe, recargo, total, checkoutUrl,
  aviso, error, onConfirmarSalida, onRevisarAhora, nombrePantalla,
}) {
  return (
    <Modal isOpen={abierta} onClose={onClose} title={titulo} size="sm">
      {fase === 'creando' && (
        <div className="flex flex-col items-center gap-3 py-6">
          <Spinner />
          <p className="text-sm text-gray-500">Generando el enlace de pago…</p>
        </div>
      )}

      {fase === 'resumen' && (
        <div className="space-y-4">
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-400">{concepto}</dt>
              <dd className="font-medium text-gray-800">{formatMoneda(importe)}</dd>
            </div>
            {Number(recargo) > 0 && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-gray-400">Recargo Mercado Pago</dt>
                <dd className="font-medium text-gray-800">{formatMoneda(recargo)}</dd>
              </div>
            )}
            <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-2">
              <dt className="text-gray-500 font-medium">Total</dt>
              <dd className="text-lg font-bold text-gray-800">{formatMoneda(total)}</dd>
            </div>
          </dl>
          <p className="text-xs text-gray-400">Se paga el saldo completo de la cuota en un solo pago.</p>
          {aviso && <p className="text-xs text-amber-600">{aviso}</p>}
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onConfirmarSalida}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark hover:shadow-card-md transition-all duration-150"
          >
            Ir a Mercado Pago
          </a>
        </div>
      )}

      {fase === 'esperando' && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Loader2 size={28} className="text-primary animate-spin" />
          <p className="text-sm text-gray-500">Esperando la confirmación de Mercado Pago…</p>
          <Button variant="secondary" onClick={onRevisarAhora}>
            Ya pagué, revisar ahora
          </Button>
        </div>
      )}

      {fase === 'sin_confirmar' && (
        <div className="space-y-3 text-center py-2">
          <AlertTriangle size={28} className="text-amber-500 mx-auto" />
          <p className="text-sm text-gray-600">
            Todavía no vemos tu pago. Si ya pagaste, puede demorar unos minutos. Lo vamos a revisar cuando vuelvas a abrir {nombrePantalla}.
          </p>
          <Button variant="secondary" className="w-full justify-center" onClick={onRevisarAhora}>
            Revisar ahora
          </Button>
        </div>
      )}

      {fase === 'conflicto' && (
        <div className="space-y-3 text-center py-2">
          <AlertTriangle size={28} className="text-red-500 mx-auto" />
          <p className="text-sm text-gray-600">
            Mercado Pago confirmó tu pago, pero no lo pudimos acreditar solo. Avisale a la academia para que lo revisen a mano.
          </p>
        </div>
      )}

      {fase === 'error' && error && (
        <div className="space-y-3 text-center py-2">
          <AlertTriangle size={28} className="text-red-500 mx-auto" />
          <p className="text-sm text-gray-600">{error.mensaje}</p>
          {error.status === 422 && (
            <Link to="/perfil" onClick={onClose} className="text-sm font-medium text-primary hover:underline">
              Ir a Perfil a cargarlo
            </Link>
          )}
        </div>
      )}
    </Modal>
  )
}
