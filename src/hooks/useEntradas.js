import { useState, useEffect, useCallback } from 'react'
import { getEntradas } from '../api/client'

// Sin alumnoId: /portal/entradas es de toda la familia, no de una hija
// puntual — no hace falta re-pedir nada al cambiar de alumna activa.
export function useEntradas() {
  const [compras, setCompras] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const recargar = useCallback(() => {
    return getEntradas().then((data) => {
      setCompras(data)
      return { compras: data }
    })
  }, [])

  useEffect(() => {
    setCargando(true)
    setError(null)
    recargar().catch(setError).finally(() => setCargando(false))
  }, [recargar])

  return { compras, cargando, error, recargar }
}
