import { useState, useEffect } from 'react'
import { getEvaluaciones } from '../api/client'

export function useEvaluaciones(alumnoId) {
  const [evaluaciones, setEvaluaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setCargando(true)
    setError(null)
    getEvaluaciones(alumnoId).then(setEvaluaciones).catch(setError).finally(() => setCargando(false))
  }, [alumnoId])

  return { evaluaciones, cargando, error }
}
