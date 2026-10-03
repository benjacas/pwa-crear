import { useState, useEffect } from 'react'
import { getEventos } from '../api/client'
import { hoyLocalISO } from '../utils/format'

// desde=hoy: /portal/eventos filtra "de esa fecha en adelante" — no tiene
// sentido mostrarle a una familia eventos que ya pasaron en la cartelera.
export function useEventos() {
  const [eventos, setEventos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const hoy = hoyLocalISO()
    getEventos(hoy).then(setEventos).catch(setError).finally(() => setCargando(false))
  }, [])

  return { eventos, cargando, error }
}
