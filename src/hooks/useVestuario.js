import { useState, useEffect, useCallback } from 'react'
import { getVestuarioHija } from '../api/client'

export function useVestuario(alumnoId) {
  const [cuentas, setCuentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Devuelve los datos frescos (no solo los deja en el estado): el flujo de
  // pago online necesita leer el estado recién acreditado de una cuota en
  // el mismo tick en que se resuelve, no en el próximo render (mismo patrón
  // que useCargos.recargar()).
  const recargar = useCallback(() => {
    return getVestuarioHija(alumnoId).then((data) => {
      setCuentas(data)
      return { cuentas: data }
    })
  }, [alumnoId])

  useEffect(() => {
    setCargando(true)
    setError(null)
    recargar().catch(setError).finally(() => setCargando(false))
  }, [recargar])

  return { cuentas, cargando, error, recargar }
}
