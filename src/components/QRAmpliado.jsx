import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import QRCode from './QRCode'

const MARGEN_LATERAL = 32 // px a cada lado
const TAMANO_MINIMO = 260
const TAMANO_MAXIMO = 400 // nada pedía un techo, pero sin uno un QR en un monitor de escritorio ocuparía la pantalla entera

function calcularTamano() {
  const disponible = window.innerWidth - MARGEN_LATERAL * 2
  return Math.max(TAMANO_MINIMO, Math.min(disponible, TAMANO_MAXIMO))
}

// Vista a pantalla completa del QR de una entrada. Se cierra por tres
// caminos (botón, Escape, atrás del navegador) que convergen en uno solo:
// abrir empuja un estado de historia, y los tres disparan history.back() en
// vez de desmontar directo — así el gesto "atrás" del celular cierra esto
// en lugar de salir de Mis entradas, sin tres implementaciones que puedan
// desincronizarse entre sí.
export default function QRAmpliado({ texto, etiqueta, onClose }) {
  const [tamano, setTamano] = useState(calcularTamano)
  const wakeLockRef = useRef(null)

  useEffect(() => {
    window.history.pushState({ qrAmpliado: true }, '')
    function alVolver() { onClose() }
    window.addEventListener('popstate', alVolver)
    return () => window.removeEventListener('popstate', alVolver)
  }, [])

  function cerrar() {
    window.history.back()
  }

  useEffect(() => {
    function alTocarTecla(e) { if (e.key === 'Escape') cerrar() }
    document.addEventListener('keydown', alTocarTecla)
    return () => document.removeEventListener('keydown', alTocarTecla)
  }, [])

  useEffect(() => {
    function alCambiarTamano() { setTamano(calcularTamano()) }
    window.addEventListener('resize', alCambiarTamano)
    window.addEventListener('orientationchange', alCambiarTamano)
    return () => {
      window.removeEventListener('resize', alCambiarTamano)
      window.removeEventListener('orientationchange', alCambiarTamano)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Solo si existe (pide HTTPS; en HTTP directamente no está en `navigator`,
  // así que ni se intenta — no hay nada que "fallar"). Si el pedido
  // rechaza por cualquier otro motivo (ahorro de batería, política del
  // navegador) se ignora: ver el QR no depende de esto.
  useEffect(() => {
    if (!('wakeLock' in navigator)) return
    let vigente = true

    function soltar() {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {})
        wakeLockRef.current = null
      }
    }

    navigator.wakeLock.request('screen')
      .then((sentinel) => { if (vigente) wakeLockRef.current = sentinel; else sentinel.release().catch(() => {}) })
      .catch(() => {})

    function alOcultarse() {
      if (document.visibilityState === 'hidden') soltar()
    }
    document.addEventListener('visibilitychange', alOcultarse)
    return () => {
      vigente = false
      document.removeEventListener('visibilitychange', alOcultarse)
      soltar()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      <div className="flex justify-end p-4">
        <button
          type="button"
          onClick={cerrar}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors text-sm font-medium"
        >
          <X size={18} />
          Cerrar
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6">
        <QRCode texto={texto} tamano={tamano} />
        <p className="text-base font-semibold text-gray-800">{etiqueta}</p>
      </div>
    </div>
  )
}
