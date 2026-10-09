import { useState, useEffect, useCallback } from 'react'
import { getPlano } from '../api/client'

// Sin reserva temporal del lado del backend (gana quien confirma primero):
// por eso se vuelve a pedir el plano al volver a la pestaña, típico cuando
// alguien se fue a mirar otra cosa y vuelve a elegir — sin esto podría
// tocar una butaca que mientras tanto se vendió.
export function usePlano(compraId) {
  const [plano, setPlano] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const recargar = useCallback(() => {
    if (!compraId) return Promise.resolve()
    return getPlano(compraId).then((data) => {
      setPlano(data)
      return data
    })
  }, [compraId])

  useEffect(() => {
    setCargando(true)
    setError(null)
    recargar().catch(setError).finally(() => setCargando(false))
  }, [recargar])

  useEffect(() => {
    function alVolverElFoco() {
      if (document.visibilityState === 'visible') recargar().catch(setError)
    }
    document.addEventListener('visibilitychange', alVolverElFoco)
    return () => document.removeEventListener('visibilitychange', alVolverElFoco)
  }, [recargar])

  return { plano, cargando, error, recargar }
}
