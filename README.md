# CREAR — Portal de Familias (PWA)

Portal de autogestión para tutores/familias de la Escuela de Danzas CREAR: consultan clases, horarios, asistencia, cuotas, notas, eventos y avisos de sus hijas. Pensado mobile-first, instalable como PWA.

Es el **frontend del rol Alumno/Tutor** únicamente — el sistema de administración (Dirección/Secretaría/Profesoras) vive en otro repo aparte. Los dos hablan con el mismo backend compartido: [`crear-backend`](#) (ver más abajo cómo levantarlo).

## Stack

React + Vite + Tailwind CSS + React Router. Sin librerías de estado externas — contexto de React alcanza para lo que necesita este proyecto.

## 1. Clonar e instalar

```bash
git clone <URL de este repo>
cd <carpeta-del-repo>
npm install
```

## 2. Configurar el `.env`

```bash
cp .env.example .env
```

Abrí `.env` y confirmá que `VITE_API_URL` apunte a donde esté corriendo el backend — en desarrollo local, normalmente:

```
VITE_API_URL=http://localhost:8000
```

**El backend tiene que estar corriendo antes de probar la app** — sin él, el login no funciona (no hay ningún modo mock, todo lo que ves en pantalla viene de datos reales). Instrucciones completas en [`BACKEND_SETUP.md`](./BACKEND_SETUP.md).

## 3. Levantar el front

```bash
npm run dev
```

Te va a mostrar una URL, normalmente `http://localhost:5173`.

## 4. Conseguir credenciales para entrar

Con el backend ya levantado (ver `BACKEND_SETUP.md`), la forma más rápida de tener datos de prueba reales es cargar la demo que ya trae `crear-backend`:

```bash
docker compose -f docker-compose.dev.yml exec backend python -m app.cli demo cargar
```

Esto imprime, **una sola vez**, tres cuentas de prueba (secretaria, profesora, familia) con la misma contraseña — guardala apenas la veas, no se vuelve a mostrar. Entrá a la PWA con la cuenta de **familia** (rol `tutor`).

Para borrar esos datos de prueba más adelante: `python -m app.cli demo borrar` (mismo comando, dentro del contenedor del backend).

## Estructura del proyecto

```
src/
├── api/              # cliente HTTP — todas las llamadas al backend pasan por acá
├── components/
│   ├── ui/             # piezas genéricas compartidas con el sistema de administración
│   ├── layout/         # Shell, Header, BottomNav — el armazón del portal
│   └── portal/         # piezas específicas de una pantalla (CalendarioMensual, modales, etc.)
├── context/          # AuthContext (sesión), AlumnoActivoContext (qué hija se está viendo)
├── hooks/            # un hook por recurso (useCargos, useAsistencias, useEventos, etc.)
├── pages/            # una página por ruta
├── routes/           # RequireRole — el guard de sesión/rol
├── utils/            # format.js — toda la lógica de "cómo se muestra un dato" vive acá
└── mock/             # fixtures.js — SOLO para lo que todavía no tiene endpoint real (ver abajo)
```

## Qué está conectado a datos reales y qué no

| Módulo | Estado |
|---|---|
| Login (con 2FA, passkeys y refresh automático) | ✅ Real |
| Home, Pagos, Asistencia, Clases, Horarios (con feriados), Perfil, Evaluaciones | ✅ Real |
| Avisos en Home, Notificaciones | ✅ Real (calculados en el front a partir de varios endpoints, no hay tabla de "notificaciones" en el backend) |
| Eventos (cartelera y detalle) | ✅ Real, solo lectura |
| Compra de entradas / butacas / vestuario de eventos | ⬜ Mockeado, sin conectar — módulo grande pendiente, no tiene ningún endpoint en el backend todavía |
| "Clases disponibles" (inscribirse a una clase nueva) | ⬜ Mockeado — sin confirmar si el rol tutor puede autoinscribirse |

## Convenciones a respetar

- **Nunca `fecha.toISOString()` para fechas locales** — corre el día en zonas UTC+ (como Argentina). Usar `hoyLocalISO()` de `utils/format.js`. Hay una regla de ESLint que bloquea esto (`npm run lint`).
- **Las mutaciones (crear/editar) nunca caen a un mock si fallan** — si algo no tiene endpoint real, se muestra un error claro o el elemento directamente no aparece. Nunca se simula un éxito.
- Antes de modificar `components/ui/` — es compartido con el sistema de administración, avisar al equipo del otro repo.

## PWA

El proyecto ya es instalable (manifest + service worker vía `vite-plugin-pwa`). Para probarlo: `npm run build && npm run preview`, abrir en Chrome/Edge y confirmar el ícono de instalar en la barra de direcciones.