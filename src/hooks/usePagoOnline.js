import { useCallback, useEffect, useRef, useState } from 'react'
import { crearOrdenPagoCuota, getOrdenPago } from '../api/client'

const INTERVALO_MS = 5000
const LIMITE_MS = 2 * 60 * 1000

function claveLocal(alumnoId) {
  return `crear_orden_pendiente:${alumnoId}`
}

function leerPendiente(alumnoId) {
  try {
    const crudo = localStorage.getItem(claveLocal(alumnoId))
    return crudo ? JSON.parse(crudo) : null
  } catch {
    return null
  }
}

function guardarPendiente(alumnoId, pendiente) {
  localStorage.setItem(claveLocal(alumnoId), JSON.stringify(pendiente))
}

function borrarPendiente(alumnoId) {
  localStorage.removeItem(claveLocal(alumnoId))
}

// Fases: idle | creando | resumen | esperando | sin_confirmar | conflicto |
// error. "pagado" no es una fase propia: no tiene vista en la hoja (la
// resuelve `onPagado`, que recarga la cuenta y decide toast/comprobante), así
// que al acreditarse se vuelve directo a 'idle' en vez de pasar por un
// estado intermedio que alguien tendría que acordarse de cerrar.
//
// `cuotaId` queda cargado mientras haya una orden pendiente para esa cuota
// (incluso con la hoja cerrada, fase 'idle') — es lo que usa Pagos.jsx para
// decidir si el botón de una cuota dice "Pagar" o "Retomar pago".
export function usePagoOnline(alumnoId, onPagado) {
  const [fase, setFase] = useState('idle')
  const [orden, setOrden] = useState(null)
  const [cuotaId, setCuotaId] = useState(null)
  const [error, setError] = useState(null)

  const intervaloRef = useRef(null)
  const inicioRef = useRef(null)
  // Espejo de `cuotaId` legible desde closures viejas (consultar/iniciarPolling
  // no llevan `cuotaId` en sus deps, así que su versión de ese estado puede
  // estar vieja) — es lo único confiable para saber de qué cuota era la
  // orden justo en el momento en que se resuelve PAGADA/CONFLICTO.
  const cuotaIdRef = useRef(null)

  const actualizarCuotaId = useCallback((id) => {
    cuotaIdRef.current = id
    setCuotaId(id)
  }, [])

  const detenerPolling = useCallback(() => {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current)
      intervaloRef.current = null
    }
  }, [])

  // Nunca marca como pagado por nada que no sea esta respuesta: no hay URL
  // de retorno de Mercado Pago que se consulte para eso (regla explícita
  // del pedido).
  const consultar = useCallback(async (ordenId) => {
    try {
      const data = await getOrdenPago(alumnoId, ordenId)
      setOrden(data)
      if (data.estado === 'PAGADA') {
        const cuotaResuelta = cuotaIdRef.current
        detenerPolling()
        borrarPendiente(alumnoId)
        actualizarCuotaId(null)
        setFase('idle')
        onPagado?.(cuotaResuelta, data)
        return
      }
      if (data.estado === 'CONFLICTO') {
        detenerPolling()
        borrarPendiente(alumnoId)
        actualizarCuotaId(null)
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
  }, [alumnoId, detenerPolling, onPagado, actualizarCuotaId])

  const iniciarPolling = useCallback((ordenId) => {
    detenerPolling()
    inicioRef.current = Date.now()
    setFase('esperando')
    intervaloRef.current = setInterval(() => consultar(ordenId), INTERVALO_MS)
  }, [consultar, detenerPolling])

  // Al abrir Pagos con una orden pendiente de una sesión anterior: se
  // consulta una sola vez y, si sigue sin resolverse, se reanuda la espera
  // (una ventana nueva de 2 minutos, no quedó guardado cuánto faltaba).
  useEffect(() => {
    detenerPolling()
    setFase('idle')
    setOrden(null)
    actualizarCuotaId(null)
    setError(null)
    if (!alumnoId) return
    const pendiente = leerPendiente(alumnoId)
    if (!pendiente) return
    actualizarCuotaId(pendiente.cuotaId)
    let cancelado = false
    getOrdenPago(alumnoId, pendiente.ordenId).then((data) => {
      if (cancelado) return
      setOrden(data)
      if (data.estado === 'PAGADA') {
        borrarPendiente(alumnoId)
        actualizarCuotaId(null)
        setFase('idle')
        onPagado?.(pendiente.cuotaId, data)
      } else if (data.estado === 'CONFLICTO') {
        borrarPendiente(alumnoId)
        actualizarCuotaId(null)
        setFase('conflicto')
      } else {
        iniciarPolling(pendiente.ordenId)
      }
    }).catch(() => { /* sigue pendiente en localStorage, se reintenta más tarde */ })
    return () => { cancelado = true }
  }, [alumnoId])

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

  // `cuotaId` recién se confirma si la orden se crea bien: si falla (409,
  // 422, 502/503) no queda ninguna orden pendiente de verdad, y el botón de
  // esa cuota tiene que seguir diciendo "Pagar", no "Retomar pago".
  const abrirPago = useCallback(async (cId) => {
    setError(null)
    setFase('creando')
    try {
      const data = await crearOrdenPagoCuota(alumnoId, cId)
      setOrden(data)
      actualizarCuotaId(cId)
      guardarPendiente(alumnoId, { ordenId: data.id, cuotaId: cId })
      setFase('resumen')
    } catch (e) {
      setError({ status: e.status, codigo: e.codigo, mensaje: e.message })
      setFase('error')
    }
  }, [alumnoId, actualizarCuotaId])

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

  return { fase, orden, cuotaId, error, abrirPago, confirmarSalida, revisarAhora, cerrarHoja }
}
