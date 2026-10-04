import { useContext, useEffect, useState } from 'react'
import { AlumnoActivoContext } from '../context/AlumnoActivoContext'
import { getComisionesDisponibles, getMisSolicitudes, solicitarInscripcion } from '../api/client'

export function useClasesDisponibles() {
  const { alumnoActivo } = useContext(AlumnoActivoContext)
  const alumnoId = alumnoActivo?.alumno_id
  const [comisiones, setComisiones] = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!alumnoId) { setCargando(false); return }
    setCargando(true)
    setError(null)
    Promise.all([getComisionesDisponibles(), getMisSolicitudes(alumnoId)])
      .then(([com, sol]) => { setComisiones(com); setSolicitudes(sol) })
      .catch(setError)
      .finally(() => setCargando(false))
  }, [alumnoId])

  // Agrega la solicitud devuelta al estado local (al principio, mismo
  // orden que listar_de_alumna del backend: más reciente primero) para
  // que el botón cambie sin esperar un refetch ni recargar la página.
  async function solicitar(comisionId, mensaje) {
    const nueva = await solicitarInscripcion(alumnoId, comisionId, mensaje)
    setSolicitudes((prev) => [nueva, ...prev])
    return nueva
  }

  return { comisiones, solicitudes, cargando, error, solicitar }
}
