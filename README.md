# CREAR — Portal de Familias (PWA)

Portal de autogestión para tutores/familias de la Escuela de Danzas CREAR: consultan clases, horarios, asistencia, cuotas, notas, eventos y avisos de sus hijas. Pensado mobile-first, instalable como PWA.

Es el **frontend del rol Alumno/Tutor** únicamente: el sistema de administración (Dirección/Secretaría/Profesoras) vive en otro repo. Los dos hablan con el mismo backend compartido, `crear-backend`, que hay que tener corriendo para usar esta app. Cómo levantarlo: [`BACKEND_SETUP.md`](./BACKEND_SETUP.md).

## Stack

React + Vite + Tailwind CSS + React Router. Sin librerías de estado externas: con el contexto de React alcanza.

## Requisitos previos

| Herramienta | Para qué | Versión |
|---|---|---|
| Git | clonar el repo | cualquiera reciente |
| Node.js | correr el front | 18 o más (LTS) |
| Docker Desktop | levantar el backend (Postgres + API) | con Docker Compose v2 |

Instalación: [Node.js LTS](https://nodejs.org), [Git](https://git-scm.com) y [Docker Desktop](https://www.docker.com/products/docker-desktop). En Windows, el instalador de Docker Desktop propone activar WSL 2: aceptalo.

Comprobá que quedó todo (en cualquier sistema):

```
node -v
npm -v
git --version
docker --version
```

**Terminal.** En Windows usá **PowerShell** (no `cmd`). Los comandos de este README son iguales en todos los sistemas, salvo donde hay dos bloques: uno `powershell` (Windows) y otro `bash` (Linux/Mac). Si preferís Git Bash en Windows, los bloques `bash` funcionan tal cual.

## 1. Clonar e instalar

```
git clone <URL de este repo>
cd <carpeta-del-repo>
npm install
```

## 2. Configurar el `.env`

Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

Linux/Mac:

```bash
cp .env.example .env
```

Abrilo (en Windows: `code .env` si tenés VS Code, o `notepad .env`) y confirmá que `VITE_API_URL` apunte al backend. En desarrollo local:

```
VITE_API_URL=http://localhost:8000
```

> En Windows, no crees el `.env` desde el Bloc de notas con "Guardar como": suele guardarlo como `.env.txt` y Vite no lo lee. Usá `Copy-Item` como arriba.

`VITE_PUBLIC_URL` es el dominio público que entra en el texto del QR de cada entrada (`${VITE_PUBLIC_URL}/entrada/<codigo>`). Sin definir, se usa `window.location.origin` — anda para desarrollo local, pero en producción tiene que ser el dominio real: si no, el QR escaneado desde el celular de otra persona abriría `localhost`.

## 3. Levantar el backend (obligatorio)

La app no tiene modo de prueba sin backend: el login y todo lo que se ve vienen de datos reales. Seguí [`BACKEND_SETUP.md`](./BACKEND_SETUP.md) y volvé acá cuando `http://localhost:8000/health` responda.

## 4. Levantar el front

```
npm run dev
```

Vite muestra la URL, normalmente `http://localhost:5173`.

## 5. Conseguir credenciales para entrar

Con el backend arriba, cargá los datos de prueba **desde la carpeta de `crear-backend`** (ahí está `docker-compose.dev.yml`; este repo no lo tiene):

```
docker compose -f docker-compose.dev.yml exec backend python -m app.cli demo cargar
```

Imprime, **una sola vez**, tres cuentas (secretaría, profesora y familia) con la misma contraseña. Guardala apenas la veas: no se vuelve a mostrar, y cada vez que se corre `demo cargar` se genera una nueva.

Para entrar a la PWA usá la cuenta de familia: `familia@demo.crear-academia.com`.

Para borrar los datos de prueba: el mismo comando con `demo borrar` en lugar de `demo cargar`.

## Estructura del proyecto

```
src/
├── api/              # cliente HTTP: todas las llamadas al backend pasan por acá
├── components/
│   ├── ui/             # piezas genéricas compartidas con el sistema de administración
│   ├── layout/         # Shell, Header, BottomNav: el armazón del portal
│   └── portal/         # piezas de una pantalla (CalendarioMensual, modales, etc.)
├── context/          # AuthContext (sesión), AlumnoActivoContext (qué hija se está viendo)
├── hooks/            # un hook por recurso (useCargos, useAsistencias, useEventos, etc.)
├── pages/            # una página por ruta
├── routes/           # RequireRole: el guard de sesión/rol
├── utils/            # format.js: toda la lógica de "cómo se muestra un dato"
└── mock/             # fixtures.js: `proximoEventoDemo` lo usa Home.jsx de verdad; el resto (eventos/entradas/vestuario del flujo viejo de compra) quedó sin ninguna ruta que lo use desde que se borraron EventoButacas/ResumenCompra/VestuarioEvento — no se tocó porque useMisEntradas.js y useVestuarioEvento.js todavía los importan, aunque nada los llame a ellos tampoco
```

## Qué está conectado a datos reales y qué no

| Módulo | Estado |
|---|---|
| Login (con 2FA y renovación automática de sesión) | ✅ Real |
| Home (avisos de cuota, asistencia y apto físico) | ✅ Real |
| Pagos (cuotas pendientes, historial, recibos en PDF y pago online de cuotas) | ✅ Real |
| Asistencia | ✅ Real |
| Clases y Horarios (calendario con feriados) | ✅ Real |
| Clases disponibles | ✅ Real: la familia pide un lugar y la secretaría lo confirma, inscribe y genera la cuota |
| Evaluaciones | ✅ Real |
| Perfil (edición de contacto y apto físico) | ✅ Real |
| Eventos (cartelera y detalle) | ✅ Real, solo lectura |
| Vestuario (cuotas y pagos, desde Eventos, con pago online) | ✅ Real |
| Notificaciones | ✅ Híbrido: cuotas y pagos vienen del backend (la lectura se guarda en el servidor); asistencia baja, apto físico, notas y eventos se calculan en el front y su lectura se guarda por dispositivo |
| Entradas con butacas | 🟡 Parcial: Mis entradas, elegir y cambiar butacas, pago online ✅; devoluciones ⬜ |
| Pago online (Mercado Pago) | 🟡 Parcial: cuotas ✅, vestuario ✅, entradas ✅; matrícula todavía paga solo en mostrador |

## Convenciones a respetar

- **Nunca `fecha.toISOString()` para fechas locales:** corre el día en zonas UTC+ (como Argentina). Usar `hoyLocalISO()` de `utils/format.js`. Hay una regla de ESLint que lo bloquea (`npm run lint`).
- **Las mutaciones (crear/editar) nunca caen a un mock si fallan:** si algo no tiene endpoint real, se muestra un error claro o el elemento directamente no aparece. Nunca se simula un éxito.
- Antes de modificar `components/ui/`, avisar al equipo del otro repo: es compartido con el sistema de administración.

## PWA (instalarla)

El proyecto ya es instalable (manifest + service worker con `vite-plugin-pwa`). Para probarlo hay que compilar y servir la versión de producción:

```
npm run build
npm run preview
```

(Dos comandos separados: el `&&` no existe en Windows PowerShell 5.1.)

Abrilo en Chrome o Edge y buscá el ícono de instalar en la barra de direcciones.

**Probarlo desde el celular** (misma red Wi-Fi que la compu):

```
npm run preview -- --host
```

Vite imprime una dirección tipo `http://192.168.x.x:4173`; abrila desde el navegador del teléfono. Si no la ves, averiguá la IP de la compu con `ipconfig` (Windows) o `hostname -I` (Linux). La primera vez, Windows pregunta si permitís Node.js en redes privadas: aceptá. Ojo con que el backend solo acepta pedidos desde los orígenes de su lista `BACKEND_CORS_ORIGINS` (en `crear-backend/backend/.env`): para que el login ande desde la IP del celular hay que sumarla ahí.

## Problemas frecuentes

**Windows**

- **`npm : No se puede cargar el archivo ... npm.ps1 porque la ejecución de scripts está deshabilitada`.** PowerShell bloquea scripts por defecto. Se arregla una sola vez:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
  ```
  Cerrá y reabrí la terminal.
- **`'npm' no se reconoce como un comando`.** Cerrá y reabrí la terminal después de instalar Node.js; si sigue, reinstalalo marcando la opción de agregarlo al PATH.
- **`&&` no funciona.** Windows PowerShell 5.1 no lo soporta: escribí cada comando en su propia línea (o instalá PowerShell 7).
- **El login falla con "blocked by CORS policy" y la app corre en el puerto 5174.** Vite sube al puerto siguiente si el 5173 está ocupado, y el backend solo permite el 5173. Cerrá la otra instancia. Para ver qué usa el puerto:
  ```powershell
  netstat -ano | findstr :5173
  tasklist /FI "PID eq <numero-de-la-ultima-columna>"
  ```

**Cualquier sistema**

- **"Error 401" o "Usuario o contraseña incorrectos".** La contraseña de la demo cambia cada vez que se corre `demo cargar`. Tras 5 intentos fallidos el backend bloquea el login unos minutos (error 429): esperá en vez de seguir probando.
- **Pantalla de error al entrar a Eventos o a Notificaciones.** Casi siempre es que el backend no está arriba o quedó con una migración pendiente: ver [`BACKEND_SETUP.md`](./BACKEND_SETUP.md), sección "Problemas frecuentes".