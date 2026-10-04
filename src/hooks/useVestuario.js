import { useState, useEffect } from 'react'
import { getVestuarioHija } from '../api/client'

export function useVestuario(alumnoId) {
  const [cuentas, setCuentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setCargando(true)
    setError(null)
    getVestuarioHija(alumnoId).then(setCuentas).catch(setError).finally(() => setCargando(false))
  }, [alumnoId])

  return { cuentas, cargando, error }
}
