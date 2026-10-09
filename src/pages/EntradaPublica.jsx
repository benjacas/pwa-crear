import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MapPin, Ticket, AlertTriangle } from 'lucide-react'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import { getEntradaPublica } from '../api/client'
import { formatFecha, formatHora } from '../utils/format'

// Página pública: la abre cualquiera que escanee el QR, sin sesión
// iniciada — por eso vive fuera de RequireRole/Shell en App.jsx (sin
// barra de navegación) y pide los datos con getEntradaPublica(), que no
// pasa por fetchConToken (nada de Authorization, nada de renovar sesión).
export default function EntradaPublica() {
  const { codigo } = useParams()
  const [entrada, setEntrada] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setCargando(true)
    setError(false)
    getEntradaPublica(codigo)
      .then(setEntrada)
      .catch(() => setError(true))
      .finally(() => setCargando(false))
  }, [codigo])

  return (
    <div className="min-h-svh bg-primary-subtle flex items-start justify-center p-4">
      <div className="w-full max-w-md">
        {cargando && <Spinner className="mt-20" />}

        {!cargando && (error || !entrada) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card mt-10">
            <EmptyState
              icon={AlertTriangle}
              title="Esta entrada no existe o fue devuelta"
              description="Revisá el enlace o pedile a la academia que te lo reenvíe."
            />
          </div>
        )}

        {!cargando && entrada && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <div className="bg-primary px-5 py-6 text-center text-white">
              <Ticket size={22} className="mx-auto mb-2 opacity-90" />
              <p className="text-xs uppercase tracking-wide opacity-80">Entrada {entrada.numero} de {entrada.de}</p>
              <p className="text-lg font-bold mt-1">{entrada.evento}</p>
            </div>

            <div className="p-5 space-y-4 text-sm">
              <dl className="space-y-2">
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-400">Función</dt>
                  <dd className="text-gray-800 text-right">{entrada.funcion}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-400">Fecha</dt>
                  <dd className="text-gray-800 text-right">
                    {formatFecha(entrada.fecha)}{entrada.hora ? ` · ${formatHora(entrada.hora)} hs` : ''}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-400">Sala</dt>
                  <dd className="text-gray-800 text-right">{entrada.sala}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-400">Para</dt>
                  <dd className="text-gray-800 text-right">{entrada.para}</dd>
                </div>
              </dl>

              {entrada.direccion && (
                <a
                  href={entrada.mapa_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary text-sm font-medium"
                >
                  <MapPin size={15} />
                  {entrada.direccion}
                </a>
              )}

              {entrada.butacas.length > 0 && (
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Butaca{entrada.butacas.length > 1 ? 's' : ''}</p>
                  <p className="text-gray-800 font-medium">
                    {entrada.butacas.map((b) => `Fila ${b.fila} · Butaca ${b.numero}`).join(' — ')}
                  </p>
                </div>
              )}

              {entrada.programa.length > 0 && (
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Programa</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                    {entrada.programa.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}

              {entrada.informacion && (
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Información</p>
                  <p className="text-gray-600 leading-relaxed">{entrada.informacion}</p>
                </div>
              )}

              <div className="border-t border-gray-100 pt-3 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
                  Si el QR no se puede leer, este código en la puerta
                </p>
                <p className="font-mono text-lg font-bold text-gray-800 tracking-[0.3em]">{entrada.codigo_corto}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
