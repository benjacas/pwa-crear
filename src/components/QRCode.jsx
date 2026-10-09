import { useEffect, useRef } from 'react'
import { dibujarQR } from '../utils/qr'

// Nada se guarda: se dibuja de nuevo en el canvas cada vez que se muestra
// (al montar o si cambia el texto), no hay ningún caché ni archivo de por
// medio.
export default function QRCode({ texto, tamano = 180, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !texto) return
    canvas.width = tamano
    canvas.height = tamano
    dibujarQR(canvas.getContext('2d'), texto, 0, 0, tamano)
  }, [texto, tamano])

  if (!texto) return null
  return <canvas ref={ref} className={className} role="img" aria-label="Código QR de la entrada" />
}
