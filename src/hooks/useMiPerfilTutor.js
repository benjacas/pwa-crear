import { useState, useEffect } from 'react'
import { getMiPerfilTutor, actualizarMiPerfil } from '../api/client'

export function useMiPerfilTutor() {
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getMiPerfilTutor().then(setPerfil).catch(setError).finally(() => setCargando(false))
  }, [])

  async function actualizar(datos) {
    const actualizado = await actualizarMiPerfil(datos)
    setPerfil(actualizado)
    return actualizado
  }

  return { perfil, cargando, error, actualizar }
}
