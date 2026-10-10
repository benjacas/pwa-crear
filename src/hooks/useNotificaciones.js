import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AlumnoActivoContext } from '../context/AlumnoActivoContext'
import {
  getAsistenciaHija, getEvaluaciones, getEventos,
  getNotificaciones, marcarNotificacionLeida, marcarTodasLeidas,
} from '../api/client'
import { calcularNotificaciones, hoyLocalISO, tipoVisualDeBackend, fechaLocalDeDatetime } from '../utils/format'

const CLAVE_LEIDAS = 'crear_notifs_leidas'

function leerLeidasLocal() {
  return new Set(JSON.parse(localStorage.getItem(CLAVE_LEIDAS) || '[]'))
}

function guardarLeidasLocal(set) {
  localStorage.setItem(CLAVE_LEIDAS, JSON.stringify([...set]))
}

// Combina dos fuentes de notificaciones: las que arma el backend
// (NotificacionService — por ahora solo CUOTA_NUEVA/CUOTA_VENCIDA/
// PAGO_RECIBIDO para el rol tutor, con estado de lectura server-side) y las
// que todavía se calculan del lado del cliente (asistencia, apto físico,
// nota cargada, próximo evento — ver Claude.md, "Decisiones pendientes").
// El estado de lectura de las calculadas es por dispositivo (localStorage):
// es la limitación conocida de no tener todavía esos tipos en el backend.
export function useNotificaciones() {
  const { alumnosVinculados } = useContext(AlumnoActivoContext)
  const [delServidor, setDelServidor] = useState([])
  const [noLeidasServidor, setNoLeidasServidor] = useState(0)
  const [calculadas, setCalculadas] = useState([])
  const [leidasLocal, setLeidasLocal] = useState(leerLeidasLocal)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // seguro() por sub-fetch (no solo un Promise.allSettled afuera): así, si
  // falla una sola fuente (p.ej. getEventos), las otras dos igual arman
  // notificaciones calculadas en vez de perder el bloque entero.
  const cargarTodo = useCallback(() => {
    const seguro = (promesa, vacio) => promesa.catch((e) => { console.warn('Notificaciones: una fuente falló', e); return vacio })
    const calculo = Promise.all([
      Promise.all(alumnosVinculados.map((h) => seguro(getAsistenciaHija(h.alumno_id), null).then((r) => [h.alumno_id, r]))),
      Promise.all(alumnosVinculados.map((h) => seguro(getEvaluaciones(h.alumno_id), []).then((r) => [h.alumno_id, r]))),
      seguro(getEventos(hoyLocalISO()), []),
    ]).then(([asis, evals, eventos]) => calcularNotificaciones({
      hijas: alumnosVinculados,
      asistencias: Object.fromEntries(asis),
      evaluaciones: Object.fromEntries(evals),
      eventos,
    }))

    return Promise.allSettled([getNotificaciones(), calculo]).then(([resServidor, resCalculadas]) => {
      if (resServidor.status === 'fulfilled') {
        setDelServidor(resServidor.value.items)
        setNoLeidasServidor(resServidor.value.no_leidas)
      }
      if (resCalculadas.status === 'fulfilled') {
        setCalculadas(resCalculadas.value)
      }
      const fallida = [resServidor, resCalculadas].find((r) => r.status === 'rejected')
      setError(fallida?.reason ?? null)
    })
  }, [alumnosVinculados])

  useEffect(() => {
    setCargando(true)
    setError(null)
    cargarTodo().finally(() => setCargando(false))
  }, [cargarTodo])

  const notifs = useMemo(() => {
    const servidor = delServidor.map((n) => ({
      id: n.id,
      origen: 'server',
      tipo: tipoVisualDeBackend(n.tipo),
      titulo: n.titulo,
      mensaje: n.cuerpo,
      ctaRuta: n.enlace,
      fecha: fechaLocalDeDatetime(n.fecha),
      leida: n.leida,
      orden: new Date(n.fecha).getTime(),
    }))
    // 'T12:00:00': mediodía local para que el orden entre calculadas no
    // dependa de a qué hora del día se calcula "hoy" (evita que caigan del
    // lado equivocado de la medianoche al mezclarse con fechas del servidor).
    const locales = calculadas.map((n) => ({
      ...n,
      origen: 'local',
      leida: leidasLocal.has(n.id),
      orden: new Date(`${n.fecha}T12:00:00`).getTime(),
    }))
    return [...servidor, ...locales].sort((a, b) => b.orden - a.orden)
  }, [delServidor, calculadas, leidasLocal])

  const noLeidasLocal = calculadas.filter((n) => !leidasLocal.has(n.id)).length
  const noLeidas = noLeidasServidor + noLeidasLocal

  async function marcarLeida(n) {
    if (n.leida) return
    if (n.origen === 'local') {
      setLeidasLocal((prev) => {
        const nuevas = new Set(prev).add(n.id)
        guardarLeidasLocal(nuevas)
        return nuevas
      })
      return
    }
    setDelServidor((prev) => prev.map((x) => (x.id === n.id ? { ...x, leida: true } : x)))
    setNoLeidasServidor((prev) => Math.max(0, prev - 1))
    try {
      await marcarNotificacionLeida(n.id)
    } catch {
      setDelServidor((prev) => prev.map((x) => (x.id === n.id ? { ...x, leida: false } : x)))
      setNoLeidasServidor((prev) => prev + 1)
    }
  }

  async function marcarTodas() {
    const previoServidor = delServidor
    const previoNoLeidas = noLeidasServidor
    setDelServidor((prev) => prev.map((x) => ({ ...x, leida: true })))
    setNoLeidasServidor(0)
    setLeidasLocal((prev) => {
      const nuevas = new Set([...prev, ...calculadas.map((n) => n.id)])
      guardarLeidasLocal(nuevas)
      return nuevas
    })
    try {
      await marcarTodasLeidas()
    } catch {
      setDelServidor(previoServidor)
      setNoLeidasServidor(previoNoLeidas)
    }
  }

  // Sin tocar `cargando`: la usa el pago online para que la campana se
  // actualice sola apenas se acredita una cuota, sin tapar la pantalla con
  // el Skeleton de la carga inicial.
  return { notifs, noLeidas, cargando, error, marcarLeida, marcarTodas, recargar: cargarTodo }
}
