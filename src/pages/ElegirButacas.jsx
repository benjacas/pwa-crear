import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, RotateCw, Ticket } from 'lucide-react'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import MapaButacas from '../components/MapaButacas'
import { useEntradas } from '../hooks/useEntradas'
import { usePlano } from '../hooks/usePlano'
import { useToast } from '../context/ToastContext'
import { elegirButacas, cambiarButacas } from '../api/client'
import { formatFecha, formatHora, motivoButacas } from '../utils/format'

// Errores donde no hay nada que la familia pueda resolver eligiendo de
// nuevo acá mismo: se le muestra el motivo real del backend y se vuelve a
// Mis entradas.
const CODIGOS_VOLVER = [
  'ERR_FAMILIA_CON_DEUDA', 'ERR_COMPRA_SIN_PAGAR', 'ERR_ENTRADA_USADA',
  'ERR_EVENTO_PASADO', 'ERR_CAMBIO_BUTACAS_AGOTADO',
]

// "Fila A, butacas 5 y 6" — agrupa por fila, junta los números de cada una
// con "y" antes del último.
function resumenSeleccion(butacas) {
  const porFila = new Map()
  for (const b of butacas) {
    if (!porFila.has(b.fila)) porFila.set(b.fila, [])
    porFila.get(b.fila).push(b.numero)
  }
  return [...porFila.entries()].map(([fila, numeros]) => {
    numeros.sort((a, b) => a - b)
    const lista = numeros.length > 1
      ? `${numeros.slice(0, -1).join(', ')} y ${numeros[numeros.length - 1]}`
      : `${numeros[0]}`
    return `Fila ${fila}, butaca${numeros.length > 1 ? 's' : ''} ${lista}`
  }).join(' · ')
}

export default function ElegirButacas() {
  const { compraId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { compras, cargando: cargandoEntradas, recargar: recargarEntradas } = useEntradas()
  const { plano, cargando: cargandoPlano, error: errorPlano, recargar: recargarPlano } = usePlano(compraId)

  const [seleccion, setSeleccion] = useState(() => new Set())
  const [hojaAbierta, setHojaAbierta] = useState(false)
  const [enVuelo, setEnVuelo] = useState(false)
  const [sinConexion, setSinConexion] = useState(false)
  const [actualizando, setActualizando] = useState(false)

  const compra = compras.find((c) => c.id === compraId)
  const modo = compra?.puede_elegir_butacas ? 'elegir' : compra?.puede_cambiar_butacas ? 'cambiar' : null

  const propiasIds = useMemo(() => new Set(plano?.propias ?? []), [plano])
  const ocupadasIds = useMemo(() => new Set(plano?.ocupadas ?? []), [plano])

  function alternarButaca(id) {
    setSeleccion((prev) => {
      const siguiente = new Set(prev)
      if (siguiente.has(id)) siguiente.delete(id)
      else siguiente.add(id)
      return siguiente
    })
  }

  const seleccionIdenticaAActual = modo === 'cambiar'
    && seleccion.size === propiasIds.size
    && [...seleccion].every((id) => propiasIds.has(id))

  const puedeConfirmar = compra && seleccion.size === compra.cantidad && !seleccionIdenticaAActual

  async function actualizarDisponibilidad() {
    setActualizando(true)
    try {
      await recargarPlano()
    } catch {
      toast('No pudimos actualizar la disponibilidad.', 'error')
    } finally {
      setActualizando(false)
    }
  }

  async function manejarError(e) {
    if (!e.status) {
      setSinConexion(true)
      return
    }
    if (e.codigo === 'ERR_BUTACA_OCUPADA') {
      const fresco = await recargarPlano().catch(() => null)
      const ocupadasFrescas = new Set(fresco?.ocupadas ?? [])
      setSeleccion((prev) => new Set([...prev].filter((id) => !ocupadasFrescas.has(id))))
      setHojaAbierta(false)
      toast('Alguien eligió una de esas butacas justo antes que vos: la sacamos de tu selección. Elegí otra para completarla.', 'error')
      return
    }
    if (e.codigo === 'ERR_YA_TIENE_BUTACAS') {
      await recargarEntradas()
      setHojaAbierta(false)
      toast('Esta compra ya tenía sus butacas asignadas.', 'info')
      navigate('/mis-entradas')
      return
    }
    if (CODIGOS_VOLVER.includes(e.codigo)) {
      setHojaAbierta(false)
      toast(e.message, 'error')
      navigate('/mis-entradas')
      return
    }
    if (e.status === 422) {
      await recargarPlano().catch(() => null)
      setHojaAbierta(false)
      toast('No pudimos procesar esa selección. Revisá el plano e intentá de nuevo.', 'error')
      return
    }
    setHojaAbierta(false)
    toast(e.message || 'Ocurrió un error inesperado.', 'error')
  }

  async function confirmar() {
    setEnVuelo(true)
    setSinConexion(false)
    try {
      const butacaIds = [...seleccion]
      if (modo === 'elegir') await elegirButacas(compraId, butacaIds)
      else await cambiarButacas(compraId, butacaIds)
      await recargarEntradas()
      setHojaAbierta(false)
      toast(modo === 'elegir' ? '¡Elegiste tus butacas! Ya podés ver tu QR en Mis entradas.' : 'Cambiaste tus butacas.', 'success')
      navigate('/mis-entradas')
    } catch (e) {
      await manejarError(e)
    } finally {
      setEnVuelo(false)
    }
  }

  if (cargandoEntradas) return <Spinner className="mt-20" />

  if (!compra) {
    return (
      <div className="p-4">
        <EmptyState icon={AlertTriangle} title="No encontramos esta compra" description="Puede que el enlace esté mal o que la compra no sea tuya." />
        <Button variant="secondary" className="w-full justify-center mt-2" onClick={() => navigate('/mis-entradas')}>
          Volver a Mis entradas
        </Button>
      </div>
    )
  }

  if (!modo) {
    const motivo = motivoButacas(compra) || 'No podés elegir ni cambiar butacas en este momento.'
    return (
      <div className="p-4">
        <EmptyState icon={Ticket} title="No se pueden elegir butacas ahora" description={motivo} />
        <Button variant="secondary" className="w-full justify-center mt-2" onClick={() => navigate('/mis-entradas')}>
          Volver a Mis entradas
        </Button>
      </div>
    )
  }

  const butacasSeleccionadas = plano ? plano.butacas.filter((b) => seleccion.has(b.id)) : []

  return (
    <div className="p-4 space-y-4 pb-28">
      <div>
        <h1 className="text-xl font-bold text-gray-800">{compra.evento.nombre}</h1>
        {compra.funcion && (
          <p className="text-sm text-gray-500 mt-0.5">
            {formatFecha(compra.funcion.fecha)}
            {compra.funcion.hora ? ` · ${formatHora(compra.funcion.hora)} hs` : ''}
            {' · '}{compra.funcion.sala_nombre}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {modo === 'elegir' ? 'Elegí tus butacas' : 'Cambiá tus butacas'}
        </p>
      </div>

      {cargandoPlano && <Spinner className="mt-10" />}

      {!cargandoPlano && errorPlano && (
        <EmptyState icon={AlertTriangle} title="No pudimos cargar el plano" description="Probá de nuevo en un momento." />
      )}

      {!cargandoPlano && plano && (
        <>
          <MapaButacas
            butacas={plano.butacas}
            ocupadas={ocupadasIds}
            propias={propiasIds}
            seleccion={seleccion}
            cantidad={compra.cantidad}
            onToggle={alternarButaca}
          />

          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-center"
            onClick={actualizarDisponibilidad}
            disabled={actualizando}
          >
            <RotateCw size={14} className={actualizando ? 'animate-spin' : ''} />
            Actualizar disponibilidad
          </Button>
        </>
      )}

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto border-t border-gray-100 bg-white p-4 space-y-2">
        <p className="text-xs text-gray-400">
          Las butacas se asignan al confirmar: si otra familia confirma antes, vas a tener que elegir otra.
        </p>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-gray-700">
            Elegiste {seleccion.size} de {compra.cantidad}
          </p>
          <Button variant="primary" disabled={!puedeConfirmar} onClick={() => setHojaAbierta(true)}>
            Confirmar
          </Button>
        </div>
      </div>

      <Modal isOpen={hojaAbierta} onClose={() => { if (!enVuelo) setHojaAbierta(false) }} title="Confirmar butacas" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-700 font-medium">{resumenSeleccion(butacasSeleccionadas)}</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            {modo === 'elegir'
              ? 'Después de confirmar vas a poder cambiarlas una sola vez desde la app.'
              : 'Es el único cambio que podés hacer desde la app. Tus QR siguen valiendo, pero las imágenes que ya descargaste muestran la butaca anterior: volvé a descargarlas.'}
          </p>

          {sinConexion && (
            <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">
              No hay conexión. Tu selección sigue guardada: probá de nuevo.
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setHojaAbierta(false)} disabled={enVuelo}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={confirmar} disabled={enVuelo}>
              {enVuelo ? 'Confirmando…' : sinConexion ? 'Reintentar' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
