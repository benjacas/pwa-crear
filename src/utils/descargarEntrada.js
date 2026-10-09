import { formatFecha, formatHora, hoyLocalISO } from './format'
import { dibujarQR, urlEntrada } from './qr'

// dd/mm/aaaa a partir de hoyLocalISO() ('YYYY-MM-DD'): reordenar el string
// que ya está en hora local, nada de Date/toISOString de nuevo.
function fechaDeHoyDDMMAAAA() {
  const [anio, mes, dia] = hoyLocalISO().split('-')
  return `${dia}/${mes}/${anio}`
}

// Nombre de archivo en minúsculas, sin tildes ni caracteres raros: saca los
// diacríticos primero (normalize + regex, no un mapa de reemplazos a mano)
// y después cualquier cosa que no sea a-z/0-9 se vuelve un guion.
function slug(texto) {
  return (texto || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
}

// Parte el texto en líneas que entran en `anchoMax`, sin dibujar nada
// todavía — medir y recién después fijar canvas.width/height hace falta
// porque cambiar el tamaño del canvas resetea el contexto (font incluido).
function partirEnLineas(ctx, texto, anchoMax) {
  const palabras = texto.split(' ')
  const lineas = []
  let linea = ''
  for (const palabra of palabras) {
    const prueba = linea ? `${linea} ${palabra}` : palabra
    if (linea && ctx.measureText(prueba).width > anchoMax) {
      lineas.push(linea)
      linea = palabra
    } else {
      linea = prueba
    }
  }
  if (linea) lineas.push(linea)
  return lineas
}

const ANCHO = 640
const ALTURA_FRANJA = 110
const TAMANO_QR = 400
const ALTURA_LINEA_TITULO = 34

// Calcula en qué Y cae cada elemento (título ya partido en líneas, función,
// butaca, QR) sin dibujar nada — una sola fuente de verdad para el layout,
// usada primero para saber el alto total del canvas y después, ya con el
// canvas en su tamaño final, para dibujar cada cosa en su lugar.
function calcularLayout(lineasTitulo, compra, entrada) {
  const posiciones = {}
  let y = ALTURA_FRANJA + 60
  posiciones.titulo = y
  y += lineasTitulo.length * ALTURA_LINEA_TITULO + 30

  if (compra.funcion) {
    posiciones.fechaHora = y
    y += 28
    posiciones.sala = y
    y += 28
    if (entrada.butaca) {
      posiciones.butaca = y
      y += 36
    }
  }

  posiciones.qr = y + 10
  posiciones.pie1 = posiciones.qr + TAMANO_QR + 40
  posiciones.pie2 = posiciones.pie1 + 22
  posiciones.alto = posiciones.pie2 + 30
  return posiciones
}

// Compone la entrada en un canvas (evento, función, sala, butaca y el QR
// grande) y la baja como PNG. Nada queda guardado del lado de la app: el
// archivo se arma al toque y el blob se revoca apenas termina la descarga.
export async function descargarEntradaPng(compra, entrada) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  ctx.font = 'bold 26px sans-serif'
  const lineasTitulo = partirEnLineas(ctx, compra.evento.nombre, ANCHO - 80)
  const pos = calcularLayout(lineasTitulo, compra, entrada)

  canvas.width = ANCHO
  canvas.height = pos.alto

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, ANCHO, pos.alto)

  ctx.fillStyle = '#6D5AE6'
  ctx.fillRect(0, 0, ANCHO, ALTURA_FRANJA)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 22px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Entrada', ANCHO / 2, 65)

  ctx.textAlign = 'left'
  ctx.fillStyle = '#1f2937'
  ctx.font = 'bold 26px sans-serif'
  lineasTitulo.forEach((linea, i) => ctx.fillText(linea, 40, pos.titulo + i * ALTURA_LINEA_TITULO))

  ctx.font = '18px sans-serif'
  ctx.fillStyle = '#4b5563'
  if (compra.funcion) {
    const horaTxt = formatHora(compra.funcion.hora)
    ctx.fillText(`${formatFecha(compra.funcion.fecha)}${horaTxt ? ` · ${horaTxt} hs` : ''}`, 40, pos.fechaHora)
    ctx.fillText(compra.funcion.sala_nombre, 40, pos.sala)
    if (entrada.butaca) {
      ctx.font = 'bold 20px sans-serif'
      ctx.fillStyle = '#1f2937'
      ctx.fillText(`Fila ${entrada.butaca.fila} · Butaca ${entrada.butaca.numero}`, 40, pos.butaca)
    }
  }

  dibujarQR(ctx, urlEntrada(entrada.codigo), (ANCHO - TAMANO_QR) / 2, pos.qr, TAMANO_QR)

  ctx.textAlign = 'center'
  ctx.font = '13px sans-serif'
  ctx.fillStyle = '#9ca3af'
  ctx.fillText(`Descargada el ${fechaDeHoyDDMMAAAA()}`, ANCHO / 2, pos.pie1)
  ctx.fillText('La butaca vigente figura al escanear el QR', ANCHO / 2, pos.pie2)

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const butacaTxt = entrada.butaca ? `fila-${entrada.butaca.fila}-butaca-${entrada.butaca.numero}` : `entrada-${entrada.numero}`
  a.download = `${slug(`entrada ${compra.evento.nombre} ${butacaTxt}`)}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
