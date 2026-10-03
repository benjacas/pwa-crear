import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, KeyRound, Bell, CreditCard, HelpCircle, ChevronRight, LogOut, Phone, AlertTriangle } from 'lucide-react'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import ConfirmModal from '../components/ui/ConfirmModal'
import EditarContactoModal from '../components/EditarContactoModal'
import { AlumnoActivoContext } from '../context/AlumnoActivoContext'
import { AuthContext } from '../context/AuthContext'
import { getUsuarioActual } from '../api/client'
import { useMiPerfilTutor } from '../hooks/useMiPerfilTutor'
import { estadoAptoFisico } from '../utils/format'

// Sin página de destino todavía para "Métodos de pago guardados" y "Ayuda y
// soporte" — quedan con badge "Próximamente" en vez de flecha, sin cursor de
// puntero, mismo criterio que "Horarios"/"Próx. evento" en Home. "Cambiar
// clave de acceso" y "Notificaciones" tampoco tienen destino real todavía,
// pero no forman parte de esta tarea puntual — quedan como estaban.
const ACCESOS = [
  { key: 'clave', icon: KeyRound, label: 'Cambiar clave de acceso' },
  { key: 'notificaciones', icon: Bell, label: 'Notificaciones', valor: 'Activados' },
  { key: 'pago', icon: CreditCard, label: 'Métodos de pago guardados', proximamente: true },
  { key: 'ayuda', icon: HelpCircle, label: 'Ayuda y soporte', proximamente: true },
]

export default function Perfil() {
  const navigate = useNavigate()
  const { alumnoActivo, setAlumnoActivo, alumnosVinculados } = useContext(AlumnoActivoContext)
  const { logout } = useContext(AuthContext)
  const [usuario, setUsuario] = useState(null)
  const [cargandoUsuario, setCargandoUsuario] = useState(true)
  const [errorUsuario, setErrorUsuario] = useState(null)
  const [confirmandoSalir, setConfirmandoSalir] = useState(false)
  const [editandoContacto, setEditandoContacto] = useState(false)
  const { perfil, cargando: cargandoPerfil, actualizar: actualizarPerfil } = useMiPerfilTutor()

  useEffect(() => {
    getUsuarioActual()
      .then(setUsuario)
      .catch(setErrorUsuario)
      .finally(() => setCargandoUsuario(false))
  }, [])

  if (cargandoUsuario) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex flex-col items-center gap-2 py-2">
          <Skeleton className="w-[72px] h-[72px] rounded-full" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )
  }

  if (errorUsuario) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No se pudo cargar tu perfil"
        description="Hubo un problema al conectar con el servidor. Probá de nuevo en un momento."
      />
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Encabezado */}
      <div className="flex flex-col items-center text-center gap-2 py-2">
        <Avatar nombre={usuario.nombre_completo} size={72} />
        <div>
          <p className="text-lg font-bold text-gray-800">{usuario.nombre_completo}</p>
        </div>
      </div>

      {/* Mis alumnas */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <h3 className="text-xs font-semibold text-gray-400 tracking-wide uppercase mb-3">Mis alumnas</h3>
        <ul className="space-y-1">
          {alumnosVinculados.map((alumno) => {
            const activa = alumno.alumno_id === alumnoActivo?.alumno_id
            const apto = estadoAptoFisico(alumno)
            return (
              <li
                key={alumno.alumno_id}
                onClick={() => setAlumnoActivo(alumno)}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl cursor-pointer hover:bg-primary-subtle transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{alumno.nombre_completo}</p>
                  <p className={`text-xs truncate ${apto.vigente ? 'text-emerald-600' : 'text-amber-600'}`}>{apto.mensaje}</p>
                </div>
                {activa && (
                  <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Check size={12} className="text-white" />
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {/* Accesos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-2">
        <ul className="divide-y divide-gray-100">
          <li
            // El GET de /portal/perfil tarda un instante — no tiene sentido
            // abrir el modal (y precargarlo con datos vacíos) antes de que
            // el perfil real haya llegado, así que el click no hace nada
            // mientras cargandoPerfil sea true. El spinner en vez de la
            // flecha es la única señal de que "ya viene".
            onClick={() => !cargandoPerfil && setEditandoContacto(true)}
            className={`flex items-center justify-between gap-2 p-3 rounded-xl transition-colors ${
              cargandoPerfil ? 'cursor-default' : 'cursor-pointer hover:bg-primary-subtle'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Phone size={18} className="text-gray-400 shrink-0" />
              <p className="text-sm text-gray-700 truncate">Editar datos de contacto</p>
            </div>
            {cargandoPerfil ? (
              <span className="w-3.5 h-3.5 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin shrink-0" />
            ) : (
              <ChevronRight size={16} className="text-gray-300 shrink-0" />
            )}
          </li>

          {ACCESOS.map(({ key, icon: Icon, label, valor, proximamente }) => (
            <li key={key} className="flex items-center justify-between gap-2 p-3">
              <div className="flex items-center gap-3 min-w-0">
                <Icon size={18} className="text-gray-400 shrink-0" />
                <p className="text-sm text-gray-700 truncate">{label}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {valor && <span className="text-xs text-gray-400">{valor}</span>}
                {proximamente ? (
                  <Badge color="gray">Próximamente</Badge>
                ) : (
                  <ChevronRight size={16} className="text-gray-300" />
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Cerrar sesión */}
      <button
        type="button"
        onClick={() => setConfirmandoSalir(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-50 text-red-600 font-medium text-sm hover:bg-red-100 transition-colors"
      >
        <LogOut size={16} />
        Cerrar sesión
      </button>

      <ConfirmModal
        isOpen={confirmandoSalir}
        onClose={() => setConfirmandoSalir(false)}
        onConfirm={() => { logout(); navigate('/login', { replace: true }) }}
        title="Cerrar sesión"
        message="¿Seguro que querés cerrar sesión?"
        confirmLabel="Confirmar"
      />

      <EditarContactoModal
        isOpen={editandoContacto}
        onClose={() => setEditandoContacto(false)}
        perfil={perfil}
        onGuardar={actualizarPerfil}
      />
    </div>
  )
}
