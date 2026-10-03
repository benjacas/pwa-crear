import { useContext, useEffect, useState } from 'react'
import { AlumnoActivoContext } from '../context/AlumnoActivoContext'
import { getCuentaCorriente, getAsistenciaHija, getEvaluaciones, getPagosHija, getEventos } from '../api/client'
import { calcularNotificaciones, hoyLocalISO } from '../utils/format'

const CLAVE_LEIDAS = 'crear_notifs_leidas'

export function useNotificaciones() {
  const { alumnosVinculados } = useContext(AlumnoActivoContext)
  const [notifs, setNotifs] = useState([])
  const [leidas, setLeidas] = useState(() => new Set(JSON.parse(localStorage.getItem(CLAVE_LEIDAS) || '[]')))
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    Promise.all([
      Promise.all(alumnosVinculados.map((h) => getCuentaCorriente(h.alumno_id).then((r) => [h.alumno_id, r]))),
      Promise.all(alumnosVinculados.map((h) => getAsistenciaHija(h.alumno_id).then((r) => [h.alumno_id, r]))),
      Promise.all(alumnosVinculados.map((h) => getEvaluaciones(h.alumno_id).then((r) => [h.alumno_id, r]))),
      Promise.all(alumnosVinculados.map((h) => getPagosHija(h.alumno_id).then((r) => [h.alumno_id, r]))),
      getEventos(hoyLocalISO()),
    ]).then(([cc, asis, evals, pagos, eventos]) => {
      const resultado = calcularNotificaciones({
        hijas: alumnosVinculados,
        cuentasCorrientes: Object.fromEntries(cc),
        asistencias: Object.fromEntries(asis),
        evaluaciones: Object.fromEntries(evals),
        pagos: Object.fromEntries(pagos),
        eventos,
      })
      setNotifs(resultado)
    }).finally(() => setCargando(false))
  }, [alumnosVinculados])

  function marcarLeida(id) {
    const nuevas = new Set(leidas).add(id)
    setLeidas(nuevas)
    localStorage.setItem(CLAVE_LEIDAS, JSON.stringify([...nuevas]))
  }

  function marcarTodas() {
    const nuevas = new Set([...leidas, ...notifs.map((n) => n.id)])
    setLeidas(nuevas)
    localStorage.setItem(CLAVE_LEIDAS, JSON.stringify([...nuevas]))
  }

  return { notifs: notifs.map((n) => ({ ...n, leida: leidas.has(n.id) })), cargando, marcarLeida, marcarTodas }
}
