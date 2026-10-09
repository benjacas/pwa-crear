import { encode } from 'uqr'

// La URL que lleva el QR de una entrada: el texto completo (no solo el
// código), así cualquier lector de QR de uso general (no hace falta una
// app de la academia) abre directo la página pública de la entrada.
export function urlEntrada(codigo) {
  const base = import.meta.env.VITE_PUBLIC_URL || window.location.origin
  return `${base}/entrada/${codigo}`
}

// Dibuja el QR directo en un contexto de canvas ya existente (en vez de usar
// un <img>/SVG con CSS): así queda siempre negro sobre blanco con margen
// blanco, nunca invertido ni afectado por el tema — nada de currentColor,
// nada que el modo oscuro pueda pisar. Lo usan tanto <QRCode/> en pantalla
// como la descarga de la entrada en PNG (mismo dibujo en los dos lugares,
// una sola implementación).
export function dibujarQR(ctx, texto, x, y, tamano) {
  const { data: matriz, size } = encode(texto, { ecc: 'M' })
  // 4 módulos de margen: el mínimo que pide el estándar (ISO/IEC 18004)
  // para que un lector no confunda el borde del QR con el fondo.
  const margen = 4
  const escala = Math.max(1, Math.floor(tamano / (size + margen * 2)))
  const lado = escala * (size + margen * 2)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x, y, lado, lado)
  ctx.fillStyle = '#000000'
  for (let fila = 0; fila < size; fila++) {
    for (let columna = 0; columna < size; columna++) {
      if (matriz[fila][columna]) {
        ctx.fillRect(x + (columna + margen) * escala, y + (fila + margen) * escala, escala, escala)
      }
    }
  }
  return lado
}
