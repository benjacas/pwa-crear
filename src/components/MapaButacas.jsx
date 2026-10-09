import { useState } from 'react'
import { X, Check, Accessibility } from 'lucide-react'

const TAMANO_BUTACA = 32 // px — el mínimo que pedía el pedido, nada de zoom propio: se deshabilita el pinch-zoom del navegador si se achica más de acá sin compensarlo con algo propio, y eso no está pedido.

function estadoDeButaca(butaca, { ocupadas, seleccion, propias }) {
  if (ocupadas.has(butaca.id)) return 'ocupada'
  if (seleccion.has(butaca.id)) return 'elegida'
  if (propias.has(butaca.id)) return 'propia'
  return 'libre'
}

const CLASES_POR_ESTADO = {
  libre: 'bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary',
  ocupada: 'bg-gray-100 text-gray-300 cursor-not-allowed',
  elegida: 'bg-primary text-white border border-primary',
  propia: 'bg-blue-50 text-blue-700 border-2 border-blue-400',
}

function Butaca({ butaca, estado, onClick }) {
  const esRuedas = butaca.tipo === 'silla_ruedas'
  const tipoTexto = esRuedas ? 'lugar para silla de ruedas' : 'butaca'
  const estadoTexto = { libre: 'libre', ocupada: 'ocupada', elegida: 'elegida', propia: 'tuya' }[estado]
  const ariaLabel = esRuedas
    ? `Fila ${butaca.fila}, lugar para silla de ruedas ${butaca.numero}, ${estadoTexto}`
    : `Fila ${butaca.fila}, butaca ${butaca.numero}, ${estadoTexto}`

  return (
    <button
      type="button"
      disabled={estado === 'ocupada'}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={estado === 'elegida'}
      style={{
        gridColumn: butaca._col,
        gridRow: butaca._fila,
        width: TAMANO_BUTACA,
        height: TAMANO_BUTACA,
      }}
      className={`rounded-md text-[10px] font-semibold flex items-center justify-center transition-colors shrink-0 ${CLASES_POR_ESTADO[estado]} ${esRuedas ? 'ring-1 ring-offset-1 ring-sky-400' : ''}`}
    >
      {estado === 'ocupada' ? (
        <X size={14} aria-hidden="true" />
      ) : estado === 'elegida' ? (
        <Check size={14} aria-hidden="true" />
      ) : esRuedas ? (
        <Accessibility size={16} aria-hidden="true" />
      ) : (
        butaca.numero
      )}
    </button>
  )
}

// `butacas`, `ocupadas` (Set de ids) y `propias` (Set de ids) vienen tal
// cual del plano real (GET .../plano). `seleccion` es un Set de ids
// controlado por quien usa el componente (ElegirButacas.jsx) — acá solo se
// decide SI se puede sumar una butaca más (tope en `cantidad`) y se avisa
// si no, sin reemplazar nada en silencio.
export default function MapaButacas({ butacas, ocupadas, propias, seleccion, cantidad, onToggle }) {
  const [avisoLimite, setAvisoLimite] = useState(false)

  if (butacas.length === 0) return null

  const colMin = Math.min(...butacas.map((b) => b.col))
  const filaOrdenes = [...new Set(butacas.map((b) => b.fila_orden))].sort((a, b) => a - b)
  const filaPorOrden = new Map(butacas.map((b) => [b.fila_orden, b.fila]))
  const columnas = Math.max(...butacas.map((b) => b.col)) - colMin + 1

  function manejarClick(butaca, estado) {
    if (estado === 'ocupada') return
    if (estado === 'libre' || estado === 'propia') {
      if (seleccion.size >= cantidad) {
        setAvisoLimite(true)
        return
      }
    }
    setAvisoLimite(false)
    onToggle(butaca.id)
  }

  const hayPropias = propias.size > 0

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-3 overflow-x-auto">
        <div
          className="grid gap-1.5 w-fit"
          style={{
            gridTemplateColumns: `auto repeat(${columnas}, ${TAMANO_BUTACA}px)`,
            gridTemplateRows: `auto repeat(${filaOrdenes.length}, ${TAMANO_BUTACA}px)`,
          }}
        >
          <div
            style={{ gridColumn: `1 / -1`, gridRow: 1 }}
            className="bg-primary-light/50 rounded-xl py-2.5 mb-1 overflow-hidden"
          >
            {/* El texto va sticky adentro de la barra, pegado a la
                izquierda (no centrado en todo el grid): el grid puede ser
                más ancho que la pantalla, y centrado en el ancho total el
                texto quedaba scrolleado fuera de vista la mayor parte del
                tiempo. */}
            <p className="sticky left-2 inline-block text-xs font-semibold text-primary">
              Escenario
            </p>
          </div>

          {filaOrdenes.map((fo, i) => (
            <span
              key={`etiqueta-${fo}`}
              style={{ gridColumn: 1, gridRow: i + 2 }}
              className="sticky left-0 z-10 bg-white flex items-center justify-center text-xs font-medium text-gray-400 pr-1"
            >
              {filaPorOrden.get(fo)}
            </span>
          ))}

          {butacas.map((butaca) => {
            const fila = filaOrdenes.indexOf(butaca.fila_orden) + 2
            const col = butaca.col - colMin + 2
            const estado = estadoDeButaca(butaca, { ocupadas, seleccion, propias })
            return (
              <Butaca
                key={butaca.id}
                butaca={{ ...butaca, _fila: fila, _col: col }}
                estado={estado}
                onClick={() => manejarClick(butaca, estado)}
              />
            )
          })}
        </div>
      </div>

      {avisoLimite && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
          Ya elegiste {cantidad === 1 ? '1 butaca' : `${cantidad} butacas`}; soltá una para elegir otra.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 justify-center">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded border border-gray-200 bg-white" />
          Libre
        </span>
        <span className="flex items-center gap-1.5">
          <X size={12} className="text-gray-300" />
          Ocupada
        </span>
        <span className="flex items-center gap-1.5">
          <Check size={12} className="text-primary" />
          Elegida
        </span>
        {hayPropias && (
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded border-2 border-blue-400 bg-blue-50" />
            Tuya
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Accessibility size={14} className="text-sky-500" />
          Lugar para silla de ruedas
        </span>
      </div>
    </div>
  )
}
