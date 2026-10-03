import { useState, useEffect } from 'react'
import { getAsistenciaHija } from '../api/client'

export function useAsistencias(alumnoId, mes) {
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setCargando(true)
    setError(null)
    getAsistenciaHija(alumnoId, mes).then(setDatos).catch(setError).finally(() => setCargando(false))
  }, [alumnoId, mes])

  return { asistencia: datos, cargando, error }
}
