// Funciones puras de formateo — sin JSX, sin dependencias de React.

export function formatMoneda(monto) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(monto)
}

export function formatFecha(fechaISO, options = {}) {
  const { conAnio = true } = options
  const fecha = new Date(`${fechaISO}T00:00:00`)
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: conAnio ? 'numeric' : undefined,
  }).format(fecha)
}

// Fecha de hoy en horario local como 'YYYY-MM-DD'. `toISOString()` da la
// fecha en UTC, que en Argentina (UTC-3) queda un día adelantada durante la
// noche — comparar contra eso marcaba cargos como vencidos antes de tiempo.
export function hoyLocalISO() {
  const ahora = new Date()
  const offsetMs = ahora.getTimezoneOffset() * 60000
  return new Date(ahora.getTime() - offsetMs).toISOString().slice(0, 10)
}

// Días de calendario entre hoy (local) y `fechaISO` ('YYYY-MM-DD'): negativo
// si ya pasó. Ambas fechas a medianoche local, nada de horas — evita que un
// resto de milisegundos corra el redondeo un día para cualquier lado.
export function diasHasta(fechaISO) {
  const hoy = new Date(`${hoyLocalISO()}T00:00:00`)
  const fecha = new Date(`${fechaISO}T00:00:00`)
  return Math.round((fecha - hoy) / 86400000)
}

// 'HH:MM:SS' (o null) -> 'HH:MM'. Recorte de string, no Date: una hora sola
// (sin fecha) no tiene zona horaria que corregir, así que no hace falta
// nada más.
export function formatHora(horaISO) {
  return horaISO ? horaISO.slice(0, 5) : null
}

// Estados reales de CuotaResponse (ver database/migrations/005_modulo_cobros.sql):
// PENDIENTE, EN_MORA, PAGO_PARCIAL, PAGADA, CONDONADA — /cuenta-corriente
// solo devuelve las tres primeras (las cerradas no vienen en cuotas_pendientes).
const ESTADOS_CUOTA = {
  PENDIENTE: { label: 'Pendiente', classes: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  EN_MORA: { label: 'Vencida', classes: 'bg-red-50 text-red-700 ring-1 ring-red-200' },
  PAGO_PARCIAL: { label: 'Parcial', classes: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
}

export function infoEstadoCuota(estado) {
  return ESTADOS_CUOTA[estado] ?? ESTADOS_CUOTA.PENDIENTE
}

// Vestuario tiene su propio enum de estado — no reusar ESTADOS_CUOTA.
// Confirmado contra app/services/vestuario_service.py antes de armar este
// mapa: PENDIENTE/PAGO_PARCIAL/PAGADO, sin EN_MORA (vestuario no tiene
// mora) y "PAGADO" en masculino (cargo), no "PAGADA" (cuota) como el de
// arriba.
const ESTADOS_CUOTA_VESTUARIO = {
  PENDIENTE: { label: 'Pendiente', classes: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  PAGO_PARCIAL: { label: 'Parcial', classes: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  PAGADO: { label: 'Pagado', classes: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
}

export function infoEstadoCuotaVestuario(estado) {
  return ESTADOS_CUOTA_VESTUARIO[estado] ?? ESTADOS_CUOTA_VESTUARIO.PENDIENTE
}

// `icono` es una clave, no un componente — este módulo es puro (sin React).
// Quien renderiza (Pagos.jsx, ComprobanteModal.jsx) mapea la clave a un
// ícono real. Se usan íconos SVG en vez de emojis para no mezclar dos
// sistemas de íconos: todo el resto del repo (admin y portal) ya usa
// lucide-react para esto, no hay un set de íconos propios en components/ui/.
// Valores reales de PagoDeLaFamilia.medio_pago (ver 008_cobro_electronico.sql):
// EFECTIVO, TRANSFERENCIA, MERCADO_PAGO.
const METODOS_PAGO = {
  EFECTIVO: { label: 'Efectivo', icono: 'banknote' },
  TRANSFERENCIA: { label: 'Transferencia', icono: 'landmark' },
  MERCADO_PAGO: { label: 'Mercado Pago', icono: 'credit-card' },
}

export function infoMetodoPago(metodo) {
  return METODOS_PAGO[metodo] ?? { label: metodo ?? '—', icono: 'banknote' }
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

export function formatDiaClase(fechaISO) {
  const fecha = new Date(fechaISO + 'T00:00:00')
  const dia = DIAS[fecha.getDay()]
  const [, mes, diaNum] = fechaISO.split('-')
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${diaNum}/${mes}`
}

export function formatMesLabel(periodo) {
  const texto = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(
    new Date(`${periodo}-01T00:00:00`)
  )
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// CalificacionDeLaHija.notas real: { [criterio_id]: nota }, sin escala
// propia por nota — la escala vive en el criterio correspondiente
// (CriterioResponse.escala_max), no en la calificación.
export function notaConEscala(nota, escalaMax) {
  return `${nota} / ${escalaMax}`
}

export function iniciales(nombreCompleto) {
  return nombreCompleto
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join('')
}

// `icono` es una clave, no un emoji — mismo criterio que `infoMetodoPago`:
// todo el repo usa lucide-react para íconos, así que se mapea a un ícono
// SVG real en la página que renderiza (Notificaciones.jsx), no acá.
// Los 6 tipos reales que arma calcularNotificaciones() — "horario" (el
// aviso de cambio de horario del mock viejo) ya no existe: necesita
// auditoría filtrada por alumno, que el backend no expone todavía para
// tutores (ver Claude.md, "Decisiones pendientes").
const TIPOS_NOTIFICACION = {
  cuota: { label: 'Pagos', classes: 'bg-amber-50 text-amber-600', icono: 'credit-card' },
  asistencia: { label: 'Asistencia', classes: 'bg-red-50 text-red-600', icono: 'alert-triangle' },
  evaluacion: { label: 'Evaluaciones', classes: 'bg-purple-50 text-purple-600', icono: 'star' },
  evento: { label: 'Eventos', classes: 'bg-pink-50 text-pink-600', icono: 'party-popper' },
  pago: { label: 'Pagos', classes: 'bg-emerald-50 text-emerald-600', icono: 'check-circle' },
  apto_fisico: { label: 'Apto físico', classes: 'bg-rose-50 text-rose-600', icono: 'shield-alert' },
}

export function infoTipoNotificacion(tipo) {
  return TIPOS_NOTIFICACION[tipo] ?? { label: 'Aviso', classes: 'bg-gray-100 text-gray-500', icono: 'bell' }
}

// Notificaciones de cuota/pago vienen ahora del backend (NotificacionService,
// solo CUOTA_NUEVA/CUOTA_VENCIDA/PAGO_RECIBIDO para el rol tutor) en vez de
// calcularse acá. Se traducen a los mismos "tipo" visuales que ya usaba
// TIPOS_NOTIFICACION para no duplicar clases/íconos. El fallback a 'general'
// (sin entrada propia en TIPOS_NOTIFICACION, cae al "Aviso" genérico de
// infoTipoNotificacion) es defensivo: ningún tipo actual de _de_la_familia()
// cae ahí, pero si el backend agrega uno nuevo la pantalla no debe romperse.
const TIPO_VISUAL_BACKEND = { CUOTA_NUEVA: 'cuota', CUOTA_VENCIDA: 'cuota', PAGO_RECIBIDO: 'pago' }
export const tipoVisualDeBackend = (tipo) => TIPO_VISUAL_BACKEND[tipo] ?? 'general'

// TipoEvento real (schemas/eventos.py): gala/festival/examen/otro — "examen"
// nunca llega acá, /portal/eventos ya lo excluye del lado del backend.
const TIPOS_EVENTO = {
  gala: { label: 'Gala', color: 'blue' },
  festival: { label: 'Festival', color: 'green' },
  otro: { label: 'Evento', color: 'gray' },
}

export function infoTipoEvento(tipo) {
  return TIPOS_EVENTO[tipo] ?? { label: 'Evento', color: 'gray' }
}

// Hasta la Tarea J, `fecha` siempre era un timestamp pasado (notificación ya
// emitida) — con calcularNotificaciones() puede venir del futuro (cuota por
// vencer, próximo evento), que esta función todavía no contemplaba: daba
// "Hace -7 días" para algo que pasa en 7 días, en vez de "En 7 días".
export function formatFechaRelativa(fechaISO) {
  const dias = Math.floor((Date.now() - new Date(fechaISO)) / 86400000)
  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Ayer'
  if (dias === -1) return 'Mañana'
  if (dias < 0) return `En ${-dias} días`
  if (dias < 7) return `Hace ${dias} días`
  return formatFecha(fechaISO.split('T')[0])
}

// dia_semana real del backend (enum dia_semana_enum): sin acentos, sin domingo.
const DIA_SEMANA_INDICE = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 }

// Fecha local 'YYYY-MM-DD' armada con los campos locales, no con
// toISOString() (que pasa por UTC y corre el día — ver "Convenciones de código").
function fechaLocalISO(anio, mes, dia) {
  return `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

// Las notificaciones del backend traen `fecha` como datetime con timezone
// (ej. 2026-10-05T01:00:00Z): un pago hecho a las 22hs de Argentina cae al
// día siguiente en UTC. new Date(iso) lo pasa a hora local del navegador
// (Argentina, UTC-3) y de ahí se arma el día calendario con fechaLocalISO
// (mes base 0, igual que getMonth()) — nada de .toISOString(), que vuelve a UTC.
export function fechaLocalDeInstante(iso) {
  const d = new Date(iso)
  return fechaLocalISO(d.getFullYear(), d.getMonth(), d.getDate())
}

// Vigencia del apto físico: 12 meses desde fecha_apto, con aviso los últimos 30 días. Deben coincidir con
// avisos_service.py del backend (MESES_VIGENCIA_APTO, DIAS_AVISO_APTO) — duplicados a mano acá porque no hay
// un endpoint de configuración accesible al tutor desde el portal.
const MESES_VIGENCIA_APTO = 12
const DIAS_AVISO_APTO = 30

export function estadoAptoFisico(hija) {
  if (!hija.apto_fisico || !hija.fecha_apto) {
    return { vigente: false, vencePronto: false, mensaje: 'No presentó apto físico.' }
  }
  // 'T00:00:00' en vez de pasarlo directo a Date(): mismo bug de UTC-vs-local de siempre si no.
  const vencimiento = new Date(`${hija.fecha_apto}T00:00:00`)
  vencimiento.setMonth(vencimiento.getMonth() + MESES_VIGENCIA_APTO)
  const vencimientoISO = fechaLocalISO(vencimiento.getFullYear(), vencimiento.getMonth(), vencimiento.getDate())
  const hoy = hoyLocalISO()
  const avisoDesde = new Date(vencimiento)
  avisoDesde.setDate(avisoDesde.getDate() - DIAS_AVISO_APTO)
  const avisoDesdeISO = fechaLocalISO(avisoDesde.getFullYear(), avisoDesde.getMonth(), avisoDesde.getDate())

  const vigente = vencimientoISO >= hoy
  return {
    vigente,
    vencePronto: vigente && avisoDesdeISO <= hoy,
    vencimientoISO,
    mensaje: vigente
      ? `Apto físico vigente hasta el ${formatFecha(vencimientoISO)}.`
      : `Apto físico vencido desde el ${formatFecha(vencimientoISO)} — hay que renovarlo.`,
  }
}

// clases: alumnoActivo.clases (ClaseDeLaHija). Una clase con horarios: []
// (comisión sin estructurar todavía) no genera ocurrencias.
export function ocurrenciasDeClaseEnMes(clases, anio, mes) {
  const diasEnMes = new Date(anio, mes + 1, 0).getDate()
  const ocurrencias = []
  for (const clase of clases) {
    for (const h of clase.horarios ?? []) {
      for (let dia = 1; dia <= diasEnMes; dia++) {
        if (new Date(anio, mes, dia).getDay() === DIA_SEMANA_INDICE[h.dia_semana]) {
          ocurrencias.push({
            tipo: 'clase',
            fecha: fechaLocalISO(anio, mes, dia),
            titulo: `${clase.disciplina} — ${clase.nivel}`,
            hora: h.hora_inicio.slice(0, 5),
            horaFin: h.hora_fin.slice(0, 5),
          })
        }
      }
    }
  }
  return ocurrencias
}

// Fuente de datos aparte de las clases (feriados nacionales, no algo que
// dependa de alumnoActivo) — se combinan recién donde se pintan
// (CalendarioMensual), no acá adentro de ocurrenciasDeClaseEnMes.
export function feriadosDelMes(feriados, anio, mes) {
  return feriados.filter((f) => {
    const fecha = new Date(f.fecha + 'T00:00:00')
    return fecha.getFullYear() === anio && fecha.getMonth() === mes
  })
}

export function proximosItems(clases, anio, mes, cantidad = 8) {
  const hoy = hoyLocalISO()
  return ocurrenciasDeClaseEnMes(clases, anio, mes)
    .filter((item) => item.fecha >= hoy)
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
    .slice(0, cantidad)
}

export function itemsDelDia(clases, anio, mes, fechaISO) {
  return ocurrenciasDeClaseEnMes(clases, anio, mes)
    .filter((o) => o.fecha === fechaISO)
    .sort((a, b) => a.hora.localeCompare(b.hora))
}

// Cuotas EN_MORA (alerta alta) o próximas a vencer en 3 días (alerta media),
// más la asistencia del mes si ya está por debajo del umbral que el backend
// resuelve (AsistenciaDeLaHija.bajo_umbral) — ya no se calcula acá, viene
// resuelto del servidor.
export function calcularAlertas({ cuotasPendientes, asistencia }) {
  const alertas = []
  const hoy = hoyLocalISO()
  const en3Dias = new Date()
  en3Dias.setDate(en3Dias.getDate() + 3)
  const en3DiasISO = `${en3Dias.getFullYear()}-${String(en3Dias.getMonth() + 1).padStart(2, '0')}-${String(en3Dias.getDate()).padStart(2, '0')}`

  for (const cuota of cuotasPendientes ?? []) {
    if (cuota.estado === 'EN_MORA') {
      alertas.push({
        id: `venc-${cuota.id}`, urgencia: 'alta',
        mensaje: `Tenés una cuota vencida: ${formatMesLabel(cuota.periodo.slice(0, 7))}.`,
        ctaLabel: 'Ver pagos', ctaRuta: '/pagos',
      })
    } else if (cuota.fecha_vencimiento >= hoy && cuota.fecha_vencimiento <= en3DiasISO) {
      alertas.push({
        id: `prox-${cuota.id}`, urgencia: 'media',
        mensaje: `Cuota de ${formatMesLabel(cuota.periodo.slice(0, 7))} vence el ${formatFecha(cuota.fecha_vencimiento)}.`,
        ctaLabel: 'Ver pagos', ctaRuta: '/pagos',
      })
    }
  }

  if (asistencia?.bajo_umbral) {
    alertas.push({
      id: 'asistencia-baja', urgencia: 'media',
      mensaje: `Tu asistencia este mes está en ${asistencia.porcentaje}%, por debajo del mínimo de ${asistencia.umbral_pct}%.`,
      ctaLabel: 'Ver asistencia', ctaRuta: '/asistencia',
    })
  }

  return alertas
    .sort((a, b) => (a.urgencia === 'alta' ? -1 : 1) - (b.urgencia === 'alta' ? -1 : 1))
    .slice(0, 2)
}

// Versión agregada de calcularAlertas() para Home: un tutor puede tener
// más de una hija (a diferencia del proyecto viejo, una sola por tutor),
// así que cada mensaje nombra a la hija — una alerta sin nombre sería
// ambigua con más de una vinculada. cuentasCorrientes/asistencias vienen
// indexadas por alumno_id (ver Home.jsx).
export function calcularAvisos({ hijas, cuentasCorrientes, asistencias }) {
  const avisos = []
  const hoy = hoyLocalISO()
  // en3Dias.toISOString() es el mismo bug de UTC-vs-local ya corregido
  // varias veces acá (ver "Convenciones de código") — se arma el string
  // desde los campos locales, nunca pasando por UTC.
  const en3Dias = new Date()
  en3Dias.setDate(en3Dias.getDate() + 3)
  const en3DiasISO = `${en3Dias.getFullYear()}-${String(en3Dias.getMonth() + 1).padStart(2, '0')}-${String(en3Dias.getDate()).padStart(2, '0')}`

  for (const hija of hijas) {
    const cuenta = cuentasCorrientes[hija.alumno_id]
    for (const cuota of cuenta?.cuotas_pendientes ?? []) {
      const mesCuota = formatMesLabel(cuota.periodo.slice(0, 7))
      if (cuota.fecha_vencimiento < hoy) {
        avisos.push({
          id: `venc-${cuota.id}`, urgencia: 'alta',
          mensaje: `${hija.nombre_completo}: cuota de ${mesCuota} vencida.`,
          ctaLabel: 'Ver pagos', ctaRuta: '/pagos',
        })
      } else if (cuota.fecha_vencimiento <= en3DiasISO) {
        avisos.push({
          id: `prox-${cuota.id}`, urgencia: 'media',
          mensaje: `${hija.nombre_completo}: cuota de ${mesCuota} vence el ${formatFecha(cuota.fecha_vencimiento)}.`,
          ctaLabel: 'Ver pagos', ctaRuta: '/pagos',
        })
      }
    }

    const asistencia = asistencias[hija.alumno_id]
    if (asistencia?.bajo_umbral) {
      avisos.push({
        id: `asis-${hija.alumno_id}`, urgencia: 'media',
        mensaje: `${hija.nombre_completo}: asistencia en ${asistencia.porcentaje}%, por debajo del mínimo de ${asistencia.umbral_pct}%.`,
        ctaLabel: 'Ver asistencia', ctaRuta: '/asistencia',
      })
    }

    const apto = estadoAptoFisico(hija)
    if (!apto.vigente || apto.vencePronto) {
      avisos.push({
        id: `apto-${hija.alumno_id}`, urgencia: apto.vigente ? 'media' : 'alta',
        mensaje: `${hija.nombre_completo}: ${apto.mensaje}`,
        ctaLabel: 'Ver perfil', ctaRuta: '/perfil',
      })
    }
  }

  return avisos
    .sort((a, b) => (a.urgencia === 'alta' ? -1 : 1) - (b.urgencia === 'alta' ? -1 : 1))
    .slice(0, 2)
}

// Fecha local 'YYYY-MM-DD' a partir de hoy + N días, sin pasar por UTC
// (mismo bug de UTC-vs-local corregido varias veces ya en este archivo).
function enNDiasISO(dias) {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + dias)
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

// Combina cuotas, asistencia, pagos, evaluaciones y eventos en una sola
// lista de notificaciones, más mensaje (combina y ordena, a diferencia de
// calcularAvisos() que recorta a 2 para Home) — hijas/cuentasCorrientes/
// asistencias/evaluaciones/pagos vienen indexados por alumno_id.
export function calcularNotificaciones({ hijas, asistencias, evaluaciones, eventos }) {
  const notifs = []
  const hoy = hoyLocalISO()
  const en14DiasISO = enNDiasISO(14)

  for (const hija of hijas) {
    const asistencia = asistencias[hija.alumno_id]
    if (asistencia?.bajo_umbral) {
      notifs.push({
        id: `asis-${hija.alumno_id}-${asistencia.mes}`, tipo: 'asistencia', fecha: hoy,
        titulo: 'Asistencia baja',
        mensaje: `${hija.nombre_completo}: asistencia en ${asistencia.porcentaje}%, por debajo del mínimo.`,
        ctaRuta: '/asistencia',
      })
    }

    const apto = estadoAptoFisico(hija)
    if (!apto.vigente || apto.vencePronto) {
      notifs.push({
        id: `apto-${hija.alumno_id}`, tipo: 'apto_fisico', fecha: apto.vencimientoISO ?? hoy,
        titulo: apto.vencePronto ? 'Apto físico por vencer' : hija.fecha_apto ? 'Apto físico vencido' : 'Apto físico pendiente',
        mensaje: `${hija.nombre_completo}: ${apto.mensaje}`,
        ctaRuta: '/perfil',
      })
    }

    // Aproximado: usa la fecha del examen, no el momento real de carga de la nota (no existe ese dato todavía)
    for (const ev of evaluaciones[hija.alumno_id] ?? []) {
      if (ev.calificaciones.length > 0 && ev.fecha >= hoy) {
        notifs.push({
          id: `eval-${ev.id}`, tipo: 'evaluacion', fecha: ev.fecha,
          titulo: 'Nota cargada',
          mensaje: `${hija.nombre_completo}: ${ev.nombre}.`,
          ctaRuta: '/evaluaciones',
        })
      }
    }
  }

  for (const evento of eventos.filter((e) => e.fecha >= hoy && e.fecha <= en14DiasISO)) {
    notifs.push({
      id: `evento-${evento.id}`, tipo: 'evento', fecha: evento.fecha,
      titulo: 'Próximo evento',
      mensaje: `${evento.nombre} — ${formatFecha(evento.fecha)}.`,
      ctaRuta: `/eventos/${evento.id}`,
    })
  }

  return notifs.sort((a, b) => b.fecha.localeCompare(a.fecha))
}

export function generarAsientos(mapaAsientos) {
  const { precio, sector } = mapaAsientos

  const asiento = (fila, numero) => ({
    fila,
    numero,
    clave: `${fila}-${numero}`,
    sector,
    precio,
  })

  return mapaAsientos.filas.map((filaData) => {
    if (filaData.corrida) {
      return {
        fila: filaData.fila,
        corrida: filaData.corrida.map((numero) => asiento(filaData.fila, numero)),
      }
    }
    return {
      fila: filaData.fila,
      bloques: filaData.bloques.map((bloque) =>
        bloque.map((numero) => asiento(filaData.fila, numero))
      ),
    }
  })
}

export function formatButaca(b) {
  if (!b.fila || b.numero == null) return b.sector
  return `Fila ${b.fila}, Butaca ${b.numero}`
}

export function formatButacaCorta(b) {
  if (!b.fila || b.numero == null) return b.sector
  return `${b.fila}-${b.numero}`
}

export function infoEstadoPago(estado) {
  const map = {
    pendiente: { label: 'Pendiente de pago', classes: 'bg-gray-100 text-gray-600' },
    pago_en_revision: { label: 'Pago en proceso', classes: 'bg-amber-50 text-amber-700' },
    pagado: { label: 'Pago confirmado', classes: 'bg-emerald-50 text-emerald-700' },
  }
  return map[estado] ?? map.pendiente
}
