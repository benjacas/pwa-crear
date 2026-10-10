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

// erroDeRespuesta(), no un mensaje fijo: Login.jsx necesita distinguir 401
// (credenciales) de 429 (demasiados intentos, con el mensaje real del
// backend — trae los minutos de espera) de 5xx/sin conexión (nada que ver
// con la contraseña) por el `.status`, no puede hacerlo si acá ya se pierde.
export async function apiLogin(email, password) {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw await erroDeRespuesta(res)
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

// VestuarioDeLaHija[]: { id, descripcion, costo_total, cantidad_cuotas,
// saldo_total, listo_para_entrega, cuotas: CuotaVestuarioDeLaFamilia[],
// pagos: PagoVestuarioDeLaFamilia[] } — el campo se llama `cuotas`, no
// `cargos`. Estados reales de cuota de vestuario: PENDIENTE/PAGO_PARCIAL/
// PAGADO (sin EN_MORA — vestuario no tiene mora, confirmado contra
// app/services/vestuario_service.py).
export async function getVestuarioHija(alumnoId) {
  return fetchConToken(`${API_URL}/api/v1/portal/hijas/${alumnoId}/vestuario`)
}

export async function getAsistenciaHija(alumnoId, mes) {
  const query = mes ? `?mes=${mes}` : ''
  return fetchConToken(`${API_URL}/api/v1/portal/hijas/${alumnoId}/asistencia${query}`)
}

// ComisionResponse[], ya sin profesorados y sin las que están sin cupo —
// el propio backend las excluye (cupo_maximo - inscriptos <= 0), nunca
// llegan acá con vacantes_disponibles: 0 (confirmado leyendo
// app/api/v1/portal.py antes de asumirlo).
export async function getComisionesDisponibles() {
  return fetchConToken(`${API_URL}/api/v1/portal/comisiones-disponibles`)
}

// SolicitudInscripcionDeLaHija[], estado real: pendiente/atendida/descartada
// (migración 035_solicitudes_inscripcion.py) — no solo pendiente/descartada.
export async function getMisSolicitudes(alumnoId) {
  return fetchConToken(`${API_URL}/api/v1/portal/hijas/${alumnoId}/solicitudes-inscripcion`)
}

// El backend NO rechaza pedir un lugar en una comisión donde la alumna ya
// está inscripta (solo valida que no haya otra solicitud pendiente para la
// misma alumna+comisión) — el filtro de "no mostrar lo que ya cursa" del
// lado del cliente es la única defensa real contra eso, no un adorno.
export async function solicitarInscripcion(alumnoId, comisionId, mensaje) {
  return fetchConToken(`${API_URL}/api/v1/portal/hijas/${alumnoId}/solicitudes-inscripcion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comision_id: comisionId, mensaje: mensaje || null }),
  })
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

// OrdenPagoDeLaFamilia: { id, estado, monto, importe, recargo, checkout_url }.
// estado: CREADA (checkout_url con valor) | PAGADA | CONFLICTO (acreditado
// por Mercado Pago pero no imputado — requiere revisión manual de la
// academia). Reutiliza la orden activa si ya existía una para esta cuota
// (confirmado en cobro_electronico_service.crear_enlace_de: devuelve la
// existente en vez de crear otra) — llamar esto dos veces no duplica nada.
export async function crearOrdenPagoCuota(alumnoId, cuotaId) {
  return fetchConToken(`${API_URL}/api/v1/portal/hijas/${alumnoId}/cuotas/${cuotaId}/orden-pago`, {
    method: 'POST',
  })
}

// Mismo mecanismo que crearOrdenPagoCuota (reutiliza la orden activa del
// cargo si ya existía una), pero para una cuota de vestuario — cada cargo
// se paga por separado y por el saldo completo, sin importar el orden
// (igual que en mostrador: VestuarioService.registrar_pago no exige pagar
// las cuotas del traje en orden).
export async function crearOrdenPagoVestuario(alumnoId, cargoId) {
  return fetchConToken(`${API_URL}/api/v1/portal/hijas/${alumnoId}/vestuario/${cargoId}/orden-pago`, {
    method: 'POST',
  })
}

// Genérico: sirve tanto para una orden de cuota como de vestuario (la URL
// solo necesita el id de la orden, no a qué concepto pertenece).
// Si la orden sigue CREADA, el backend le pregunta a Mercado Pago antes de
// contestar (no hace falta esperar al webhook) — ver portal_service.orden_pago.
export async function getOrdenPago(alumnoId, ordenId) {
  return fetchConToken(`${API_URL}/api/v1/portal/hijas/${alumnoId}/ordenes-pago/${ordenId}`)
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

// NotificacionesResponse: { no_leidas, items: NotificacionResponse[] } — solo
// CUOTA_NUEVA/CUOTA_VENCIDA/PAGO_RECIBIDO para el rol tutor, últimas 30.
// no_leidas cuenta TODAS las pendientes, no solo las de items.
export async function getNotificaciones() {
  return fetchConToken(`${API_URL}/api/v1/notificaciones`)
}

// Ambas responden 204 sin cuerpo (ya cubierto por fetchConToken).
export async function marcarNotificacionLeida(id) {
  return fetchConToken(`${API_URL}/api/v1/notificaciones/${id}/leida`, { method: 'POST' })
}

export async function marcarTodasLeidas() {
  return fetchConToken(`${API_URL}/api/v1/notificaciones/leidas`, { method: 'POST' })
}

// CompraEntradasDeLaFamilia[]: { id, evento: {nombre, fecha}, funcion:
// {fecha, hora, sala_nombre} | null, cantidad, estado (PENDIENTE | PAGADA |
// ANULADA, aunque esta última no llega nunca — el backend la filtra antes
// de responder), cargos: [{numero, fecha_vencimiento, estado, importe}],
// entradas: [{numero, codigo, butaca: {fila, numero} | null, usada}]
// (vacío si la compra todavía no está PAGADA — las entradas se emiten
// recién ahí), puede_elegir_butacas, motivo_bloqueo, puede_cambiar_butacas,
// cambios_restantes (0 o 1), motivo_cambio. No va alumno_id en la URL: es
// de toda la familia, no de una hija puntual (confirmado leyendo
// portal_service.entradas()).
export async function getEntradas() {
  return fetchConToken(`${API_URL}/api/v1/portal/entradas`)
}

// PlanoDeLaCompra: { sala_nombre, butacas: [{id, fila, numero, tipo:
// "butaca"|"silla_ruedas", fila_orden, col}], ocupadas: uuid[] (de otras
// compras de esta función, nunca de quién), propias: uuid[] (las de esta
// compra, para "modo cambiar") }. fila_orden: de adelante hacia atrás
// (0 = la más cercana al escenario, confirmado en el docstring del
// backend). col: izquierda a derecha, con huecos a propósito = pasillos.
// cache: 'no-store' a propósito: nada de caché HTTP acá (ni del service
// worker — vite.config.js no tiene runtimeCaching, solo precachea el app
// shell — ni del navegador). Un plano viejo mostraría libre una butaca que
// otra familia ya confirmó: sin reserva temporal, es el único dato donde
// un segundo de desactualización manda a alguien a elegir algo imposible.
export async function getPlano(compraId) {
  return fetchConToken(`${API_URL}/api/v1/portal/entradas/${compraId}/plano`, { cache: 'no-store' })
}

// Devuelve la compra ya con las butacas puestas (mismo shape que un item
// de getEntradas()) — no hace falta un segundo pedido para refrescarla,
// aunque igual se llama a useEntradas().recargar() para que la lista
// completa quede consistente. Sin reserva temporal: gana quien confirma
// primero (ERR_BUTACA_OCUPADA si otra familia se adelantó).
export async function elegirButacas(compraId, butacaIds) {
  return fetchConToken(`${API_URL}/api/v1/portal/entradas/${compraId}/butacas`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ butaca_ids: butacaIds }),
  })
}

// Igual que elegirButacas() pero con el límite de un cambio por compra
// (ERR_CAMBIO_BUTACAS_AGOTADO al segundo intento) — el backend no exime el
// cambio aunque se pidan las mismas butacas que ya tenía, así que evitar
// ese caso es responsabilidad de la UI (botón "Confirmar" deshabilitado si
// la selección es idéntica a la actual). Devuelve la compra actualizada
// más `aviso` (texto del backend sobre que el QR no cambia).
export async function cambiarButacas(compraId, butacaIds) {
  return fetchConToken(`${API_URL}/api/v1/portal/entradas/${compraId}/cambio-butacas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ butaca_ids: butacaIds }),
  })
}

// Pública a propósito: nadie que escanea un QR en la puerta tiene sesión
// iniciada, así que esto NO pasa por fetchConToken (sin Authorization, sin
// renovar nada). Un 404 acá es un resultado esperado ("esta entrada no
// existe o se anuló"), no un error — se devuelve null en vez de lanzar,
// para no arrastrar el manejo de sesión vencida de fetchConToken a una
// ruta que no tiene sesión.
export async function getEntradaPublica(codigo) {
  const res = await fetch(`${API_URL}/api/v1/entradas/publica/${encodeURIComponent(codigo)}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}
