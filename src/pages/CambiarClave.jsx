import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCambiarClave } from '../api/client'
import { useToast } from '../context/ToastContext'

export default function CambiarClave() {
  const navigate = useNavigate()
  const toast = useToast()
  const [claveActual, setClaveActual] = useState('')
  const [claveNueva, setClaveNueva] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!claveActual || !claveNueva || !confirmacion) { setError('Completá todos los campos'); return }
    if (claveNueva !== confirmacion) { setError('La confirmación no coincide con la clave nueva'); return }
    setLoading(true); setError('')
    try {
      await apiCambiarClave(claveActual, claveNueva)
      toast('Contraseña actualizada.')
      navigate('/seleccionar-alumno')
    } catch {
      setError('No se pudo cambiar la contraseña. Verificá la clave actual y que la nueva cumpla la política de seguridad.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center p-6 bg-primary-subtle">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card-md p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Cambiar contraseña</h2>
          <p className="text-gray-400 text-sm mb-6">
            Tu contraseña es provisoria — elegí una nueva para continuar.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Contraseña actual</label>
              <input type="password" value={claveActual} onChange={(e) => setClaveActual(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Contraseña nueva</label>
              <input type="password" value={claveNueva} onChange={(e) => setClaveNueva(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Confirmar contraseña nueva</label>
              <input type="password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full text-white font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-sm hover:shadow-card-md"
              style={{ background: loading ? '#9C8AF0' : 'linear-gradient(135deg, #6D5AE6, #8B7AEE)' }}>
              {loading ? 'Guardando...' : 'Guardar y continuar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
