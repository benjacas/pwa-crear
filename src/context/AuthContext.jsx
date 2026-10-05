import { createContext, useState } from 'react'
import { apiLogin, apiLogin2FA, apiRefresh } from '../api/client'

// localStorage en vez de una cookie httpOnly: decisión consciente, no el
// estándar de oro. Una cookie httpOnly es más segura contra XSS (el JS de
// la página ni siquiera puede leerla), pero necesita configuración extra
// del lado del backend (SameSite, Secure, dominio compartido). Para el
// alcance de este proyecto (una app de facultad, no un sistema bancario)
// localStorage es razonable — ver Claude.md, "Fase 3b", si esto cambia.
export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('crear_access'))
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('crear_refresh'))
  const [rol, setRol] = useState(() => localStorage.getItem('crear_rol'))
  const [nombre, setNombre] = useState(() => localStorage.getItem('crear_nombre'))
  const [debeCambiarClave, setDebeCambiarClave] = useState(false)

  function guardarSesion(data) {
    localStorage.setItem('crear_access', data.access_token)
    localStorage.setItem('crear_refresh', data.refresh_token)
    localStorage.setItem('crear_rol', data.rol)
    localStorage.setItem('crear_nombre', data.nombre_completo)
    setAccessToken(data.access_token)
    setRefreshToken(data.refresh_token)
    setRol(data.rol)
    setNombre(data.nombre_completo)
    setDebeCambiarClave(data.debe_cambiar_clave)
  }

  async function login(email, password) {
    const data = await apiLogin(email, password)
    if (data.requiere_2fa) return data // { desafio, expira_en } — el login pasa a mostrar el paso 2
    guardarSesion(data)
    return data
  }

  async function loginConCodigo(desafio, codigo) {
    const data = await apiLogin2FA(desafio, codigo)
    guardarSesion(data)
    return data
  }

  async function refrescar() {
    // TokenResponse completo: a diferencia de otros backends, /auth/refresh
    // acá SÍ devuelve nombre_completo/rol reales (ver AuthService._emitir en
    // el backend) — no hace falta conservar los viejos a mano.
    const data = await apiRefresh(refreshToken)
    guardarSesion(data)
    return data.access_token
  }

  function logout() {
    ['crear_access', 'crear_refresh', 'crear_rol', 'crear_nombre'].forEach((k) => localStorage.removeItem(k))
    // No es de este contexto (vive en AlumnoActivoContext, ver "Rehidratar
    // la sesión" en Claude.md), pero es estado de la misma sesión — limpiar
    // acá evita que quede huérfano después de cerrar sesión.
    localStorage.removeItem('crear_alumno_activo_id')
    // Estado de lectura de las notificaciones calculadas localmente (ver
    // useNotificaciones.js) — es por usuario, no debe sobrevivir a un logout.
    localStorage.removeItem('crear_notifs_leidas')
    setAccessToken(null); setRefreshToken(null); setRol(null); setNombre(null); setDebeCambiarClave(false)
  }

  return (
    <AuthContext.Provider value={{ accessToken, rol, nombre, debeCambiarClave, login, loginConCodigo, refrescar, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
