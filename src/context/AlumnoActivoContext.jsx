import { createContext, useContext, useEffect, useState } from 'react'
import { AuthContext } from './AuthContext'

const ALUMNO_ACTIVO_ID_KEY = 'crear_alumno_activo_id'

export const AlumnoActivoContext = createContext(null)

export function AlumnoActivoProvider({ children }) {
  // Arranca vacío/null a propósito (no con el mock): RequireRole usa
  // `alumnosVinculados.length === 0` para saber si todavía no repobló
  // desde /portal/hijas, y `!alumnoActivo` para saber si hace
  // falta elegir alumno — si acá default'áramos al mock, esos dos
  // chequeos nunca se cumplirían y una recarga de página se quedaría
  // mostrando datos de Sofía (el mock) sin importar quién esté logueado
  // de verdad. Ver Claude.md, "Rehidratar la sesión al recargar".
  const [alumnosVinculados, setAlumnosVinculados] = useState([])
  const [alumnoActivo, setAlumnoActivoState] = useState(null)

  // Este provider queda montado entre /login y el portal (layout route en
  // App.jsx), así que su estado sobrevive al logout: sin este reset, el
  // siguiente usuario que se loguea en la misma pestaña entra con las
  // alumnas del anterior, porque RequireRole no vuelve a pedir
  // /portal/hijas si alumnosVinculados ya tiene datos.
  const { accessToken } = useContext(AuthContext)
  useEffect(() => {
    if (!accessToken) {
      setAlumnosVinculados([])
      setAlumnoActivoState(null)
    }
  }, [accessToken])

  // Guarda el id elegido en localStorage (no acá el objeto entero: la
  // fuente de verdad es siempre lo que devuelve el backend, esto es solo
  // "cuál" para poder restaurarlo). Quien restaura después de una recarga
  // es RequireRole, no este contexto — ver el comentario ahí sobre la
  // carrera que causaba volver al selector de más.
  function setAlumnoActivo(alumno) {
    setAlumnoActivoState(alumno)
    if (alumno) localStorage.setItem(ALUMNO_ACTIVO_ID_KEY, alumno.alumno_id)
  }

  function actualizarAlumnoActivo(cambios) {
    setAlumnoActivoState((prev) => ({ ...prev, ...cambios }))
    setAlumnosVinculados((prev) => prev.map((a) => (a.alumno_id === alumnoActivo.alumno_id ? { ...a, ...cambios } : a)))
  }

  return (
    <AlumnoActivoContext.Provider
      value={{ alumnoActivo, setAlumnoActivo, alumnosVinculados, setAlumnosVinculados, actualizarAlumnoActivo }}
    >
      {children}
    </AlumnoActivoContext.Provider>
  )
}
