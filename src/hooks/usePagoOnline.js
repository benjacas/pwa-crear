import { useCallback, useEffect, useRef, useState } from 'react'
import { getOrdenPago } from '../api/client'

const INTERVALO_MS = 5000
const LIMITE_MS = 2 * 60 * 1000

function prefijoAlumnoTipo(alumnoId, tipo) {
  return `crear_orden_pendiente:${alumnoId}:${tipo}:`
}

function claveLocal(alumnoId, tipo, conceptoId) {
  return `${prefijoAlumnoTipo(alumnoId, tipo)}${conceptoId}`
}

// Puede haber más de una orden pendiente por pantalla (cada cuota, o cada
// cargo de vestuario, tiene la suya — se pueden pagar en cualquier orden):
// por eso esto es un listado, no una lectura de una sola clave fija.
function listarPendientes(alumnoId, tipo) {
  const prefijo = prefijoAlumnoTipo(alumnoId, tipo)
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

function guardarPendiente(alumnoId, tipo, conceptoId, ordenId) {
  localStorage.setItem(claveLocal(alumnoId, tipo, conceptoId), JSON.stringify({ ordenId, conceptoId }))
}

function borrarPendiente(alumnoId, tipo, conceptoId) {
  localStorage.removeItem(claveLocal(alumnoId, tipo, conceptoId))
}

// Fases: idle | creando | resumen | esperando | sin_confirmar | conflicto |
// error. "pagado" no es una fase propia: no tiene vista en la hoja (la
// resuelve `onPagado`, que recarga y decide toast/comprobante), así que al
// acreditarse se vuelve directo a 'idle' en vez de pasar por un estado
// intermedio que alguien tendría que acordarse de cerrar.
//
// Genérico por `tipo` ('cuota' | 'vestuario' | lo que haga falta a futuro):
// la clave de localStorage es `crear_orden_pendiente:<alumnoId>:<tipo>:<conceptoId>`
// (un slot por concepto, no uno solo por alumna — antes de generalizar esto
// para vestuario, cuotas usaba una única clave por alumna y perdía el rastro
// de una orden si se abría otra antes de pagarla; ahora ninguna de las dos
// pantallas pisa a la otra, ni entre cuotas/cargos del mismo tipo entre sí).
//
// Solo puede haber UNA hoja activa (un solo `fase`/`orden` a la vez, es lo
// que el usuario puede estar mirando) aunque haya varias órdenes pendientes
// en simultáneo: las demás quedan en `pendientes` (para el label del botón)
// sin pollearse en segundo plano hasta que el usuario las abre — evitan
// correr dos `setInterval` del mismo hook pisándose el `fase` uno al otro.
//
// `crearOrden(conceptoId)` es la función que hace el POST real (inyectada
// por quien usa el hook: `crearOrdenPagoCuota` o `crearOrdenPagoVestuario`
// ya aplicadas al alumnoId) — así el hook no sabe nada de endpoints.
export function usePagoOnline(alumnoId, tipo, crearOrden, onPagado) {
  const [fase, setFase] = useState('idle')
  const [orden, setOrden] = useState(null)
  const [conceptoId, setConceptoId] = useState(null)
  const [error, setError] = useState(null)
  const [pendientes, setPendientes] = useState(() => new Set())

  const intervaloRef = useRef(null)
  const inicioRef = useRef(null)
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
    try {
      const data = await getOrdenPago(alumnoId, ordenId)
      setOrden(data)
      if (data.estado === 'PAGADA') {
        const resuelto = conceptoIdRef.current
        detenerPolling()
        borrarPendiente(alumnoId, tipo, resuelto)
        desmarcarPendiente(resuelto)
        actualizarConceptoId(null)
        setFase('idle')
        onPagado?.(resuelto, data)
        return
      }
      if (data.estado === 'CONFLICTO') {
        const resuelto = conceptoIdRef.current
        detenerPolling()
        borrarPendiente(alumnoId, tipo, resuelto)
        desmarcarPendiente(resuelto)
        setFase('conflicto')
        return
      }
    } catch {
      // Error de red durante el polling: se tolera y se reintenta en el
      // próximo tick, solo importa si ya venció el límite de 2 minutos.
    }
    if (inicioRef.current !== null && Date.now() - inicioRef.current >= LIMITE_MS) {
      detenerPolling()
      setFase('sin_confirmar')
    }
  }, [alumnoId, tipo, detenerPolling, onPagado, actualizarConceptoId, desmarcarPendiente])

  const iniciarPolling = useCallback((ordenId) => {
    detenerPolling()
    inicioRef.current = Date.now()
    setFase('esperando')
    intervaloRef.current = setInterval(() => consultar(ordenId), INTERVALO_MS)
  }, [consultar, detenerPolling])

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
    if (!alumnoId) {
      setPendientes(new Set())
      return
    }
    const items = listarPendientes(alumnoId, tipo)
    setPendientes(new Set(items.map((it) => it.conceptoId)))
    if (items.length === 0) return

    let cancelado = false
    let activoAsignado = false
    ;(async () => {
      for (const item of items) {
        if (cancelado) return
        try {
          const data = await getOrdenPago(alumnoId, item.ordenId)
          if (cancelado) return
          if (data.estado === 'PAGADA') {
            borrarPendiente(alumnoId, tipo, item.conceptoId)
            desmarcarPendiente(item.conceptoId)
            onPagado?.(item.conceptoId, data)
          } else if (data.estado === 'CONFLICTO') {
            borrarPendiente(alumnoId, tipo, item.conceptoId)
            desmarcarPendiente(item.conceptoId)
            if (!activoAsignado) {
              activoAsignado = true
              setOrden(data)
              actualizarConceptoId(item.conceptoId)
              setFase('conflicto')
            }
          } else if (!activoAsignado) {
            activoAsignado = true
            setOrden(data)
            actualizarConceptoId(item.conceptoId)
            iniciarPolling(item.ordenId)
          }
        } catch {
          // sigue pendiente en localStorage, se reintenta en la próxima apertura
        }
      }
    })()
    return () => { cancelado = true }
  }, [alumnoId, tipo])

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
  // la orden activa existente en vez de crear otra), así que no hace falta
  // un camino GET separado para "retomar". Si había otra orden siendo
  // polleada en segundo plano, se frena (solo puede haber una hoja activa) —
  // la anterior sigue pendiente en localStorage y en `pendientes`, no se
  // pierde, solo deja de consultarse hasta que se la abra de nuevo.
  const abrirPago = useCallback(async (id) => {
    detenerPolling()
    setError(null)
    setFase('creando')
    actualizarConceptoId(id)
    try {
      const data = await crearOrden(id)
      setOrden(data)
      guardarPendiente(alumnoId, tipo, id, data.id)
      marcarPendiente(id)
      setFase('resumen')
    } catch (e) {
      setError({ status: e.status, codigo: e.codigo, mensaje: e.message })
      setFase('error')
    }
  }, [alumnoId, tipo, crearOrden, actualizarConceptoId, marcarPendiente, detenerPolling])

  // Se llama en el onClick del <a href={checkout_url}>: no cancela la
  // navegación (nada de preventDefault ni window.open), solo prepara la
  // espera para cuando la familia vuelva de Mercado Pago.
  const confirmarSalida = useCallback(() => {
    if (!orden) return
    iniciarPolling(orden.id)
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
