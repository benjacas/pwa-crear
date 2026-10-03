import { useContext } from 'react'
import { AlertTriangle, ClipboardList } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import { AlumnoActivoContext } from '../context/AlumnoActivoContext'
import { useEvaluaciones } from '../hooks/useEvaluaciones'
import { formatFecha, notaConEscala } from '../utils/format'

// Un mismo examen puede tener más de una calificación (ver Claude.md) —
// este bloque se repite tal cual una vez por calificación, con o sin el
// encabezado "Cargada por" según cuántas haya.
function BloqueCalificacion({ calificacion, criterios }) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-x-3 gap-y-2">
        {Object.entries(calificacion.notas).map(([criterioId, nota]) => {
          const criterio = criterios.find((c) => c.id === criterioId)
          return (
            <Badge key={criterioId} color="gray">
              {criterio?.nombre ?? 'Criterio'}: {notaConEscala(nota, criterio?.escala_max ?? nota)}
            </Badge>
          )
        })}
      </div>
      {calificacion.observaciones && (
        <p className="text-xs text-gray-400 leading-snug">{calificacion.observaciones}</p>
      )}
      {calificacion.corregida_por && (
        <p className="text-[11px] text-gray-400">Corregida por {calificacion.corregida_por}</p>
      )}
    </div>
  )
}

export default function Evaluaciones() {
  const { alumnoActivo } = useContext(AlumnoActivoContext)
  const { evaluaciones, cargando, error } = useEvaluaciones(alumnoActivo?.alumno_id)

  if (cargando) {
    return (
      <div className="p-4 space-y-4">
        {[0, 1].map((i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-3">
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No se pudieron cargar las evaluaciones"
        description="Hubo un problema al conectar con el servidor. Probá de nuevo en un momento."
      />
    )
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Evaluaciones de {alumnoActivo?.nombre_completo}</h1>

      {evaluaciones.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Todavía no hay evaluaciones cargadas." />
      ) : (
        <div className="space-y-4">
          {evaluaciones.map((examen) => (
            <div key={examen.id} className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
              <p className="text-sm font-semibold text-gray-800">{examen.nombre}</p>
              <p className="text-xs text-gray-400 mb-3">
                {formatFecha(examen.fecha)} · {examen.clases.join(', ')}
              </p>

              {examen.calificaciones.length === 0 ? (
                <p className="text-xs text-gray-400">Todavía no tiene nota cargada en este examen.</p>
              ) : examen.calificaciones.length === 1 ? (
                <BloqueCalificacion calificacion={examen.calificaciones[0]} criterios={examen.criterios} />
              ) : (
                <div className="space-y-4">
                  {examen.calificaciones.map((calificacion, i) => (
                    <div key={i}>
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        Cargada por {calificacion.cargada_por}
                      </p>
                      <BloqueCalificacion calificacion={calificacion} criterios={examen.criterios} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
