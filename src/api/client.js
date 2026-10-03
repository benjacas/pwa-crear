const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Una sola renovación en vuelo a la vez: si varias pantallas piden datos al
// mismo tiempo y el access token venció, no hay que disparar /auth/refresh
// una vez por cada 401 — todas esperan la misma promesa y reintentan con el
// token que ella deje.
let renovacionEnCurso = null

// El cuerpo del error importa: DominioException del backend responde
// { codigo, mensaje, detalles } (ej. ERR_SIN_CAMBIOS), y un 422 de validación
// de Pydantic responde el shape default de FastAPI, { detail: [...] } (o
// detail como string). Sin esto, cualquier error de negocio le llegaba al
// usuario como "Error 400" en vez del mensaje real del backend.
async function erroDeRespuesta(res) {
  let cuerpo = null
  try { cuerpo = await res.json() } catch { /* sin cuerpo o no es JSON */ }
  let mensaje = cuerpo?.mensaje
  if (!mensaje && cuerpo?.detail) {
    mensaje = Array.isArray(cuerpo.detail) ? cuerpo.detail.map((d) => d.msg).join(' ') : cuerpo.detail
  }
  const error = new Error(mensaje || `Error ${res.status}`)
  error.status = res.status
  error.codigo = cuerpo?.codigo
  return error
}

async function fetchConToken(url, options = {}) {
  const token = localStorage.getItem('crear_access')
  let res = await fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${token}` } })

  if (res.status === 401) {
    if (!renovacionEnCurso) {
      renovacionEnCurso = apiRefresh(localStorage.getItem('crear_refresh'))
        .then((data) => {
          localStorage.setItem('crear_access', data.access_token)
          localStorage.setItem('crear_refresh', data.refresh_token)
          return data.access_token
        })
        .catch(() => {
          // el refresh también murió — no hay vuelta, hay que loguearse de nuevo
          localStorage.clear()
          window.location.href = '/login'
          throw new Error('sesión vencida')
        })
        .finally(() => { renovacionEnCurso = null })
    }
    const nuevoToken = await renovacionEnCurso
    res = await fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${nuevoToken}` } })
  }

  if (!res.ok) throw await erroDeRespuesta(res)
  // cambiar-clave, logout, 2fa/desactivar, etc. responden 204 sin cuerpo — res.json() rompería.
  if (res.status === 204) return null
  return res.json()
}

export async function apiLogin(email, password) {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error('Email o contraseña incorrectos')
  return res.json()
}

export async function apiLogin2FA(desafio, codigo) {
  const res = await fetch(`${API_URL}/api/v1/auth/login/2fa`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ desafio, codigo }),
  })
  if (!res.ok) throw new Error('Código incorrecto')
  return res.json()
}

export async function apiRefresh(refreshToken) {
  const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!res.ok) throw new Error('Sesión vencida')
  return res.json()
}

export async function apiCambiarClave(claveActual, claveNueva) {
  return fetchConToken(`${API_URL}/api/v1/auth/cambiar-clave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clave_actual: claveActual, clave_nueva: claveNueva }),
  })
}

// El nombre del header de Perfil sale de acá (UsuarioActualResponse) — es el
// único dato "quién soy" que expone el backend real; no hay /tutores/me.
export async function getUsuarioActual() {
  return fetchConToken(`${API_URL}/api/v1/auth/me`)
}

export async function getMisHijas() {
  return fetchConToken(`${API_URL}/api/v1/portal/hijas`)
}

// EventoResponse[]: { id, nombre, tipo, fecha, lugar, descripcion, created_at }
// — sin hora, sin mapaAsientos/fechaLimitePago (eso era del mock viejo del
// módulo de compra, que este endpoint no tiene). El backend ya excluye los
// de tipo "examen" (uso interno), no hace falta filtrarlos acá.
export async function getEventos(desde) {
  const query = desde ? `?desde=${desde}` : ''
  return fetchConToken(`${API_URL}/api/v1/portal/eventos${query}`)
}

// FeriadoResponse[]: { fecha, nombre, tipo }. Mismo endpoint que usa el
// personal para su propio calendario (GET /calendario/feriados) — el rol
// tutor también está habilitado (ver ROLES_FAMILIA en el backend).
export async function getFeriados(anio) {
  return fetchConToken(`${API_URL}/api/v1/calendario/feriados?anio=${anio}`)
}

export async function getCuentaCorriente(alumnoId) {
  return fetchConToken(`${API_URL}/api/v1/portal/hijas/${alumnoId}/cuenta-corriente`)
}

export async function getPagosHija(alumnoId) {
  return fetchConToken(`${API_URL}/api/v1/portal/hijas/${alumnoId}/pagos`)
}

export async function getAsistenciaHija(alumnoId, mes) {
  const query = mes ? `?mes=${mes}` : ''
  return fetchConToken(`${API_URL}/api/v1/portal/hijas/${alumnoId}/asistencia${query}`)
}

// TutorResponse: mi propia ficha de tutor (datos de contacto), no confundir
// con getUsuarioActual() (/auth/me, el login) ni con getMisHijas() (mis alumnas).
export async function getMiPerfilTutor() {
  return fetchConToken(`${API_URL}/api/v1/portal/perfil`)
}

export async function actualizarMiPerfil(datos) {
  return fetchConToken(`${API_URL}/api/v1/portal/perfil`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  })
}

export async function descargarRecibo(alumnoId, pagoId) {
  const token = localStorage.getItem('crear_access')
  const res = await fetch(`${API_URL}/api/v1/portal/hijas/${alumnoId}/pagos/${pagoId}/recibo.pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('No se pudo descargar el recibo')
  return res.blob()
}

// EvaluacionDeLaHija[]: { id, nombre, fecha, clases: string[], criterios,
// calificaciones }. Ordenados por fecha descendente del lado del backend
// (Evento.fecha.desc() en examenes_de_alumna) — no hace falta ordenar acá.
export async function getEvaluaciones(alumnoId) {
  return fetchConToken(`${API_URL}/api/v1/portal/hijas/${alumnoId}/evaluaciones`)
}
