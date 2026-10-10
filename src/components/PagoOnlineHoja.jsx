import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Loader2 } from 'lucide-react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Spinner from './ui/Spinner'
import { formatMoneda } from '../utils/format'

function formatRestante(ms) {
  const segundosTotales = Math.max(0, Math.ceil(ms / 1000))
  const minutos = Math.floor(segundosTotales / 60)
  const segundos = segundosTotales % 60
  return `${minutos}:${String(segundos).padStart(2, '0')}`
}

// Solo lo usa entradas (expiraAt): cuota/vestuario no vencen, nunca pasan
// esta prop. Matemática de milisegundos, no toISOString — no hace falta
// ninguna fecha calendario acá, solo "cuánto falta".
function CuentaRegresiva({ expiraAt }) {
  const [restanteMs, setRestanteMs] = useState(() => new Date(expiraAt).getTime() - Date.now())
  useEffect(() => {
    setRestanteMs(new Date(expiraAt).getTime() - Date.now())
    const id = setInterval(() => setRestanteMs(new Date(expiraAt).getTime() - Date.now()), 1000)
    return () => clearInterval(id)
  }, [expiraAt])
  if (restanteMs <= 0) return <p className="text-xs font-medium text-amber-600">La orden está por vencer…</p>
  return <p className="text-xs font-medium text-gray-500">Te quedan {formatRestante(restanteMs)}</p>
}

// Hoja compartida por Pagos.jsx (cuotas), Vestuario.jsx (cuotas de
// vestuario) y MisEntradas.jsx (cargos de entradas): confirmación de pago,
// espera de Mercado Pago, y el mapeo de errores que no son silenciosos (422
// falta de email, 502/503, lo que sea sin manejo especial). Los errores "ya
// está pagado" / "no encontrado" NO llegan acá: cada pantalla los
// intercepta antes (toast + recarga) y nunca abre la hoja para esos — por
// eso esta hoja no sabe nada de 409 ni 404.
//
// `importe`/`recargo`/`total` van en pesos (no formateados): la hoja los
// pasa por formatMoneda(). `recargo` solo se muestra si es mayor a 0.
// `aviso` es opcional (el de "vence pronto" de cuotas; vestuario no manda
// ninguno, no tiene mora).
//
// Props nuevas, todas opcionales (sin ellas el comportamiento es idéntico
// al de antes, así que Pagos.jsx/Vestuario.jsx no necesitan tocarse):
// - `detalle`: nodo con contexto extra arriba del detalle de importes (en
//   entradas: evento, función, "Cuota N de M", cantidad de entradas).
// - `textoPago`: reemplaza el texto fijo de abajo del detalle de importes
//   (entradas usa el aviso de los 15 minutos en vez de "se paga el saldo
//   completo...", que no aplica a una orden con vencimiento).
// - `expiraAt`: si viene, muestra la cuenta regresiva (resumen y esperando).
// - `onGenerarOtra`: botón de la fase 'vencida' (exclusiva de órdenes con
//   expiraAt — cuota/vestuario nunca llegan a esa fase).
export default function PagoOnlineHoja({
  abierta, onClose, titulo, fase, concepto, importe, recargo, total, checkoutUrl,
  aviso, error, onConfirmarSalida, onRevisarAhora, nombrePantalla,
  detalle, textoPago = 'Se paga el saldo completo de la cuota en un solo pago.', expiraAt, onGenerarOtra,
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
          {detalle}
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
          <p className="text-xs text-gray-400">{textoPago}</p>
          {aviso && <p className="text-xs text-amber-600">{aviso}</p>}
          {expiraAt && <CuentaRegresiva expiraAt={expiraAt} />}
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
          {detalle}
          <Loader2 size={28} className="text-primary animate-spin" />
          <p className="text-sm text-gray-500">Esperando la confirmación de Mercado Pago…</p>
          {expiraAt && <CuentaRegresiva expiraAt={expiraAt} />}
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

      {fase === 'vencida' && (
        <div className="space-y-3 text-center py-2">
          {detalle}
          <AlertTriangle size={28} className="text-amber-500 mx-auto" />
          <p className="text-sm text-gray-600">
            La orden venció y ya no se puede pagar. Si todavía no pagaste, generá una orden nueva — el precio puede haber cambiado.
          </p>
          <Button variant="primary" className="w-full justify-center" onClick={onGenerarOtra}>
            Generar otra
          </Button>
        </div>
      )}

      {fase === 'conflicto' && (
        <div className="space-y-3 text-center py-2">
          <AlertTriangle size={28} className="text-red-500 mx-auto" />
          <p className="text-sm text-gray-600">
            Mercado Pago confirmó tu pago, pero no lo pudimos acreditar solo. Avisale a la academia para que lo revisen a mano y no vuelvas a pagarlo mientras tanto.
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
