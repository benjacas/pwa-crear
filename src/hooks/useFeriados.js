import { useState, useEffect } from 'react'
import { getFeriados } from '../api/client'

// Toma el año, no el mes: si el calendario navega diciembre -> enero, hace
// falta volver a pedir (los feriados de un año no sirven para el otro),
// pero moverse entre meses del mismo año no debería disparar un fetch nuevo.
export function useFeriados(anio) {
  const [feriados, setFeriados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setCargando(true)
    setError(null)
    getFeriados(anio).then(setFeriados).catch(setError).finally(() => setCargando(false))
  }, [anio])

  return { feriados, cargando, error }
}
