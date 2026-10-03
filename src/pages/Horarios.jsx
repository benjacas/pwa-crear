import { useContext, useState } from 'react'
import { Users, PartyPopper } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState'
import CalendarioMensual from '../components/CalendarioMensual'
import { AlumnoActivoContext } from '../context/AlumnoActivoContext'
import { useFeriados } from '../hooks/useFeriados'
import { ocurrenciasDeClaseEnMes, feriadosDelMes, proximosItems, itemsDelDia, formatDiaClase, formatFecha } from '../utils/format'

const hoy = new Date()

function FilaClase({ item, subtitulo }) {
  return (
    <li className="flex items-center gap-3 p-2.5 rounded-xl">
      <div className="p-2 rounded-xl shrink-0 bg-primary-light text-primary">
        <Users size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800 truncate">{item.titulo}</p>
        <p className="text-xs text-gray-400">{subtitulo}</p>
      </div>
    </li>
  )
}

// Calendario alimentado por alumnoActivo.clases (viene de /portal/hijas, sin
// fetch propio). Solo existe un tipo de marca: Clase.
export default function Horarios() {
  const { alumnoActivo } = useContext(AlumnoActivoContext)
  const clases = alumnoActivo?.clases ?? []
  const [mesVisto, setMesVisto] = useState({ anio: hoy.getFullYear(), mes: hoy.getMonth() })
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)
  // Toma el año, no todo mesVisto: si se navega diciembre -> enero no hay
  // que perder los feriados ya pedidos de ese año por cambiar de mes nomás.
  const { feriados } = useFeriados(mesVisto.anio)

  if (clases.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold text-gray-800">Horarios</h1>
        <EmptyState icon={Users} title="Sin clases activas" description="No tenés clases inscriptas por ahora." />
      </div>
    )
  }

  function cambiarMes(delta) {
    setMesVisto(({ anio, mes }) => {
      const fecha = new Date(anio, mes + delta, 1)
      return { anio: fecha.getFullYear(), mes: fecha.getMonth() }
    })
    // Un día seleccionado no tiene sentido al cambiar de mes.
    setDiaSeleccionado(null)
  }

  function seleccionarDia(fecha) {
    setDiaSeleccionado((prev) => (prev === fecha ? null : fecha))
  }

  // Comisiones sin horarios estructurados: no pueden marcarse en el
  // calendario, se listan aparte con el texto libre dias_horarios.
  const sinEstructurar = clases.filter((c) => !c.horarios?.length)

  const ocurrenciasMes = ocurrenciasDeClaseEnMes(clases, mesVisto.anio, mesVisto.mes)
  const feriadosMes = feriadosDelMes(feriados, mesVisto.anio, mesVisto.mes)
  // "Próximos" siempre mira desde hoy en el mes real, independiente del mes
  // que se esté navegando en el calendario.
  const proximos = proximosItems(clases, hoy.getFullYear(), hoy.getMonth())
  const itemsDia = diaSeleccionado ? itemsDelDia(clases, mesVisto.anio, mesVisto.mes, diaSeleccionado) : []
  const feriadoDelDia = diaSeleccionado ? feriadosMes.find((f) => f.fecha === diaSeleccionado) : null
  const anioReal = hoy.getFullYear()

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Horarios</h1>

      <CalendarioMensual
        anio={mesVisto.anio}
        mes={mesVisto.mes}
        ocurrencias={ocurrenciasMes}
        feriados={feriadosMes}
        diaSeleccionado={diaSeleccionado}
        onSeleccionarDia={seleccionarDia}
        onMesAnterior={() => cambiarMes(-1)}
        onMesSiguiente={() => cambiarMes(1)}
      />

      {sinEstructurar.map((c) => (
        <p key={c.comision_id} className="text-xs text-gray-500">
          Otros horarios: {c.disciplina} — {c.nivel} ({c.dias_horarios})
        </p>
      ))}

      {diaSeleccionado ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Clases del {formatDiaClase(diaSeleccionado)}</h3>
            <button
              type="button"
              onClick={() => setDiaSeleccionado(null)}
              className="text-xs font-medium text-primary shrink-0"
            >
              Ver próximos
            </button>
          </div>
          {feriadoDelDia && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100">
              <PartyPopper size={14} className="text-amber-600 shrink-0" />
              <p className="text-xs font-medium text-amber-700">{feriadoDelDia.nombre}</p>
            </div>
          )}
          {itemsDia.length === 0 ? (
            <p className="text-xs text-gray-400">No tenés clases este día.</p>
          ) : (
            <ul className="space-y-1">
              {itemsDia.map((item, i) => (
                <FilaClase key={`${item.fecha}-${item.hora}-${i}`} item={item} subtitulo={`${item.hora}–${item.horaFin}`} />
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Próximas clases</h3>
          {proximos.length === 0 ? (
            <p className="text-xs text-gray-400">No hay clases próximas este mes.</p>
          ) : (
            <ul className="space-y-1">
              {proximos.map((item, i) => {
                const esEsteAnio = new Date(`${item.fecha}T00:00:00`).getFullYear() === anioReal
                const fechaLabel = esEsteAnio ? formatDiaClase(item.fecha) : formatFecha(item.fecha)
                return (
                  <FilaClase
                    key={`${item.fecha}-${item.hora}-${i}`}
                    item={item}
                    subtitulo={`${fechaLabel} · ${item.hora}–${item.horaFin}`}
                  />
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
