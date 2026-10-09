// Datos de ejemplo — solo para lo que todavía no tiene endpoint real en el
// backend (ver Claude.md, "Recortes de alcance"). Familia/alumnos/cargos/
// asistencia/clases-propias ya no se mockean: salen de /portal/hijas,
// /portal/hijas/{id}/cuenta-corriente, /pagos y /asistencia.

export const proximoEventoDemo = {
  id: 'ev1', titulo: 'Gala Anual CREAR', fecha: '2026-09-30', diasRestantes: 13,
}

// titulo sale de examen.descripcion en el modelo real (texto libre que
// carga la profesora, no un enum "Final/Parcial")
export const evaluacionesDemo = [
  {
    id: 'ex1',
    grupoNombre: 'Danza Clásica',
    esProfesorado: true,
    fecha: '2026-09-01',
    titulo: 'Examen Final 2026',
    detalle: [
      { criterioNombre: 'Expresión', nota: 9, observaciones: null },
      { criterioNombre: 'Ritmo', nota: 8, observaciones: 'Mejoró mucho el timing' },
      { criterioNombre: 'Técnica', nota: 9, observaciones: null },
    ],
  },
  {
    id: 'ex2',
    grupoNombre: 'Danza Clásica',
    esProfesorado: true,
    fecha: '2026-05-11',
    titulo: 'Examen Parcial 2026',
    detalle: [
      { criterioNombre: 'Expresión', nota: 8, observaciones: null },
      { criterioNombre: 'Ritmo', nota: 8, observaciones: null },
      { criterioNombre: 'Técnica', nota: 8, observaciones: null },
    ],
  },
]

// Módulo de Eventos (mock completo) — retoma el flujo de entradas con mapa
// de butacas que había quedado pausado por falta de modelo de datos (ver
// Claude.md). Se construye mockeado primero, documentando acá el schema
// propuesto, para coordinar con la compañera antes de tocar el backend.
export const eventosDemo = [
  {
    id: 'ev1', titulo: 'Gala Anual CREAR', tipo: 'gala',
    fecha: '2026-09-30', hora: '20:00', lugar: 'Auditorio Municipal',
    descripcion: 'Nuestra muestra de fin de año con la participación de todas las comisiones. Sofía baila en la Tanda 3 (Cierre).',
    fechaLimitePago: '2026-09-25',
    mapaAsientos: {
        sector: 'Platea',
        precio: 5000,
        sillasRuedas: { cupo: 2 },
      filas: [
        { fila: 'A', bloques: [[20, 18, 16], [14, 12, 10, 8, 6, 4, 2], [1, 3, 5, 7, 9, 11, 13], [15, 17, 19]] },
        { fila: 'B', bloques: [[20, 18, 16], [14, 12, 10, 8, 6, 4, 2], [1, 3, 5, 7, 9, 11, 13], [15, 17, 19]] },
        { fila: 'C', bloques: [[20, 18, 16], [14, 12, 10, 8, 6, 4, 2], [1, 3, 5, 7, 9, 11, 13], [15, 17, 19]] },
        { fila: 'D', bloques: [[18, 16], [14, 12, 10, 8, 6, 4, 2], [1, 3, 5, 7, 9, 11, 13], [15, 17, 19]] },
        { fila: 'E', bloques: [[18, 16], [14, 12, 10, 8, 6, 4, 2], [1, 3, 5, 7, 9, 11, 13], [15, 17, 19]] },
        { fila: 'F', bloques: [[20, 18, 16], [14, 12, 10, 8, 6, 4, 2], [1, 3, 5, 7, 9, 11, 13], [15, 17, 19]] },
        { fila: 'G', bloques: [[20, 18, 16], [14, 12, 10, 8, 6, 4, 2], [1, 3, 5, 7, 9, 11, 13], [15, 17]] },
        { fila: 'H', bloques: [[20, 18, 16], [14, 12, 10, 8, 6, 4, 2], [1, 3, 5, 7, 9, 11, 13], [15, 17]] },
        { fila: 'I', bloques: [[20, 18, 16], [14, 12, 10, 8, 6, 4, 2], [1, 3, 5, 7, 9, 11, 13], [15, 17]] },
        { fila: 'J', bloques: [[18, 16], [], [], [15, 17]] },
        { fila: 'K', corrida: [18, 16, 14, 12, 10, 8, 6, 4, 2] },
      ],
    },
  },
  {
    id: 'ev2', titulo: 'Clase abierta a familias', tipo: 'otro',
    fecha: '2026-10-15', hora: '18:00', lugar: 'Sede CREAR',
    descripcion: 'Vení a ver una clase de Danza Clásica en vivo. Entrada libre y gratuita.',
    fechaLimitePago: null,
    mapaAsientos: null,
  },
]

export const misEntradasDemo = [
  {
    id: 'ent1', eventoId: 'ev1', eventoTitulo: 'Gala Anual CREAR',
    fecha: '2026-09-30', lugar: 'Auditorio Municipal',
    butacas: [{ sector: 'Platea', fila: 'D', columna: 6 }],
    estado: 'pago_en_revision', montoTotal: 5000,
  },
]

// Vestuario por evento — mismos 3 estados que un pago cualquiera
// (pendiente/pago_en_revision/pagado), ver infoEstadoPago() en format.js.
// Solo `ev1` tiene ítems cargados; `ev2` (entrada libre) no tiene vestuario.
export const vestuarioPorEventoDemo = {
  ev1: [
    { id: 'vt1', nombre: 'Malla Gala Anual', descripcion: 'Malla violeta con detalles en tul, uso obligatorio para la Tanda 3.', precio: 18000, estado: 'pendiente' },
    { id: 'vt2', nombre: 'Zapatillas de punta (alquiler)', descripcion: 'Alquiler por el evento, se devuelven al finalizar.', precio: 8000, estado: 'pendiente' },
  ],
}

