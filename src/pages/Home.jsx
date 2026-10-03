import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet, Clock, PartyPopper } from 'lucide-react'
import RadialProgress from '../components/ui/RadialProgress'
import Skeleton from '../components/ui/Skeleton'
import AlertaHome from '../components/AlertaHome'
import { AlumnoActivoContext } from '../context/AlumnoActivoContext'
import { AuthContext } from '../context/AuthContext'
import { useAsistencias } from '../hooks/useAsistencias'
import { useCargos } from '../hooks/useCargos'
import { getCuentaCorriente, getAsistenciaHija } from '../api/client'
import { proximoEventoDemo } from '../mock/fixtures'
import { calcularAvisos, formatMesLabel } from '../utils/format'

function InfoCard({ icon: Icon, label, value, onClick, className = '' }) {
  const clickable = typeof onClick === 'function'
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100 shadow-card p-4 flex flex-col gap-2 transition-shadow ${
        clickable ? 'cursor-pointer hover:shadow-card-md' : ''
      } ${className}`}
    >
      <div className="p-2 rounded-xl bg-primary-light w-fit">
        <Icon size={18} className="text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-gray-800 leading-tight truncate">{value}</p>
        <p className="text-xs text-gray-400 truncate">{label}</p>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { nombre } = useContext(AuthContext)
  const { alumnoActivo, alumnosVinculados } = useContext(AlumnoActivoContext)
  const { asistencia, cargando: cargandoAsistencia } = useAsistencias(alumnoActivo?.alumno_id)
  const { cuentaCorriente, cargando: cargandoCargos } = useCargos(alumnoActivo?.alumno_id)
  const cargando = cargandoAsistencia || cargandoCargos

  // Para los Avisos hace falta la cuenta corriente y la asistencia de TODAS
  // las hijas, no solo la activa — con un tutor de 2-3 hijas esto dispara
  // 2×N llamadas en paralelo al entrar a Home. Para los casos reales que
  // hay hoy no es un problema; si en algún momento aparece un tutor con
  // muchas más hijas, revisar esto (ver Claude.md, "Tarea I").
  const [cuentasCorrientes, setCuentasCorrientes] = useState({})
  const [asistencias, setAsistencias] = useState({})

  useEffect(() => {
    Promise.all(alumnosVinculados.map((h) =>
      Promise.all([getCuentaCorriente(h.alumno_id), getAsistenciaHija(h.alumno_id)])
        .then(([cc, asis]) => ({ id: h.alumno_id, cc, asis }))
    )).then((resultados) => {
      setCuentasCorrientes(Object.fromEntries(resultados.map((r) => [r.id, r.cc])))
      setAsistencias(Object.fromEntries(resultados.map((r) => [r.id, r.asis])))
    })
  }, [alumnosVinculados])

  const avisos = calcularAvisos({ hijas: alumnosVinculados, cuentasCorrientes, asistencias })

  if (cargando) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl col-span-2" />
        </div>
      </div>
    )
  }

  const cuotasPendientes = cuentaCorriente?.cuotas_pendientes ?? []

  return (
    <div className="p-4 space-y-4">
      {avisos.length > 0 && (
        <div id="avisos-home" className="space-y-2">
          {avisos.map((aviso) => (
            <AlertaHome key={aviso.id} alerta={aviso} />
          ))}
        </div>
      )}

      {/* Saludo */}
      <div className="rounded-2xl p-5 text-white bg-gradient-to-br from-primary to-primary-dark shadow-card-md">
        <p className="text-sm text-white/80">Hola,</p>
        <h1 className="text-xl font-bold">{nombre}</h1>
      </div>

      {/* Asistencia */}
      <div
        onClick={() => navigate('/asistencia')}
        className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 flex items-center gap-4 cursor-pointer hover:shadow-card-md transition-shadow"
      >
        <RadialProgress porcentaje={asistencia?.porcentaje ?? 0} tamano={72} umbral={asistencia?.umbral_pct ?? 75} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{alumnoActivo?.nombre_completo}</p>
          <p className="text-xs text-gray-400">{asistencia?.mes ? formatMesLabel(asistencia.mes.slice(0, 7)) : ''}</p>
        </div>
      </div>

      {/* Grid de 3 tarjetas */}
      <div className="grid grid-cols-2 gap-3">
        <InfoCard
          icon={Wallet}
          label="Cuotas pendientes"
          value={cuotasPendientes.length}
          onClick={() => navigate('/pagos')}
        />
        <InfoCard
          icon={Clock}
          label="Clases inscriptas"
          value={alumnoActivo?.clases?.length ?? 0}
          onClick={() => navigate('/horarios')}
        />
        <InfoCard
          icon={PartyPopper}
          label={proximoEventoDemo.titulo}
          value={`${proximoEventoDemo.diasRestantes} días`}
          className="col-span-2"
          onClick={() => navigate('/eventos')}
        />
      </div>
    </div>
  )
}
