import { useState, useEffect, useCallback } from 'react'
import { getCuentaCorriente, getPagosHija } from '../api/client'

export function useCargos(alumnoId) {
  const [cuentaCorriente, setCuentaCorriente] = useState(null)
  const [pagos, setPagos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Devuelve los datos frescos (no solo los deja en el estado): el flujo de
  // pago online necesita el pago recién acreditado apenas llega, sin esperar
  // al próximo render para leerlo de `pagos`.
  const recargar = useCallback(() => {
    return Promise.all([getCuentaCorriente(alumnoId), getPagosHija(alumnoId)])
      .then(([cc, pagosData]) => {
        setCuentaCorriente(cc)
        setPagos(pagosData)
        return { cuentaCorriente: cc, pagos: pagosData }
      })
  }, [alumnoId])

  useEffect(() => {
    setCargando(true)
    setError(null)
    recargar().catch(setError).finally(() => setCargando(false))
  }, [recargar])

  return { cuentaCorriente, pagos, cargando, error, recargar }
}
