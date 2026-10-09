import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

// Sin `.status` (fetch() tiró antes de llegar a una respuesta — sin
// conexión, CORS, DNS) o 5xx: no tiene nada que ver con la contraseña, así
// que mostrar "credenciales incorrectas" ahí sería directamente falso.
// Antes cualquier error cerraba acá, sin mirar cuál era.
function mensajeErrorLogin(err) {
  if (!err.status || err.status >= 500) {
    return 'No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.'
  }
  if (err.status === 401) return 'Email o contraseña incorrectos.'
  // El mensaje real del backend trae cuántos minutos faltan — mejor que
  // cualquier texto fijo de acá.
  if (err.status === 429) return err.message || 'Probaste muchas veces seguidas: esperá unos minutos antes de volver a intentar.'
  return err.message || 'No pudimos iniciar sesión. Intentá de nuevo.'
}

export default function Login() {
  const navigate = useNavigate()
  const { login, loginConCodigo } = useContext(AuthContext)
  const [paso, setPaso] = useState('credenciales') // 'credenciales' | 'codigo'
  const [desafio, setDesafio] = useState(null)
  const [expiraEn, setExpiraEn] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [logoError, setLogoError] = useState(false)

  function irSegunResultado(resultado) {
    if (resultado.debe_cambiar_clave) navigate('/cambiar-clave')
    else navigate('/')
  }

  async function manejarCredenciales(e) {
    e.preventDefault()
    if (!email || !password) { setError('Completá todos los campos'); return }
    setLoading(true); setError('')
    try {
      const resultado = await login(email, password)
      if (resultado.requiere_2fa) {
        setDesafio(resultado.desafio)
        setExpiraEn(resultado.expira_en)
        setPaso('codigo')
        setLoading(false)
      } else {
        irSegunResultado(resultado)
      }
    } catch (err) {
      setError(mensajeErrorLogin(err))
      setLoading(false)
    }
  }

  async function manejarCodigo(e) {
    e.preventDefault()
    if (!codigo) { setError('Ingresá el código'); return }
    setLoading(true); setError('')
    try {
      const resultado = await loginConCodigo(desafio, codigo)
      irSegunResultado(resultado)
    } catch {
      setError('Código incorrecto. Probá con el que muestra la app ahora.')
      setLoading(false)
    }
  }

  function volverACredenciales() {
    setPaso('credenciales')
    setDesafio(null)
    setExpiraEn(null)
    setCodigo('')
    setError('')
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #F8F9FC 0%, #EEE9FF 100%)' }}>

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1E1147 0%, #2D1B69 100%)' }}>


        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
              {!logoError
                ? <img src="/logo.png" alt="CREAR" className="w-7 h-7 object-contain brightness-0 invert" onError={() => setLogoError(true)} />
                : <span className="text-white font-black text-lg font-display">C</span>
              }
            </div>
            <div>
              <h1 className="text-white font-bold text-xl font-display tracking-wide">CREAR</h1>
              <p className="text-white/40 text-xs tracking-widest uppercase">Academia de Danzas</p>
            </div>
          </div>
        </div>

        <div>
          <blockquote className="text-white/70 text-2xl font-display italic leading-relaxed">
            "La danza es el lenguaje<br />oculto del alma."
          </blockquote>
          <p className="text-white/30 text-sm mt-4">— Martha Graham</p>
        </div>

        <p className="text-white/20 text-xs">v0.1.0 · Tesis 2025</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 border border-white/20"
              style={{ background: 'linear-gradient(135deg, #1E1147, #2D1B69)' }}>
              {!logoError
                ? <img src="/logo.png" alt="CREAR" className="w-9 h-9 object-contain brightness-0 invert" onError={() => setLogoError(true)} />
                : <span className="text-white font-black text-xl font-display">C</span>
              }
            </div>
            <h1 className="text-xl font-bold text-gray-800 font-display">CREAR</h1>
            <p className="text-gray-400 text-xs">Academia de Danzas</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-card-md p-8">
            {paso === 'credenciales' ? (
              <>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Iniciar sesión</h2>
                <p className="text-gray-400 text-sm mb-6">Ingresá tus credenciales para continuar</p>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-5">
                    {error}
                  </div>
                )}

                <form onSubmit={manejarCredenciales} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@academia.com" autoComplete="email"
                      className="w-full rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Contraseña</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" autoComplete="current-password"
                      className="w-full rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full text-white font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-sm hover:shadow-card-md"
                    style={{ background: loading ? '#9C8AF0' : 'linear-gradient(135deg, #6D5AE6, #8B7AEE)' }}>
                    {loading ? 'Ingresando...' : 'Ingresar'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Verificación en dos pasos</h2>
                <p className="text-gray-400 text-sm mb-6">
                  Ingresá el código de tu app de autenticación
                  {expiraEn ? ` (tenés ${Math.ceil(expiraEn / 60)} minutos)` : ''}.
                </p>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-5">
                    {error}
                  </div>
                )}

                <form onSubmit={manejarCodigo} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Código</label>
                    <input type="text" inputMode="numeric" value={codigo} onChange={(e) => setCodigo(e.target.value)}
                      placeholder="123456" autoComplete="one-time-code" autoFocus
                      className="w-full rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 px-4 py-2.5 text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full text-white font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-sm hover:shadow-card-md"
                    style={{ background: loading ? '#9C8AF0' : 'linear-gradient(135deg, #6D5AE6, #8B7AEE)' }}>
                    {loading ? 'Verificando...' : 'Verificar'}
                  </button>
                  <button type="button" onClick={volverACredenciales}
                    className="w-full text-gray-400 text-sm py-1.5 hover:text-gray-600 transition-colors">
                    Volver
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="text-center text-xs text-gray-300 mt-6">v0.1.0 · Tesis 2025</p>
        </div>
      </div>
    </div>
  )
}
