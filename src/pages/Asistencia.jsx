import { useContext, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import { AlumnoActivoContext } from '../context/AlumnoActivoContext'
import { useAsistencias } from '../hooks/useAsistencias'
import { formatDiaClase, formatMesLabel } from '../utils/format'

function ultimosMeses(cantidad) {
  const meses = []
  const hoy = new Date()
  for (let i = 0; i < cantidad; i++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    meses.push(`${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`)
  }
  return meses.reverse() // más antiguo primero, como antes
}

const ESTADO_LABEL = { presente: '✓ Presente', ausente: 'Ausente', justificada: 'Justificada' }
const ESTADO_COLOR = { presente: 'green', ausente: 'red', justificada: 'yellow' }

export default function Asistencia() {
  const { alumnoActivo } = useContext(AlumnoActivoContext)
  const meses = ultimosMeses(6)
  const [mesSeleccionado, setMesSeleccionado] = useState(meses[meses.length - 1])
  const { asistencia, cargando, error } = useAsistencias(alumnoActivo?.alumno_id, `${mesSeleccionado}-01`)

  if (cargando) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No se pudo cargar la asistencia"
        description="Hubo un problema al conectar con el servidor. Probá de nuevo en un momento."
      />
    )
  }

  const alCorriente = !asistencia.bajo_umbral
  const colorNumero = alCorriente ? 'text-emerald-600' : 'text-amber-600'
  const colorBorde = alCorriente ? 'border-emerald-100' : 'border-amber-100'
  const classes = alCorriente ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
  const mensaje = alCorriente ? 'Hoy está por encima de ese mínimo.' : 'Hoy está por debajo de ese mínimo.'

  return (
    <div className="p-4 space-y-4">
      {/* Título */}
      <h1 className="text-xl font-bold text-gray-800">Asistencia de {alumnoActivo?.nombre_completo}</h1>

      {/* Selector de mes */}
      <div className="flex gap-2 overflow-x-auto">
        {meses.map((mes) => (
          <button
            key={mes}
            type="button"
            onClick={() => setMesSeleccionado(mes)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
              mes === mesSeleccionado
                ? 'bg-primary text-white'
                : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {formatMesLabel(mes)}
          </button>
        ))}
      </div>

      {/* Resumen del mes */}
      <div className={`${classes} border ${colorBorde} rounded-2xl p-6 text-center transition-colors`}>
        <p className="text-xs font-semibold tracking-wide uppercase">Asistencia del mes</p>
        <p className={`text-5xl font-black mt-2 ${colorNumero}`}>{asistencia.porcentaje ?? 0}%</p>
        <p className="text-sm mt-1">{asistencia.presentes} de {asistencia.clases} clases</p>
      </div>

      {/* Detalle por clase */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Detalle por clase</h3>
        {asistencia.detalle.length === 0 ? (
          <p className="text-xs text-gray-400">No hay clases registradas este mes.</p>
        ) : (
          <ul className="space-y-1">
            {asistencia.detalle.map((d, i) => (
              <li key={`${d.fecha}-${d.comision_id}-${i}`} className="flex items-center justify-between gap-2 p-2.5 rounded-xl">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-700">{formatDiaClase(d.fecha)}</p>
                  <p className="text-xs text-gray-400 truncate">{d.disciplina} · {d.nivel}</p>
                </div>
                <Badge color={ESTADO_COLOR[d.estado]}>{ESTADO_LABEL[d.estado]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className={`${classes} border ${colorBorde} rounded-2xl p-4 transition-colors`}>
        <p className="text-xs">
          La academia te avisa si la asistencia baja del {asistencia.umbral_pct}%. {mensaje}
        </p>
      </div>
    </div>
  )
}
