import { useCallback, useEffect, useRef, useState } from 'react'
import { getOrdenPago } from '../api/client'

const INTERVALO_MS = 5000
const LIMITE_MS = 2 * 60 * 1000

// `ambito` es opcional: cuota/vestuario lo necesitan (alumnoId, la orden es
// de una hija puntual) y entradas no (la compra es de toda la familia). Se
// distingue `null` ("esta pantalla no usa ambito") de `undefined` ("todavía
// no cargó", ej. alumnoActivo?.alumno_id mientras las hijas no llegaron) —
// solo lo segundo frena el efecto más abajo. Con o sin ambito la clave sigue
// empezando con "crear_orden_pendiente:", que es lo que mira el logout.
function prefijoAmbitoTipo(ambito, tipo) {
  return ambito != null ? `crear_orden_pendiente:${ambito}:${tipo}:` : `crear_orden_pendiente:${tipo}:`
}

function claveLocal(ambito, tipo, conceptoId) {
  return `${prefijoAmbitoTipo(ambito, tipo)}${conceptoId}`
}

// Puede haber más de una orden pendiente por pantalla (cada cuota, o cada
// cargo de vestuario/entradas, tiene la suya — se pueden pagar en cualquier
// orden): por eso esto es un listado, no una lectura de una sola clave fija.
function listarPendientes(ambito, tipo) {
  const prefijo = prefijoAmbitoTipo(ambito, tipo)
  const resultado = []
  for (let i = 0; i < localStorage.length; i++) {
    const clave = localStorage.key(i)
    if (!clave || !clave.startsWith(prefijo)) continue
    try {
      const datos = JSON.parse(localStorage.getItem(clave))
      if (datos?.ordenId && datos?.conceptoId) resultado.push(datos)
    } catch {
      // entrada corrupta — se ignora, no rompe el resto
    }
  }
  return resultado
}

function guardarPendiente(ambito, tipo, conceptoId, ordenId) {
  localStorage.setItem(claveLocal(ambito, tipo, conceptoId), JSON.stringify({ ordenId, conceptoId }))
}

function borrarPendiente(ambito, tipo, conceptoId) {
  localStorage.removeItem(claveLocal(ambito, tipo, conceptoId))
}

// Fases: idle | creando | resumen | esperando | sin_confirmar | vencida |
// conflicto | error. "pagado" no es una fase propia: no tiene vista en la
// hoja (la resuelve `onPagado`, que recarga y decide toast/comprobante), así
// que al acreditarse se vuelve directo a 'idle' en vez de pasar por un
// estado intermedio que alguien tendría que acordarse de cerrar.
//
// "vencida" es distinta de "sin_confirmar": las dos significan "se acabó la
// espera y seguimos sin ver el pago", pero en "sin_confirmar" (cuota/
// vestuario, sin vencimiento real) tiene sentido ofrecer "Revisar ahora"
// porque la orden sigue viva; en "vencida" (entradas, con expira_at) la
// orden ya quedó CANCELADA del lado del backend — insistir solo volvería a
// pegarle a una orden muerta, así que ahí se ofrece generar una orden nueva
// en vez de reconsultar la vieja en bucle.
//
// Genérico por `tipo` ('cuota' | 'vestuario' | 'entradas' | lo que haga
// falta a futuro): la clave de localStorage es
// `crear_orden_pendiente:<ambito?>:<tipo>:<conceptoId>` (un slot por
// concepto, no uno solo por ambito — antes de generalizar esto para
// vestuario, cuotas usaba una única clave por alumna y perdía el rastro de
// una orden si se abría otra antes de pagarla; ahora ninguna pantalla pisa
// a la otra, ni entre cuotas/cargos del mismo tipo entre sí).
//
// Solo puede haber UNA hoja activa (un solo `fase`/`orden` a la vez, es lo
// que el usuario puede estar mirando) aunque haya varias órdenes pendientes
// en simultáneo: las demás quedan en `pendientes` (para el label del botón)
// sin pollearse en segundo plano hasta que el usuario las abre — evitan
// correr dos `setInterval` del mismo hook pisándose el `fase` uno al otro.
//
// `crearOrden(conceptoId)` es la función que hace el POST real (inyectada
// por quien usa el hook: `crearOrdenPagoCuota`, `crearOrdenPagoVestuario` o
// `crearOrdenPagoEntradas` ya aplicadas a lo que haga falta) — así el hook
// no sabe nada de endpoints.
//
// Quinto parámetro, opcional, para lo que varía entre conceptos:
// - `consultarOrden(ordenId)`: default `getOrdenPago(ambito, ordenId)` (la
//   ruta por alumna); entradas inyecta `getOrdenPagoEntradas(ordenId)` (sin
//   alumna, la ruta es de toda la familia).
// - `calcularLimite(orden, inicioMs)`: devuelve el instante (ms) en que se
//   deja de esperar. Default `inicioMs + 2 minutos` (relativo a cuándo se
//   confirmó la salida a Mercado Pago, como hasta ahora). Entradas inyecta
//   `expira_at + margen corto`: un tope absoluto fijado al crear la orden,
//   no relativo a cuándo se hizo click en pagar.
// - `faseAlVencer`: 'sin_confirmar' (default) o 'vencida'.
export function usePagoOnline(ambito, tipo, crearOrden, onPagado, opciones = {}) {
  const {
    consultarOrden = (ordenId) => getOrdenPago(ambito, ordenId),
    calcularLimite = (_orden, inicioMs) => inicioMs + LIMITE_MS,
    faseAlVencer = 'sin_confirmar',
  } = opciones

  const [fase, setFase] = useState('idle')
  const [orden, setOrden] = useState(null)
  const [conceptoId, setConceptoId] = useState(null)
  const [error, setError] = useState(null)
  const [pendientes, setPendientes] = useState(() => new Set())

  const intervaloRef = useRef(null)
  const inicioRef = useRef(null)
  const limiteRef = useRef(null)
  // Espejo de `conceptoId` legible desde closures viejas (consultar/
  // iniciarPolling no lo llevan en sus deps, así que su versión de ese
  // estado puede estar vieja) — es lo único confiable para saber de qué
  // concepto era la orden justo en el momento en que se resuelve.
  const conceptoIdRef = useRef(null)

  const actualizarConceptoId = useCallback((id) => {
    conceptoIdRef.current = id
    setConceptoId(id)
  }, [])

  const marcarPendiente = useCallback((id) => {
    setPendientes((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))
  }, [])

  const desmarcarPendiente = useCallback((id) => {
    setPendientes((prev) => {
      if (!prev.has(id)) return prev
      const siguiente = new Set(prev)
      siguiente.delete(id)
      return siguiente
    })
  }, [])

  const detenerPolling = useCallback(() => {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current)
      intervaloRef.current = null
    }
  }, [])

  // Nunca marca como pagado por nada que no sea esta respuesta: no hay URL
  // de retorno de Mercado Pago que se consulte para eso (regla explícita
  // del pedido original).
  const consultar = useCallback(async (ordenId) => {
    let data = null
    try {
      data = await consultarOrden(ordenId)
      setOrden(data)
      if (data.estado === 'PAGADA') {
        const resuelto = conceptoIdRef.current
        detenerPolling()
        borrarPendiente(ambito, tipo, resuelto)
        desmarcarPendiente(resuelto)
        actualizarConceptoId(null)
        setFase('idle')
        onPagado?.(resuelto, data)
        return
      }
      if (data.estado === 'CONFLICTO') {
        const resuelto = conceptoIdRef.current
        detenerPolling()
        borrarPendiente(ambito, tipo, resuelto)
        desmarcarPendiente(resuelto)
        setFase('conflicto')
        return
      }
      // Solo entradas llega a CANCELADA (orden vencida que el backend ya
      // chequeó contra Mercado Pago sin encontrar un pago aprobado) — se
      // corta la espera ahí mismo, no hace falta llegar al tope de tiempo
      // local para darse cuenta.
      if (data.estado === 'CANCELADA') {
        const resuelto = conceptoIdRef.current
        detenerPolling()
        borrarPendiente(ambito, tipo, resuelto)
        desmarcarPendiente(resuelto)
        setFase(faseAlVencer)
        return
      }
    } catch {
      // Error de red durante el polling: se tolera y se reintenta en el
      // próximo tick, solo importa si ya se llegó al tope de espera.
    }
    if (limiteRef.current !== null && Date.now() >= limiteRef.current) {
      detenerPolling()
      setFase(faseAlVencer)
    }
  }, [ambito, tipo, consultarOrden, faseAlVencer, detenerPolling, onPagado, actualizarConceptoId, desmarcarPendiente])

  const iniciarPolling = useCallback((ordenId, ordenParaLimite) => {
    detenerPolling()
    inicioRef.current = Date.now()
    limiteRef.current = calcularLimite(ordenParaLimite, inicioRef.current)
    setFase('esperando')
    intervaloRef.current = setInterval(() => consultar(ordenId), INTERVALO_MS)
  }, [consultar, detenerPolling, calcularLimite])

  // Al abrir la pantalla: arma `pendientes` de una (síncrono, desde
  // localStorage) para que los botones ya digan "Retomar pago" sin esperar
  // ninguna red, y después consulta cada una pendiente una sola vez. La
  // primera que siga sin resolver pasa a ser el flujo activo (la única hoja
  // posible a la vez) y arranca su espera; las demás quedan marcadas pero
  // sin pollearse hasta que el usuario las abra a mano.
  useEffect(() => {
    detenerPolling()
    setFase('idle')
    setOrden(null)
    actualizarConceptoId(null)
    setError(null)
    // undefined (todavía no cargó, ej. alumnoActivo sin resolver) frena
    // todo; null (esta pantalla no usa ambito, ej. entradas) sigue de largo.
    if (ambito === undefined) {
      setPendientes(new Set())
      return
    }
    const items = listarPendientes(ambito, tipo)
    setPendientes(new Set(items.map((it) => it.conceptoId)))
    if (items.length === 0) return

    let cancelado = false
    let activoAsignado = false
    ;(async () => {
      for (const item of items) {
        if (cancelado) return
        try {
          const data = await consultarOrden(item.ordenId)
          if (cancelado) return
          if (data.estado === 'PAGADA') {
            borrarPendiente(ambito, tipo, item.conceptoId)
            desmarcarPendiente(item.conceptoId)
            onPagado?.(item.conceptoId, data)
          } else if (data.estado === 'CONFLICTO') {
            borrarPendiente(ambito, tipo, item.conceptoId)
            desmarcarPendiente(item.conceptoId)
            if (!activoAsignado) {
              activoAsignado = true
              setOrden(data)
              actualizarConceptoId(item.conceptoId)
              setFase('conflicto')
            }
          } else if (data.estado === 'CANCELADA') {
            borrarPendiente(ambito, tipo, item.conceptoId)
            desmarcarPendiente(item.conceptoId)
            if (!activoAsignado) {
              activoAsignado = true
              setOrden(data)
              actualizarConceptoId(item.conceptoId)
              setFase(faseAlVencer)
            }
          } else if (!activoAsignado) {
            activoAsignado = true
            setOrden(data)
            actualizarConceptoId(item.conceptoId)
            iniciarPolling(item.ordenId, data)
          }
        } catch {
          // sigue pendiente en localStorage, se reintenta en la próxima apertura
        }
      }
    })()
    return () => { cancelado = true }
  }, [ambito, tipo])

  // Vuelve a consultar al recuperar el foco — típico al volver de Mercado
  // Pago desde el celular.
  useEffect(() => {
    if (fase !== 'esperando' || !orden) return
    function alVolverElFoco() {
      if (document.visibilityState === 'visible') consultar(orden.id)
    }
    document.addEventListener('visibilitychange', alVolverElFoco)
    return () => document.removeEventListener('visibilitychange', alVolverElFoco)
  }, [fase, orden, consultar])

  useEffect(() => () => detenerPolling(), [detenerPolling])

  // Pagar y Retomar llaman a lo mismo: el backend ya es idempotente (devuelve
  // la orden activa existente en vez de crear otra, salvo que la anterior ya
  // haya vencido — ahí da una nueva, al precio de hoy), así que no hace
  // falta un camino GET separado para "retomar" ni para "generar otra" tras
  // vencer. Si había otra orden siendo polleada en segundo plano, se frena
  // (solo puede haber una hoja activa) — la anterior sigue pendiente en
  // localStorage y en `pendientes`, no se pierde, solo deja de consultarse
  // hasta que se la abra de nuevo.
  const abrirPago = useCallback(async (id) => {
    detenerPolling()
    setError(null)
    setFase('creando')
    actualizarConceptoId(id)
    try {
      const data = await crearOrden(id)
      setOrden(data)
      guardarPendiente(ambito, tipo, id, data.id)
      marcarPendiente(id)
      setFase('resumen')
    } catch (e) {
      setError({ status: e.status, codigo: e.codigo, mensaje: e.message })
      setFase('error')
    }
  }, [ambito, tipo, crearOrden, actualizarConceptoId, marcarPendiente, detenerPolling])

  // Se llama en el onClick del <a href={checkout_url}>: no cancela la
  // navegación (nada de preventDefault ni window.open), solo prepara la
  // espera para cuando la familia vuelva de Mercado Pago.
  const confirmarSalida = useCallback(() => {
    if (!orden) return
    iniciarPolling(orden.id, orden)
  }, [orden, iniciarPolling])

  const revisarAhora = useCallback(() => {
    if (!orden) return
    consultar(orden.id)
  }, [orden, consultar])

  const cerrarHoja = useCallback(() => {
    setFase('idle')
  }, [])

  return { fase, orden, conceptoId, error, pendientes, abrirPago, confirmarSalida, revisarAhora, cerrarHoja }
}
