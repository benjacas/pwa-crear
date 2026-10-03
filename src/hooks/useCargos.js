import { useState, useEffect } from 'react'
import { getCuentaCorriente, getPagosHija } from '../api/client'

export function useCargos(alumnoId) {
  const [cuentaCorriente, setCuentaCorriente] = useState(null)
  const [pagos, setPagos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setCargando(true)
    setError(null)
    Promise.all([getCuentaCorriente(alumnoId), getPagosHija(alumnoId)])
      .then(([cc, pagosData]) => { setCuentaCorriente(cc); setPagos(pagosData) })
      .catch(setError)
      .finally(() => setCargando(false))
  }, [alumnoId])

  return { cuentaCorriente, pagos, cargando, error }
}
