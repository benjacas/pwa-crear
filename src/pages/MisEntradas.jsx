import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Ticket, CheckCircle2, Download, Armchair, Expand } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import QRCode from '../components/QRCode'
import QRAmpliado from '../components/QRAmpliado'
import PagoOnlineHoja from '../components/PagoOnlineHoja'
import { useEntradas } from '../hooks/useEntradas'
import { usePagoOnline } from '../hooks/usePagoOnline'
import { useToast } from '../context/ToastContext'
import { crearOrdenPagoEntradas, getOrdenPagoEntradas } from '../api/client'
import { descargarEntradaPng } from '../utils/descargarEntrada'
import { urlEntrada } from '../utils/qr'
import { formatFecha, formatHora, formatMoneda, hoyLocalISO, motivoButacas } from '../utils/format'

// El margen que se espera además de expira_at antes de declarar la orden
// "vencida" en la UI: corto a propósito (no son 2 minutos como cuota/
// vestuario) — solo le da un par de vueltas más de polling (cada 5s) a la
// chance de que Mercado Pago confirme un pago hecho justo al filo del
// vencimiento, sin dejar al usuario mirando una cuenta regresiva en 0 por
// mucho tiempo.
const MARGEN_VENCIMIENTO_MS = 20 * 1000

function calcularLimiteEntradas(orden, inicioMs) {
  if (!orden?.expira_at) return inicioMs + 2 * 60 * 1000
  return new Date(orden.expira_at).getTime() + MARGEN_VENCIMIENTO_MS
}

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

function FilaEntrada({ compra, entrada, onAmpliar }) {
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

  const texto = urlEntrada(entrada.codigo)
  const etiqueta = `Fila ${entrada.butaca.fila} · Butaca ${entrada.butaca.numero}`

  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-xl border border-gray-100">
      <button
        type="button"
        onClick={() => onAmpliar({ texto, etiqueta })}
        className="relative rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 group"
        aria-label={`Ampliar código QR, ${etiqueta}`}
      >
        <QRCode texto={texto} tamano={180} />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/5 rounded-xl transition-colors">
          <Expand size={20} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </span>
      </button>
      <p className="text-sm font-semibold text-gray-800">{etiqueta}</p>
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

// Cada cargo decide solo entre tres cosas: un botón de pago (si
// cargo.puede_pagar — "Retomar pago" en vez de "Pagar cuota N" si ya había
// una orden pendiente guardada para este cargo), o el motivo_pago que manda
// el backend como texto (reemplaza al viejo "El pago se registra en la
// academia", que ya no aplica donde se puede pagar online).
function FilaCargo({ cargo, pagoOnline }) {
  const { label, color } = infoEstadoCargo(cargo.estado)
  const { fase, pendientes, abrirPago } = pagoOnline

  return (
    <li className="flex items-center justify-between gap-2 py-1.5 text-sm">
      <div className="min-w-0">
        <span className="text-gray-700">Cuota {cargo.numero}</span>
        {cargo.fecha_vencimiento && (
          <span className="text-gray-400"> · vence {formatFecha(cargo.fecha_vencimiento, { conAnio: false })}</span>
        )}
        {!cargo.puede_pagar && cargo.motivo_pago && (
          <p className="text-xs text-gray-400">{cargo.motivo_pago}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {cargo.importe != null && <span className="font-medium text-gray-800">{formatMoneda(cargo.importe)}</span>}
        <Badge color={color}>{label}</Badge>
        {cargo.puede_pagar && (
          <Button
            variant="primary"
            size="sm"
            disabled={fase === 'creando'}
            onClick={() => abrirPago(cargo.id)}
          >
            {pendientes.has(cargo.id) ? 'Retomar pago' : `Pagar cuota ${cargo.numero}`}
          </Button>
        )}
      </div>
    </li>
  )
}

function TarjetaCompra({ compra, onAmpliar, pagoOnline }) {
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
          <ul className="space-y-1 divide-y divide-gray-50">
            {compra.cargos.map((cargo) => (
              <FilaCargo key={cargo.id} cargo={cargo} pagoOnline={pagoOnline} />
            ))}
          </ul>
        </div>
      )}

      {compra.entradas.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Entradas</h3>
          <div className="space-y-2">
            {compra.entradas.map((entrada) => (
              <FilaEntrada key={entrada.numero} compra={compra} entrada={entrada} onAmpliar={onAmpliar} />
            ))}
          </div>
        </div>
      )}

      <AccionButacas compra={compra} />
    </div>
  )
}

export default function MisEntradas() {
  const { compras, cargando, error, recargar } = useEntradas()
  const { notificacionesApi } = useOutletContext()
  const { recargar: recargarNotificaciones } = notificacionesApi
  const toast = useToast()
  const [ampliado, setAmpliado] = useState(null)

  // Pagado: recarga la lista y las notificaciones, y avisa según cómo haya
  // quedado la compra — si quedó PAGADA, el botón "Elegir butacas" ya
  // aparece solo en AccionButacas (puede_elegir_butacas pasa a true con la
  // recarga), así que el toast no necesita llevar una acción, solo avisar.
  const onPagado = useCallback((cargoId) => {
    recargar().then(({ compras: comprasFrescas }) => {
      const compra = comprasFrescas.find((c) => c.cargos.some((cg) => cg.id === cargoId))
      if (!compra) return
      if (compra.estado === 'PAGADA') {
        toast('Tu compra está paga. Ya podés elegir tus butacas.', 'success')
      } else {
        const cargoPagado = compra.cargos.find((cg) => cg.id === cargoId)
        const siguiente = compra.cargos.find((cg) => cg.estado !== 'PAGADO')
        const proxima = siguiente?.fecha_vencimiento
          ? ` La próxima vence el ${formatFecha(siguiente.fecha_vencimiento)}.`
          : ''
        toast(`Pagaste la cuota ${cargoPagado?.numero} de ${compra.cargos.length}.${proxima}`, 'success')
      }
    })
    recargarNotificaciones()
  }, [recargar, recargarNotificaciones, toast])

  // crearOrden solo recibe el cargoId (así lo pide usePagoOnline) — la
  // compra a la que pertenece se busca acá porque crearOrdenPagoEntradas
  // también necesita el compraId en la URL.
  const crearOrden = useCallback((cargoId) => {
    const compra = compras.find((c) => c.cargos.some((cg) => cg.id === cargoId))
    return crearOrdenPagoEntradas(compra.id, cargoId)
  }, [compras])

  const pagoOnline = usePagoOnline(null, 'entradas', crearOrden, onPagado, {
    consultarOrden: (ordenId) => getOrdenPagoEntradas(ordenId),
    calcularLimite: calcularLimiteEntradas,
    faseAlVencer: 'vencida',
  })
  const { fase, orden, conceptoId, error: errorPago, cerrarHoja, confirmarSalida, revisarAhora, abrirPago } = pagoOnline

  // ERR_CARGO_PAGADO (404 y "ya está paga") no tienen nada que explicarle a
  // la familia: se refresca la lista sola, mismo patrón que Pagos.jsx/
  // Vestuario.jsx. ERR_PAGAR_CUOTA_EN_ORDEN ("primero pagá la cuota N") sí
  // se muestra — el mensaje real del backend ya lo explica — pero además
  // se recarga en segundo plano por si la cuota anterior se pagó desde
  // otro lado justo en el medio.
  useEffect(() => {
    if (fase !== 'error') return
    if (errorPago?.codigo === 'ERR_CARGO_PAGADO') {
      toast('Esa cuota ya está pagada.', 'info')
      recargar()
      cerrarHoja()
    } else if (errorPago?.status === 404) {
      toast('No pudimos encontrar esa cuota.', 'info')
      recargar()
      cerrarHoja()
    } else if (errorPago?.codigo === 'ERR_PAGAR_CUOTA_EN_ORDEN') {
      recargar()
    }
  }, [fase, errorPago])

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

  const errorEsSilencioso = fase === 'error' && (errorPago?.codigo === 'ERR_CARGO_PAGADO' || errorPago?.status === 404)
  const hojaAbierta = fase !== 'idle' && !errorEsSilencioso

  const compraDelPago = compras.find((c) => c.cargos.some((cg) => cg.id === conceptoId))
  const cargoDelPago = compraDelPago?.cargos.find((cg) => cg.id === conceptoId)
  const detallePago = compraDelPago && cargoDelPago ? (
    <div className="text-sm text-gray-600 space-y-0.5 text-left">
      <p className="font-medium text-gray-800">{compraDelPago.evento.nombre}</p>
      {compraDelPago.funcion && (
        <p className="text-xs text-gray-400">
          {formatFecha(compraDelPago.funcion.fecha)}
          {compraDelPago.funcion.hora ? ` · ${formatHora(compraDelPago.funcion.hora)} hs` : ''}
          {' · '}{compraDelPago.funcion.sala_nombre}
        </p>
      )}
      <p className="text-xs text-gray-400">
        Cuota {cargoDelPago.numero} de {compraDelPago.cargos.length} · {compraDelPago.cantidad} entrada{compraDelPago.cantidad === 1 ? '' : 's'}
      </p>
    </div>
  ) : null

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Mis entradas</h1>

      {proximas.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500">Próximas</h2>
          {proximas.map((compra) => (
            <TarjetaCompra key={compra.id} compra={compra} onAmpliar={setAmpliado} pagoOnline={pagoOnline} />
          ))}
        </div>
      )}

      {pasadas.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500">Pasadas</h2>
          {pasadas.map((compra) => (
            <TarjetaCompra key={compra.id} compra={compra} onAmpliar={setAmpliado} pagoOnline={pagoOnline} />
          ))}
        </div>
      )}

      {ampliado && (
        <QRAmpliado texto={ampliado.texto} etiqueta={ampliado.etiqueta} onClose={() => setAmpliado(null)} />
      )}

      <PagoOnlineHoja
        abierta={hojaAbierta}
        onClose={cerrarHoja}
        titulo="Pagar entradas"
        nombrePantalla="Mis entradas"
        fase={fase}
        concepto="Importe de la cuota"
        importe={orden?.importe}
        recargo={orden?.recargo}
        total={orden?.monto}
        checkoutUrl={orden?.checkout_url}
        error={errorPago}
        onConfirmarSalida={confirmarSalida}
        onRevisarAhora={revisarAhora}
        detalle={detallePago}
        textoPago="Tenés 15 minutos para completar el pago. Si se vence, el precio puede cambiar y vas a tener que empezar de nuevo."
        expiraAt={orden?.expira_at}
        onGenerarOtra={() => abrirPago(conceptoId)}
      />
    </div>
  )
}
