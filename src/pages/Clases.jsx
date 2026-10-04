import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import ClaseDetalleModal from '../components/ClaseDetalleModal'
import { AlumnoActivoContext } from '../context/AlumnoActivoContext'
import { useToast } from '../context/ToastContext'
import { useClasesDisponibles } from '../hooks/useClasesDisponibles'

// La solicitud más reciente de esta alumna para esta comisión decide qué
// mostrar. "atendida" no tiene un caso de UI propio a propósito: si la
// secretaría la atendió de verdad (aceptándola), la comisión ya debería
// aparecer en alumnoActivo.clases y quedar filtrada más abajo por "ya
// cursa" — tratarla como "sin solicitud" es el comportamiento correcto
// para el caso raro de que no sea así (ver Claude.md).
function solicitudVigente(solicitudes, comisionId) {
  return solicitudes.find((s) => s.comision_id === comisionId) ?? null
}

function TarjetaComision({ comision, solicitud, nombreAlumna, onSolicitar }) {
  const [enviando, setEnviando] = useState(false)
  const [errorServidor, setErrorServidor] = useState('')
  const sinCupo = comision.vacantes_disponibles === 0
  const pendiente = solicitud?.estado === 'pendiente'
  const descartada = solicitud?.estado === 'descartada'

  async function handleSolicitar() {
    setEnviando(true)
    setErrorServidor('')
    try {
      await onSolicitar(comision.id)
    } catch (err) {
      setErrorServidor(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <li className={`rounded-xl border border-gray-100 p-3 transition-opacity ${sinCupo ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{comision.disciplina_nombre}</p>
          <p className="text-xs text-gray-400 truncate">{comision.nivel} · {comision.dias_horarios}</p>
          {comision.docente_nombre && <p className="text-xs text-gray-400 truncate">{comision.docente_nombre}</p>}
        </div>
        <Badge color={sinCupo ? 'red' : comision.vacantes_disponibles <= 2 ? 'yellow' : 'green'}>
          {sinCupo ? 'Sin cupo' : `${comision.vacantes_disponibles} de ${comision.cupo_maximo} lugares`}
        </Badge>
      </div>

      {errorServidor && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-xl text-xs mt-2.5">
          {errorServidor}
        </div>
      )}

      {pendiente ? (
        <Button variant="secondary" size="sm" className="w-full justify-center mt-2.5" disabled>
          Ya enviado
        </Button>
      ) : sinCupo ? null : (
        <>
          {descartada && (
            <p className="text-[11px] text-gray-400 mt-2.5 mb-1">Tu pedido anterior no pudo aceptarse.</p>
          )}
          <Button
            variant="primary"
            size="sm"
            className="w-full justify-center mt-1"
            onClick={handleSolicitar}
            disabled={enviando}
          >
            {enviando ? 'Enviando...' : `Pedir lugar para ${nombreAlumna}`}
          </Button>
        </>
      )}
    </li>
  )
}

export default function Clases() {
  const navigate = useNavigate()
  const { alumnoActivo } = useContext(AlumnoActivoContext)
  const misClases = alumnoActivo?.clases ?? []
  const toast = useToast()
  const [claseDetalle, setClaseDetalle] = useState(null)
  const { comisiones, solicitudes, cargando, error, solicitar } = useClasesDisponibles()

  const comisionesYaCursadas = new Set(misClases.map((c) => c.comision_id))
  const disponibles = comisiones.filter((c) => !comisionesYaCursadas.has(c.id))

  async function handleSolicitar(comisionId) {
    await solicitar(comisionId)
    toast('Solicitud enviada. La academia va a confirmar el lugar.')
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Clases</h1>

      <button
        type="button"
        onClick={() => navigate('/horarios')}
        className="w-full flex items-center justify-between gap-2 bg-white rounded-2xl border border-gray-100 shadow-card p-4 cursor-pointer hover:shadow-card-md transition-shadow"
      >
        <span className="text-sm font-medium text-gray-700">Ver calendario de horarios</span>
        <ArrowRight size={16} className="text-primary shrink-0" />
      </button>

      {/* Mis clases */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Mis clases</h3>
        {misClases.length === 0 ? (
          <p className="text-xs text-gray-400">No tenés clases inscriptas por ahora.</p>
        ) : (
          <ul className="space-y-1">
            {misClases.map((clase) => (
              <li
                key={clase.comision_id}
                onClick={() => setClaseDetalle(clase)}
                className="p-2.5 rounded-xl cursor-pointer hover:bg-primary-subtle transition-colors"
              >
                <p className="text-sm font-medium text-gray-800 truncate">{clase.disciplina}</p>
                <p className="text-xs text-gray-400 truncate">{clase.nivel} · {clase.dias_horarios}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Clases disponibles */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">Clases disponibles</h3>
        <p className="text-xs text-gray-400 mb-3">
          Al pedir un lugar, la secretaría lo revisa, confirma la inscripción y te genera la cuota. No queda
          inscripta hasta entonces.
        </p>

        {cargando ? (
          <Spinner className="py-6" />
        ) : error ? (
          <p className="text-xs text-red-500">No se pudieron cargar las clases disponibles. Probá de nuevo en un momento.</p>
        ) : disponibles.length === 0 ? (
          <p className="text-xs text-gray-400">No hay clases con lugar disponible por ahora.</p>
        ) : (
          <ul className="space-y-3">
            {disponibles.map((comision) => (
              <TarjetaComision
                key={comision.id}
                comision={comision}
                solicitud={solicitudVigente(solicitudes, comision.id)}
                nombreAlumna={alumnoActivo?.nombre_completo ?? 'tu hija'}
                onSolicitar={handleSolicitar}
              />
            ))}
          </ul>
        )}
      </div>

      <ClaseDetalleModal isOpen={claseDetalle !== null} onClose={() => setClaseDetalle(null)} clase={claseDetalle} />
    </div>
  )
}
