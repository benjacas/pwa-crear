import { useContext, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { AlumnoActivoContext } from '../context/AlumnoActivoContext'
import { getMisHijas } from '../api/client'
import Spinner from '../components/ui/Spinner'

export default function RequireRole({ children }) {
  const location = useLocation()
  const { accessToken, logout } = useContext(AuthContext)
  const { alumnoActivo, alumnosVinculados, setAlumnosVinculados, setAlumnoActivo } = useContext(AlumnoActivoContext)
  const [verificando, setVerificando] = useState(true)

  useEffect(() => {
    if (!accessToken) { setVerificando(false); return }
    if (alumnosVinculados.length > 0) { setVerificando(false); return } // ya poblado, viene de un login recién hecho
    // /cambiar-clave no necesita alumnos vinculados — no tiene sentido
    // poblarlos (ni cerrar la sesión si falla) antes de que la clave
    // provisoria se haya cambiado.
    if (location.pathname === '/cambiar-clave') { setVerificando(false); return }

    getMisHijas()
      .then((alumnos) => {
        setAlumnosVinculados(alumnos)
        // Repoblar la lista no alcanza para saber CUÁL alumno estaba
        // elegido antes de la recarga — se restaura acá mismo (mismo
        // callback, no un efecto aparte reaccionando al cambio de
        // alumnosVinculados) para que quede resuelto antes de sacar el
        // spinner. Hacerlo en un efecto separado deja una carrera real:
        // "verificando ya pasó a false pero alumnoActivo todavía no se
        // restauró" manda de más al selector, aunque haya 1 solo alumno
        // guardado de una sesión anterior.
        const idGuardado = localStorage.getItem('crear_alumno_activo_id')
        const recordado = alumnos.find((a) => a.alumno_id === idGuardado)
        if (recordado) setAlumnoActivo(recordado)
      })
      .catch(() => logout()) // token vencido o inválido — no queda otra que volver a loguearse
      .finally(() => setVerificando(false))
  }, [accessToken])

  if (!accessToken) return <Navigate to="/login" replace />
  if (verificando) return <Spinner className="min-h-svh" />
  // El propio /seleccionar-alumno y /cambiar-clave también pasan por este
  // guard (necesitan token) — pero no hay que exigirles "ya tener alumno
  // elegido": ni tiene sentido antes de cambiar una clave provisoria, ni
  // a la pantalla que justamente existe para elegirlo (si no, redirige a
  // sí misma en bucle).
  if (!alumnoActivo && location.pathname !== '/seleccionar-alumno' && location.pathname !== '/cambiar-clave') {
    return <Navigate to="/seleccionar-alumno" replace />
  }
  return children
}
