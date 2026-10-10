# SistemaWeb_CREAR — Portal Alumno/Tutor dentro del sistema único

Este repo es el **sistema de gestión de la Escuela de Danzas CREAR**, construido
por mi compañera (React + Tailwind), al que ahora se le suma el **portal de
autogestión de Alumno/Tutor** (lo mío) como parte del mismo proyecto — un
solo login, un solo repo de React, rutas separadas por rol.

**Este es un repo distinto al proyecto viejo de la PWA** (Vite vanilla +
Supabase). Ese proyecto quedó descontinuado por decisión de la cátedra
("no usar Supabase" + pasar a stack compartido). El conocimiento del modelo
de datos real que se descubrió ahí (tablas `usuario`, `padre_tutor`, `alumno`,
`grupo_clase`, `cargo`, `calificacion`, etc.) sigue siendo válido como
referencia para diseñar el backend nuevo — se retoma cuando llegue esa etapa,
no antes.

## Contexto: por qué existe este repo así

- **Trabajo sobre un FORK** de este repo, no tengo push directo al original
  todavía (pedí acceso de colaboradora, en trámite). Cualquier cambio se hace
  acá; en algún momento se sincroniza con el repo original de mi compañera
  (PR o merge manual) — no asumir que eso ya pasó.
- **Backend: arrancó en la Fase B1/B2** (ver sección "Backend (FastAPI +
  Postgres + Docker)" más abajo) — esqueleto + Docker + schema completo con
  Alembic. **Todavía no está conectado al portal** — el frontend sigue
  trabajando 100% con datos mockeados (ver sección de datos abajo), no hay
  ninguna llamada real desde React a este backend todavía. Esa conexión es
  una fase futura, no asumir que ya pasó.
- **Login único con roles**: un solo login para todo el sistema. El token
  (cuando exista el backend) va a traer el rol del usuario logueado
  (`administrador`, `secretaria`, `profesor`, `alumno`, `tutor`), y cada rol
  ve sus propias rutas. Hoy el login todavía no está conectado a nada real.

## Regla crítica (histórico): este repo era COMPARTIDO con el sistema de administración

**Ya no lo es** — el admin se sacó de este repo y la estructura se aplanó
(ver "Estructura de carpetas" arriba: sin `pages/portal/` ni
`components/layout/portal/`, sin alias `Portal*` en los imports). Se deja
la sección siguiente tal cual quedó como referencia histórica de por qué la
estructura nació anidada así, no como estado actual.

- **`components/ui/`** (`Button`, `Input`, `Modal`, `Badge`, `Select`,
  `Spinner`, `Table`, `EmptyState`, `ConfirmModal`, `RadialProgress` [nuevo],
  `Avatar` [nuevo]) y **`context/ToastContext.jsx`**
  son de mi compañera — **reusar tal cual, nunca modificar su comportamiento
  existente**. Si un componente nuevo de UI genérica hace falta (ej. un
  indicador circular de porcentaje), se agrega ahí también, como pieza nueva,
  no se duplica en otro lado.
- **`components/layout/admin/`** (`Header`, `Sidebar`, `Layout`) es el shell
  de escritorio del sistema de administración — **no tocar, no reusar para
  el portal**. El portal es mobile-first con nav inferior, shell propio en
  `components/layout/portal/`.
- **`pages/administrador/`** (o el nombre de carpeta que corresponda una vez
  reorganizado) son las páginas de mi compañera — no tocar.
- **`pages/portal/`** es la carpeta nueva, compartida entre Alumno y Tutor
  (ver sección de roles abajo) — es mi territorio.
- Antes de modificar cualquier archivo fuera de `pages/portal/`,
  `components/layout/portal/`, `context/AlumnoActivoContext.jsx`, `hooks/`,
  `mock/`, `utils/format.js` — parar y avisar, no asumir que es seguro.

## Roles: Alumno y Tutor comparten las mismas páginas

La única diferencia real entre un Alumno logueado directamente y un Tutor es
que el Tutor puede tener más de un alumno vinculado y necesita poder
cambiar entre ellos. Por eso **no hay carpetas separadas `Alumno/` y `Tutor/`**
— una sola `pages/portal/`, con un contexto (`AlumnoActivoContext`) que
expone cuál es el "alumno activo" en cada momento:

```jsx
const { alumnoActivo, setAlumnoActivo, alumnosVinculados } = useContext(AlumnoActivoContext)
```

Si `alumnosVinculados.length <= 1`, ningún selector se muestra — el alumno
directo nunca ve la opción de "cambiar de alumno". Esto es sobre un
selector forzado (algo tipo `SeleccionarAlumno.jsx` en el flujo de login, o
un switcher en el header) — la sección "Mis alumnas" dentro de `Perfil.jsx`
es otra cosa: una lista informativa dentro de una pantalla a la que el
usuario entra por su cuenta, así que ahí se muestra siempre, tenga 1 o más
alumnos vinculados (con 1 solo, no hay nada para cambiar, pero tampoco
hace daño mostrarla).

## Estructura de carpetas

**Desde que este repo dejó de compartirse con el sistema de administración,
la estructura se aplanó**: ya no hay subcarpetas `portal/` bajo `pages/` ni
`components/layout/` — todo vive directo, sin el prefijo `Portal*` que antes
existía solo para no chocar con las páginas del admin en el archivo
compartido (`App.jsx` las importaba con alias `PortalHome`, `PortalPagos`,
etc.; ese alias ya no hace falta y se sacó). Los tres archivos que sí tenían
"Portal" en el propio nombre de archivo se renombraron: `PortalShell.jsx` →
`Shell.jsx`, `PortalHeader.jsx` → `Header.jsx`, `PortalLogin.jsx` →
`Login.jsx`.

```
src/
├── api/
│   └── client.js                   # fetch al backend real: login, getMisAlumnos, getAsistencia, getCargos
├── components/
│   ├── layout/
│   │   ├── Shell.jsx                # layout general (header + <Outlet/> + nav)
│   │   ├── Header.jsx               # Avatar (→ Perfil) + campanita notif.
│   │   └── BottomNav.jsx            # Inicio/Pagos/Asistencia/Clases/Evaluaciones
│   ├── ui/                          # Button, Input, Modal, Badge, etc.
│   └── ClaseDetalleModal.jsx, ComprobanteModal.jsx, EditarContactoModal.jsx,
│       MapaButacas.jsx, AlertaHome.jsx, CalendarioMensual.jsx
├── context/
│   ├── AlumnoActivoContext.jsx      # alumno activo + lista de vinculados
│   └── AuthContext.jsx              # token/rol/nombre, login()/logout()
├── routes/
│   └── RequireRole.jsx              # guard de las rutas autenticadas
├── pages/
│   ├── Login.jsx                    # login de tutores
│   ├── SeleccionarAlumno.jsx        # solo se ve si hay +1 alumno vinculado
│   ├── Home.jsx
│   ├── Pagos.jsx
│   ├── Asistencia.jsx
│   ├── Clases.jsx
│   ├── Horarios.jsx                 # calendario mensual + "Próximas clases" (de alumnoActivo.clases)
│   ├── Evaluaciones.jsx
│   ├── Perfil.jsx                   # el botón "Cerrar sesión" real vive acá
│   ├── Notificaciones.jsx
│   ├── Eventos.jsx, EventoDetalle.jsx, EventoButacas.jsx, ResumenCompra.jsx,
│   │   MisEntradas.jsx              # flujo de compra de entradas
│   └── VestuarioEvento.jsx
├── hooks/
│   └── useCargos.js, useAsistencias.js, etc.  # un hook por recurso, ver patrón abajo
├── mock/
│   └── fixtures.js                 # datos de ejemplo — Asistencia/Pagos ya no lo usan (Fase B9), otras páginas sí
└── utils/
    └── format.js                   # funciones puras: formatMoneda, formatFecha,
                                       badgeEstadoCargo, esCargoVencido, calcularAlertas, etc.
```

## Backend (FastAPI + Postgres + Docker)

Vive en `backend/`, separado del código de React de la raíz — es un
proyecto Python aparte dentro del mismo repo, no un paquete de node.
**Actualización**: al principio nada del portal lo consumía (mockeaba
todo), pero desde la Fase B7 las páginas Asistencia y Pagos ya hablan con
la API real — ver "Conexiones reales" más abajo, no queda vigente la
afirmación original de que "nada lo consume todavía".

```
backend/
├── app/
│   ├── main.py              # instancia FastAPI, CORS, incluye routers
│   ├── core/
│   │   ├── config.py          # Settings (pydantic-settings) — lee DATABASE_URL, SECRET_KEY, etc. de env
│   │   ├── security.py        # hash/verificación de password (bcrypt), crear/decodificar JWT
│   │   └── deps.py            # obtener_identidad_actual (dependencia de auth), verificar_acceso_a_alumno
│   ├── db/
│   │   ├── base.py            # Base declarativo de SQLAlchemy
│   │   └── session.py         # engine + SessionLocal + get_db()
│   ├── models/                # un archivo por tabla, ver backend/SCHEMA.md
│   ├── schemas/               # modelos Pydantic de respuesta, uno por recurso
│   ├── routers/
│   │   ├── health.py          # GET /health
│   │   ├── auth.py            # POST /login
│   │   ├── tutores.py         # GET/PATCH /tutores/me, GET /tutores/me/alumnos — requiere login
│   │   ├── asistencia.py      # GET /alumnos/{alumno_id}/asistencia — requiere login + vínculo con el alumno
│   │   ├── cargos.py          # GET /alumnos/{alumno_id}/cargos — requiere login + vínculo con el alumno
│   │   ├── clases.py          # GET /alumnos/{alumno_id}/clases — requiere login + vínculo con el alumno
│   │   ├── evaluaciones.py    # GET /alumnos/{alumno_id}/evaluaciones — requiere login + vínculo con el alumno
│   │   └── configuracion.py   # GET /configuracion — requiere login, nunca expone mp_access_token/kapso_api_key
│   ├── gestion_datos.py       # funciones reutilizables de alta (usuario, disciplina, grupo, alumno, inscripción, tutor, asistencia, cargo, pago, horario de clase, criterio, examen, calificación, configuración inicial, password)
│   ├── cargar_datos_reales.py # altas reales — editable, no idempotente, python -m app.cargar_datos_reales
│   └── asignar_passwords_prueba.py # uso único — contraseñas de desarrollo a los tutores de prueba
├── alembic/                  # migraciones — env.py lee DATABASE_URL de app.core.config
├── requirements.txt
├── Dockerfile
├── docker-compose.yml         # servicios db (Postgres 16) + api
├── .env.example               # copiar a .env antes de levantar
└── SCHEMA.md                  # schema completo documentado, con lo NUEVO/propuesto marcado
```

### Cómo levantarlo

```bash
cd backend
cp .env.example .env   # ajustar si hace falta — .env nunca se commitea (gitignored en la raíz)
# generar un SECRET_KEY real (no dejar el placeholder del .env.example):
python3 -c "import secrets; print(secrets.token_hex(32))"   # pegar el resultado en .env
docker compose up --build
curl localhost:8000/health   # → {"status": "ok"}
```

**Ojo con `SECRET_KEY` (y cualquier variable nueva de `.env`) en Docker**:
`.env` está en `.dockerignore` (nunca se copia a la imagen) — pydantic-settings
lee `.env` cuando corrés la app directo en el host, pero dentro del
contenedor la única forma de que la variable llegue es que
`docker-compose.yml` la pase explícitamente en `environment:` (docker
compose sí lee el `.env` del host para resolver `${SECRET_KEY}` ahí, son
dos mecanismos de lectura de `.env` distintos y solo uno aplica dentro
del contenedor). Si agregás una variable nueva a `Settings` en
`core/config.py`, agregala también a `environment:` del servicio `api`
en `docker-compose.yml` o el contenedor arranca con
`pydantic_core.ValidationError: Field required` aunque el `.env` del
host esté perfecto — pasó probando esta fase.

Para aplicar el schema contra una base nueva (ya viene aplicado si cloná
después de la Fase 2, pero por las dudas):

```bash
docker compose exec api alembic upgrade head
docker compose exec db psql -U crear -d crear_db -c '\dt'   # deberían aparecer 28 filas (27 tablas + alembic_version)
```

Con la base recién creada no hay ningún alumno todavía — Asistencia y
Pagos en el portal van a mostrar el estado de error hasta que exista al
menos uno (ver "Conexiones reales", más abajo, no tienen fallback a mock).
Para dar de alta gente real:

```bash
docker compose exec api python -m app.cargar_datos_reales
```

Edita `backend/app/cargar_datos_reales.py` a mano y agregá las líneas de
la persona nueva antes de correrlo — no es idempotente a propósito, cada
corrida son altas reales, no un reset (ver "Conexiones reales").

### Datos de prueba disponibles

Lo que deja cargado `backend/app/cargar_datos_reales.py` tal como está en
el repo ahora mismo (Fase B10) — pensado para tener casos variados a mano
cuando se arme login/roles, sin tener que ir a mirar la base:

| Tutor | Password | Parentesco | Alumna | DNI | Perfil |
|---|---|---|---|---|---|
| Marcela Gómez (`marcela.gomez@example.com`) | `prueba123` | madre | Sofía Ramírez | 45123456 | Caso simple: 1 sola alumna vinculada (sin selector). Asistencia 6/6 (100%). Cuota Septiembre **pagada** (Mercado Pago). 1 sola clase: Danza Clásica. Examen Final 2026: **8.7** (Expresión 9, Ritmo 8, Técnica 9). Apto físico **vigente** (presentado 2026-09-05). |
| Diego Torres (`diego.torres@example.com`) | `prueba123` | padre | Valentina Torres | 45789012 | Una de 2 hermanas (prueba el selector "Mis Alumnas"). Asistencia 3/6 (50%, por debajo del umbral). Cuota Agosto **pendiente y vencida** (venció 2026-08-10). **2 clases**: Danza Clásica + Jazz (única con más de una, para que el calendario de Horarios se note distinto). Sin calificaciones todavía (no rindió el Examen Final). Apto físico **no presentado** todavía. |
| Diego Torres (`diego.torres@example.com`) | `prueba123` | padre | Martina Torres | 45789013 | La otra hermana. Asistencia 5/6 (83%). Cuota Septiembre **parcial** (pagó $15.000 de $32.000, transferencia). 1 sola clase: Danza Clásica. Mismo Examen Final 2026 que Sofía, nota distinta: **7.0** (Expresión 7, Ritmo 6.5, Técnica 7.5). Apto físico **vencido** (presentado 2026-06-01, venció antes de hoy). |

**⚠️ `prueba123` es una contraseña de desarrollo, nunca la que se usaría
en un despliegue real.** La ponen ambas cuentas (Marcela y Diego) a
propósito, para no tener que recordar dos contraseñas distintas mientras
se prueba. Se asigna corriendo (una sola vez, después de
`cargar_datos_reales.py`):

```bash
docker compose exec api python -m app.asignar_passwords_prueba
```

Ni Sofía, Valentina ni Martina (las alumnas) tienen login propio ni
`password_hash` — en este sistema el login es de `usuario` (staff) o
`padre_tutor` (tutor), nunca del alumno directamente; ver "Fase 3a" más
abajo y `app/routers/auth.py`.

Los `id` (UUID) de cada fila son `gen_random_uuid()` — cambian cada vez
que se recrea la base, no están fijos en este documento. Para consultarlos:

```sql
SELECT pt.nombre || ' ' || pt.apellido AS tutor, a.nombre || ' ' || a.apellido AS alumna, a.dni
FROM padre_tutor pt
JOIN alumno_tutor at ON at.padre_tutor_id = pt.id
JOIN alumno a ON a.id = at.alumno_id
ORDER BY tutor, alumna;
```

Todas comparten la misma profesora (Lorena Cosanelli,
`lorena@crear.com`). Hay 2 `grupo_clase` (desde la Fase B11): **Danza
Clásica** (Intermedio, lunes y miércoles 18:00–19:30, **de profesorado**
— es la única con evaluaciones formales, ver Fase B12) y **Jazz**
(Inicial, viernes 17:00–18:00, recreativa, sin evaluaciones) — la
variedad está en el historial de asistencia/cargos de cada alumna, en a
qué clases está inscripta, y ahora también en sus notas del Examen Final
2026 (ver tabla arriba). Desde la Fase 3a, Marcela y Diego ya tienen
`password_hash` (ver arriba); la profesora y las 3 alumnas no tienen
login (no lo necesitan — ver "Decisión de auth" más abajo).

**Nota de zona horaria/entorno:** si `docker compose up` falla con
`port is already allocated` en el 5432, es porque ya hay otro Postgres
corriendo en esa máquina (le pasó a Claude Code probando en este sandbox —
había un Postgres de otro proyecto sin relación ocupando el puerto). No
es un problema del `docker-compose.yml`: cambiar momentáneamente el lado
del host del mapeo de puertos (`"5433:5432"` en vez de `"5432:5432"`) alcanza
para probar en una máquina con ese conflicto — el `api` habla con `db` por
la red interna de Docker (`db:5432`), así que el puerto del host no le
afecta para nada. El archivo commiteado usa `5432:5432`, el mapeo estándar.

### Decisión de auth: `password_hash` por tabla, sin `auth_user_id`

`usuario` y `padre_tutor` tienen su propio `password_hash` (columna
NULLABLE — se completa cuando esa identidad puntual tiene login asignado,
no todas lo tienen; ver "Datos de prueba disponibles" arriba) en vez de
un `auth_user_id` apuntando a un proveedor externo tipo Supabase Auth —
que es justo lo que la cátedra pidió reemplazar (ver "Contexto" arriba).
**Confirmado en la Fase B6 contra `schema_original_supabase.sql`**: la
columna `auth_user_id` sí existe ahí (FK a `auth.users`), la decisión de
no portarla es explícita, no un olvido — documentado en el modelo mismo
para que no se "redescubra" como faltante.

**✅ Login real implementado en la Fase 3a** (`passlib[bcrypt]` +
`python-jose[cryptography]`, agregados a `requirements.txt` en esa fase):
`POST /login` verifica contra `usuario.password_hash` o
`padre_tutor.password_hash` (ese orden) y devuelve un JWT. Ver la entrada
de esa fase en "Estado de avance" para el detalle completo — decisiones
de diseño (JWT simple sin refresh token, un solo `SECRET_KEY`), el rol
del identity payload (`tipo`: `"usuario"` vs `"padre_tutor"`, distinto de
`rol`), y el gotcha de `passlib`/`bcrypt` que hizo falta resolver.

**✅ Resuelto en la Fase B3** (encontrado probando la Fase B2 a mano, corregido
después). Los defaults de los campos `Enum` de SQLAlchemy (ej.
`usuario.estado` default `activo`) estaban implementados como `default=`
de Python — funcionaban perfecto insertando vía el ORM (que es como la
app real va a escribir), pero un `INSERT` de SQL crudo sin especificar
`estado` explícito fallaba con violación de `NOT NULL`. Se cambiaron las
8 columnas que tenían default real en el schema original
(`usuario.estado`, `alumno.estado`, `grupo_clase.estado`,
`inscripcion.estado`, `lista_espera.estado`, `cargo.estado`,
`liquidacion.estado`, `evento_institucional.tipo`) de `default=` a
`server_default=text("'valor'")`.

**✅ Auditado en el resto de las columnas en la Fase B4** (no solo
enums) — encontró 2 columnas `Boolean` más con el mismo problema
(`alumno.autorizacion_imagen`, `alumno.apto_fisico_presentado`). La Fase
B4 también sacó el default de `disciplina.tiene_profesorado` y
`grupo_clase.es_profesorado` asumiendo que el original no lo tenía —
**esto era incorrecto, corregido en la Fase B6** al auditar mecánicamente
contra `schema_original_supabase.sql`: ambas columnas sí tienen
`DEFAULT false` en el original, se les devolvió como
`server_default=text("false")`. Ver **"`default=` vs `server_default` —
auditado en las 27 tablas"** en `backend/SCHEMA.md` para la explicación
completa y la regla a seguir en cualquier tabla nueva de acá en adelante.

### Schema completo: `backend/SCHEMA.md`

El detalle de las ~28 tablas (qué está confirmado contra la base real vs.
qué es nuevo/propuesto y todavía sin validar con la compañera) vive en
`backend/SCHEMA.md`, no acá — es demasiado extenso para este archivo y
tiene su propio ciclo de vida (cambia cada vez que se toca `app/models/`).
Este `Claude.md` solo linkea a esa referencia; no la dupliques ni la dejes
desactualizada en los dos lugares a la vez.

## Patrón de datos: hooks custom en vez de `conFallback`

**Histórico** — el snippet de abajo es de antes de que existiera el backend
real. Desde la Tarea B, `useCargos`/`useAsistencias` ya no devuelven mock:
pegan de verdad a `/api/v1/portal/hijas/{id}/...` vía `fetchConToken`
(`api/client.js`). El patrón "un hook por recurso, ninguna página llama a
`fetch` directo" sigue vigente — lo que cambió es que el cuerpo del hook ya
no tiene mock adentro para Cargos/Asistencia/Clases (esta última ni
siquiera tiene hook propio: sale directo de `alumnoActivo.clases`, que ya
viene completo desde `/portal/hijas`). Notificaciones/Eventos/MisEntradas/
Vestuario sí conservan el patrón `try backend real, catch → mock + 
console.warn('[modo demo] ...')` que describe el snippet, porque esos
todavía no tienen endpoint real (ver "Diseño" arriba).

Sin backend, cada hook devuelve directo el mock. El día que exista la API de
FastAPI, se cambia el cuerpo del hook (no cada página que lo usa):

```js
// hooks/useCargos.js
import { useState, useEffect } from 'react'
import { cargosDemo } from '../mock/fixtures'

export function useCargos(alumnoId) {
  const [cargos, setCargos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      try {
        // más adelante: const data = await api.getCargos(alumnoId)
        setCargos(cargosDemo)
      } catch (error) {
        console.warn('[modo demo] cargos falló, usando mock', error)
        setCargos(cargosDemo)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [alumnoId])

  return { cargos, cargando }
}
```

Un hook por recurso (`useCargos`, `useAsistencias`, `useInscripciones`,
`useEvaluaciones`, `useNotificaciones`, `usePerfilAlumno`). Ninguna página
llama a `fetch` directo.

## Convenciones de código

- **Cualquier cálculo de "hoy" usa `hoyLocalISO()` (`utils/format.js`),
  nunca `new Date().toISOString()` directo** — este bug apareció tantas
  veces de pegarlo sin pensar desde un snippet (`esCargoVencido` en Pagos,
  `estadoAptoFisico` en Perfil, `proximosItems` en el calendario de
  Clases/Horarios, `calcularAvisos()` y `calcularNotificaciones()` en
  Home/Notificaciones — esta lista ya no se actualiza más a mano, ver
  abajo) que dejó de alcanzar documentarlo como "ojo con esto".
  `toISOString()` da la fecha en UTC, que en Argentina (UTC-3) queda
  adelantada durante la noche — cualquier comparación de "¿es hoy o ya
  pasó?" hecha contra eso corre el resultado casi un día en el peor caso.
  **Desde la Tarea K, esto ya no depende de que alguien lo note revisando
  a mano:** `eslint.config.js` tiene una regla `no-restricted-syntax` que
  bloquea cualquier `.toISOString()` suelto en `src/**/*.{js,jsx}` al
  correr `npm run lint` (CallExpression con
  `callee.property.name==='toISOString'`), con un mensaje que apunta
  directo a `hoyLocalISO()`. La única excepción es `src/utils/format.js`
  mismo: `hoyLocalISO()` lo usa adentro, pero sobre una fecha ya corregida
  con el offset local (`ahora.getTime() - offsetMs`), no directo sobre
  `new Date()` — confirmado leyendo el archivo antes de excluirlo, no
  asumido. Corrido `npm run lint` sobre todo el código una vez agregada la
  regla: pasó limpio, no quedó ningún caso sin corregir en ningún rincón.

## Ruteo: React Router

Definido en `src/App.jsx`. Desde que se sacó el prefijo `/portal` (mismo
momento en que se aplanó la estructura de carpetas, ver arriba), el mapa de
rutas es:

| Ruta | Página |
|---|---|
| `/login` | `Login.jsx` |
| `/seleccionar-alumno` | `SeleccionarAlumno.jsx` (requiere token) |
| `/` | `Home.jsx` (índice de `Shell.jsx`, requiere token + alumno activo) |
| `/pagos` | `Pagos.jsx` |
| `/asistencia` | `Asistencia.jsx` |
| `/clases` | `Clases.jsx` |
| `/horarios` | `Horarios.jsx` |
| `/evaluaciones` | `Evaluaciones.jsx` |
| `/perfil` | `Perfil.jsx` |
| `/notificaciones` | `Notificaciones.jsx` |
| `/eventos` | `Eventos.jsx` |
| `/eventos/:id` | `EventoDetalle.jsx` |
| `/eventos/:id/butacas` | `EventoButacas.jsx` |
| `/eventos/:id/resumen` | `ResumenCompra.jsx` |
| `/eventos/:id/vestuario` | `VestuarioEvento.jsx` |
| `/mis-entradas` | `MisEntradas.jsx` |

`RequireRole` (en `routes/RequireRole.jsx`) es el guard real: sin token
manda a `/login`, con token pero sin alumno activo manda a
`/seleccionar-alumno`. El login (`AuthContext.login`, `POST /login`) y
`getMisAlumnos` (`GET /tutores/me/alumnos`) son reales, no mock — pegan
contra `VITE_API_URL` (default `http://localhost:8000`).

## Diseño

- Paleta ya compatible con la del proyecto viejo: `primary: '#6D5AE6'`,
  `primary-dark: '#5647c8'`, `primary-light: '#EEE9FF'` (ya están en el
  `tailwind.config.js` de mi compañera, no se tocan). Falta agregar
  `primary-subtle` (fondo general cálido/crema de los mockups de Figma) —
  se agrega como color nuevo, sin modificar los existentes.
- `sidebar` / `sidebar-end` son del shell de admin — el portal no los usa.
- Mobile-first: pensar cada página del portal para una pantalla de celular
  primero, el shell de admin (sidebar de escritorio) no aplica acá.
- Mockups de referencia: Figma, capturas ya compartidas en la conversación
  de planificación (login, home, calendario, notas, cuotas, asistencia,
  comprobante, notificaciones, perfil). Con el backend real ya conectado
  (Tarea B), quedó confirmado que dos grupos de pantallas **no tienen
  endpoint en el backend real — mock indefinido**, no "pendiente" (esa
  palabra ya no aplica: no es que falte conectarlos, es que el backend real
  no tiene ninguna tabla ni ruta para esto todavía, ni fecha para tenerla):
  - **Eventos: la cartelera y el detalle ya son reales (Tarea G) — lo que
    sigue sin endpoint es el flujo de compra** (mapa de butacas, QR, "Mis
    entradas"). `GET /api/v1/portal/eventos?desde=` existe de verdad
    (`app/api/v1/portal.py`, excluye `tipo=examen` del lado del backend) y
    alimenta `Eventos.jsx`/`EventoDetalle.jsx` — pero no hay
    `GET /portal/eventos/{id}` (`EventoDetalle.jsx` reusa la lista de
    `useEventos()` y busca por id, no pide de nuevo), ni tablas de
    asientos/entradas/pagos de tickets en ningún lado. Sin botón "Elegir
    mis butacas", sin link a Vestuario, sin "Mis entradas" en ningún lado
    (ni en Eventos.jsx ni en Perfil.jsx) — **no queda ningún camino de
    navegación real hacia esas pantallas**, aunque las rutas siguen
    registradas en `App.jsx` y los archivos viejos del diseño de compra
    (`MapaButacas.jsx`, `EventoButacas.jsx`, `ResumenCompra.jsx`,
    `VestuarioEvento.jsx`, `MisEntradas.jsx`, `hooks/useEvento.js` —
    singular, distinto de `useEventos.js` — y `mock/fixtures.js`:
    `eventosDemo` con `mapaAsientos`, `butacasOcupadasDemo`,
    `misEntradasDemo`, `vestuarioPorEventoDemo`) se conservan sin tocar,
    como base de diseño para cuando se encare ese módulo de verdad. La
    tarjeta "Próx. evento" de Home sigue con `proximoEventoDemo` (dato
    simple, no es parte de esta tarea) — es el único resabio de mock que
    queda visible en el portal para Eventos.
  - ~~"Vestuario" (por evento) — sin endpoint en el backend real, mock
    indefinido~~ **conectada de verdad, ver Tarea L más abajo** — pero
    como `/vestuario` **de la alumna en general**, no por evento (el
    endpoint real no permite filtrar por evento). `vestuarioPorEventoDemo`
    y `VestuarioEvento.jsx` (el viejo, por evento) siguen existiendo sin
    tocar — ver la nota de alcance en la Tarea G sobre archivos de diseño
    que se conservan sin ruta de navegación real.
  - ~~Evaluaciones — sin endpoint en el backend real, mock indefinido~~
    **conectada de verdad, ver Tarea H más abajo.** El módulo M3 que no
    existía cuando se escribió esta lista terminó apareciendo del lado de
    `crear-backend` (`/api/v1/evaluaciones/*` para personal, y
    `/api/v1/portal/hijas/{id}/evaluaciones` para el portal de familias) —
    exactamente el caso que esta misma sección pedía revisar antes de
    asumir que seguía sin backend.

## Decisiones de producto

- **Las tarjetas de Home son accesos directos a sus páginas.** Cuando una
  tarjeta del grid tiene una página real detrás, es clickeable y navega
  ahí (ej. "Cuotas pendientes" → `/portal/pagos`). Si todavía no tiene
  página propia (ej. "Clases por semana"), la tarjeta queda visualmente
  igual pero sin `onClick` ni cursor de puntero — no se simula
  interactividad que no lleva a ningún lado.
- **Eventos se accede desde una tarjeta de Home, no desde el nav inferior.**
  El `BottomNav` tiene 5 slots fijos (Inicio/Pagos/Asistencia/Clases/Evaluaciones)
  y no hay lugar para un sexto ítem "Eventos". La tarjeta "Próx. evento"
  (ancho completo, segunda fila del grid) es la puerta de entrada — desde
  la Fase 17 navega a `/portal/eventos/:id` (antes era informativa nomás).

## Propuesta de schema: módulo de Eventos (para mandar a la compañera)

**Contexto:** el sistema de entradas con mapa de butacas había quedado
pausado (ver más arriba, "Diseño") porque no hay tablas de
asientos/entradas en el modelo que se venía usando. La Fase 17 lo
retomó mockeado completo — antes de tocar el backend real, esto es lo que
hay que validar con la compañera. Nada de esto está implementado en
Postgres todavía, es la propuesta que sale de haber construido el mock.

- **`evento_institucional`** (nueva tabla): `id`, `titulo`, `tipo` (enum:
  `gala` / `otro` / lo que haga falta), `fecha`, `hora`, `lugar`,
  `descripcion`, `fecha_limite_pago` (nullable — `null` = entrada libre,
  sin plazo de pago), **`mapa_asientos`** (JSONB, nullable — `null` =
  evento sin butacas/reserva, como la "Clase abierta a familias" del mock).
  Se propone JSONB para `mapa_asientos` (forma: `{ sectores: [{ nombre,
  filas, columnas, precio }] }`, igual que `eventosDemo` en
  `mock/fixtures.js`) en vez de tablas normalizadas de sectores/asientos,
  porque el mapa es fijo por evento y no se reutiliza entre eventos — no
  parece justificar el modelado relacional todavía. A discutir si en algún
  momento hace falta reportar ocupación agregada por sector con SQL, ahí sí
  convendría normalizar.
- **`cargo` gana dos columnas nuevas y nullable**: **`evento_institucional_id`**
  (FK a `evento_institucional`, nullable) y **`fila`/`columna`** (nullable,
  identifican la butaca reservada). La idea es reusar la misma tabla
  `cargo` que ya existe para cuotas en vez de crear una tabla `entrada`
  aparte — una entrada de evento es, para el sistema de cobros, un cargo
  más (tiene monto, estado, método de pago). **Esto es justo lo que hay
  que validar con la compañera**: si `cargo` ya tiene mucha lógica atada a
  "cuota mensual" que no aplica acá, puede ser mejor una tabla `entrada`
  separada con su propia relación a un `pago` compartido — la decisión de
  cuál conviene depende de cómo esté armado `cargo` en el modelo real, que
  todavía no vimos con este stack.
- **`cargo.estado` suma el valor `'pago_en_revision'`** (nuevo, junto a los
  que ya existen: pendiente/parcial/pagado). Representa "ya se generó el
  pago vía Mercado Pago pero todavía no llegó/se confirmó el webhook" — es
  el estado en el que queda toda entrada apenas se confirma la compra en
  el mock (`confirmarCompra()` en `hooks/useMisEntradas.js` nunca crea una
  entrada directo en `'pagado'`). El botón `[DEV] Simular confirmación de
  secretaría` en `MisEntradas.jsx` (marcado como `// TEMPORAL`, a sacar
  cuando exista el backend) es el stand-in manual de ese webhook.
- **Índice único `(evento_institucional_id, fila, columna)`** sobre
  `cargo` (o sobre `entrada`, si se termina optando por esa tabla aparte)
  — es lo que evita vender la misma butaca dos veces con escrituras
  concurrentes. El mock no lo necesita (todo vive en memoria, un solo
  usuario), pero es no-negociable en el backend real: sin este índice, dos
  personas confirmando la misma butaca casi al mismo tiempo generarían dos
  cargos "válidos" para el mismo asiento.
- **`butacasOcupadasDemo`** (mock) sería, en el modelo real, una consulta
  derivada — `SELECT fila, columna FROM cargo WHERE evento_institucional_id
  = ? AND estado != 'cancelado'` (o el estado que corresponda) — no una
  tabla propia. Se mockeó como diccionario plano porque alcanzaba para
  probar el flujo, no porque se proponga como tabla real.

### Propuesta agregada en la Fase 18: vestuario por evento

Mismo criterio que las butacas — mockeado primero, esto es lo que hay que
validar con la compañera antes de tocar Postgres.

- **`vestuario_evento`** (nueva tabla): `id`, `evento_institucional_id` (FK,
  NOT NULL — a diferencia de butacas, un ítem de vestuario siempre
  pertenece a un evento puntual, no tiene sentido "vestuario sin evento"),
  `nombre`, `descripcion`, `precio`. No lleva `alumno_id` acá — quién debe
  cada ítem se resuelve igual que con butacas, del lado de `cargo` (ver
  abajo), no duplicando el vínculo en esta tabla.
- **`cargo` suma una columna nullable más**: **`vestuario_evento_id`** (FK a
  `vestuario_evento`, nullable) — mismo patrón que
  `evento_institucional_id`/`fila`/`columna` que ya se propuso para
  butacas: un ítem de vestuario pagado es, para el sistema de cobros, un
  cargo más. **Mismo punto a validar con la compañera** que con butacas: si
  conviene reusar `cargo` así de sobrecargado (cuota + entrada + vestuario)
  o separar en tablas propias con un `pago` compartido.
- **No hace falta un índice único acá** (a diferencia de
  `(evento_institucional_id, fila, columna)` en butacas) — un ítem de
  vestuario no es un recurso exclusivo/escaso como una butaca numerada, no
  hay condición de carrera que evitar: dos alumnos pueden comprar la misma
  "Malla Gala Anual" sin conflicto, cada compra es un `cargo` propio.
- `vestuarioPorEventoDemo` (mock, diccionario `eventoId → item[]`) es,
  igual que `butacasOcupadasDemo`, un stand-in de lo que en el modelo real
  sería `SELECT * FROM vestuario_evento WHERE evento_institucional_id = ?`
  — no se propone como tabla real.
- Reutiliza `infoEstadoPago()` (no se creó una función nueva) porque
  los 3 estados posibles son exactamente los mismos que un pago cualquiera
  (`pendiente` / `pago_en_revision` / `pagado`). Se llamaba
  `infoEstadoEntrada()` hasta la Fase 19, con el label de `'pagado'` en
  "Entrada confirmada" — quedaba raro para una malla o unas zapatillas, se
  renombró y generalizó el texto (ver "Estado de avance").

## Estado de avance

- ✅ **Fase 1 — Estructura del portal + Home mockeado** (completada): paleta
  `primary-subtle`, `context/AlumnoActivoContext.jsx`, `mock/fixtures.js`,
  `utils/format.js`, `hooks/useCargos.js` + `hooks/useAsistencias.js`,
  `components/layout/portal/` (`PortalShell`, `PortalHeader`, `BottomNav`),
  `components/ui/RadialProgress.jsx` y `pages/portal/Home.jsx`. Verificado
  con `npm run dev` (ver notas abajo) — Home renderiza sin errores de
  consola dentro de `PortalShell`, y las rutas del sistema de administración
  (`/dashboard`, `/login`) siguen funcionando igual que antes.
- ✅ **Fase 2 — Página de Pagos** (completada): `cargosDemo` extendido con
  casos vencido (`c5`) y parcial (`c6`) para poder ver los cuatro estados de
  badge; `utils/format.js` ahora expone `obtenerBadgeCargo(cargo)` como
  único punto que decide "vencido" (`badgeEstadoCargo` pasó a recibir el
  `estado` en vez del cargo completo — ver nota abajo); `pages/portal/Pagos.jsx`
  con resumen (Pendiente / Al día desde), tarjeta del próximo cargo pendiente
  con botón "Pagar" deshabilitado, e historial con `Badge` de `components/ui/`.
  Ruta `path="pagos"` agregada como hija de `/portal`. Verificado con
  `npm run dev` + Playwright headless: los 6 cargos del mock muestran su
  badge correcto (Pendiente/Pagado×3/Parcial/Vencido), el botón Pagar está
  deshabilitado con tooltip "Integración de pago pendiente", y la navegación
  Home → Pagos → Home por `BottomNav` no rompe nada.
- ✅ **Fase 3 — Pulido de Home** (completada): se sacaron del todo la
  tarjeta "Vestuario" y la sección "Fotos recientes" (ver arriba); grid
  reacomodado a 3 tarjetas (`grid-cols-2`, Cuotas + Horarios en la primera
  fila, Próx. evento con `col-span-2` en la segunda); tarjeta "Cuotas
  pendientes" ahora es clickeable (`useNavigate` → `/portal/pagos`, con
  `hover:shadow-card-md`); Horarios y Próx. evento quedan sin `onClick` a
  propósito. Verificado con Playwright: sin Vestuario/Fotos recientes en el
  DOM, click en Horarios/Próx. evento no navega, click en Cuotas navega a
  Pagos, sin errores de consola.
- ✅ **Fase 4 — Pulido de Pagos** (completada): `cargosDemo` (cargos
  pagados) suma `metodo` y `comprobante`; `utils/format.js` agrega
  `infoMetodoPago(metodo)` y el color de `parcial` en `badgeEstadoCargo` se
  separó del de `pendiente`; `components/portal/ComprobanteModal.jsx`
  (nuevo) sobre el `Modal` de `components/ui/`, con ícono de check verde,
  número de comprobante, alumno, concepto, método (con ícono), fecha, total
  y botón "Compartir" (`navigator.share()` con fallback a
  `navigator.clipboard`); las filas pagadas del historial de
  `pages/portal/Pagos.jsx` abren el modal al tocarlas; la tarjeta de
  "próximo cargo pendiente" se reemplaza por el `EmptyState` de
  `components/ui/` cuando el total pendiente (pendiente + parcial) da $0.
  Verificado con Playwright: los 3 comprobantes muestran los datos
  correctos de cada cargo, el badge de "Parcial" es visualmente distinto de
  "Pendiente"/"Vencido", y se probó vaciando `cargosDemo` de pendientes
  (viendo el `EmptyState`) y revirtiendo el mock después — confirmado con
  `git diff` que quedó igual que antes salvo los campos nuevos del paso 1.
- ✅ **Fase 5 — Página de Asistencia** (completada): `mock/fixtures.js`
  suma `grupoAsistenciaDemo` (`{ nombre, mesLabel }`), `umbralAsistenciaDemo`
  (75, mapea a `configuracion_sistema.umbral_asistencia_alerta` del modelo
  real) y `asistenciasDemo` pasa a tener `diaLabel` en vez de `grupo` por
  fila (un solo grupo por vista, no hace falta repetirlo en cada registro);
  `utils/format.js` suma `evaluarAsistencia(porcentaje, umbral)`;
  `pages/portal/Asistencia.jsx` (nueva) con resumen del mes (fondo verde
  claro), detalle por clase con `Badge` (✓ Presente / Ausente) y footer con
  el umbral + mensaje de `evaluarAsistencia`. La tarjeta de asistencia en
  Home ahora es clickeable (mismo criterio que "Cuotas") y usa
  `grupoAsistenciaDemo` en vez de leer `grupo` de la primera asistencia
  (ese campo ya no existe en el mock). Ruta `path="asistencia"` agregada;
  `BottomNav` ya apuntaba ahí, no hizo falta tocarlo. Verificado con
  Playwright: el % coincide entre Home (83%) y Asistencia (83%, mismo hook
  y mismo cálculo), Home → Asistencia navega bien, y se probó subiendo
  `umbralAsistenciaDemo` a 90 (por encima del 83% del mock) para ver el
  mensaje "por debajo de ese mínimo" — revertido después, confirmado con
  `git diff`.
- ✅ **Fase 6 — Pulido de Asistencia: color por umbral + selector de mes**
  (completada): `asistenciasDemo` ahora cubre Septiembre (por encima del
  umbral) y Agosto (por debajo, para probar el caso ámbar); se sacó
  `diaLabel` (era temporal, anotado como tal en la Fase 5) — el día de
  clase se calcula de verdad con `formatDiaClase(fecha)`, que además
  corrigió un error que tenía el mock viejo (`diaLabel: 'Miércoles 03/09'`
  para el 2026-09-03, que en realidad es jueves). `grupoAsistenciaDemo`
  también pierde `mesLabel` (quedó solo `{ nombre }`) — con pestañas de mes
  reales, un mes fijo en el subtítulo del header quedaba desactualizado en
  cuanto se cambiaba de pestaña. `utils/format.js` suma
  `agruparAsistenciasPorMes()`, `formatMesLabel()` (portada del duplicado
  que ya existía sin exportar en `Pagos.jsx` — `Pagos.jsx` ahora usa la
  versión compartida) y `evaluarAsistencia()` gana un campo `classes`
  (verde/ámbar según `alCorriente`). `pages/portal/Asistencia.jsx` suma
  pestañas de mes (más antiguo a más reciente, mes más reciente
  seleccionado por defecto) y todo el bloque de resumen + footer + el
  número grande reacciona al mismo criterio de color. Home también pasa a
  mostrar el mes más reciente (antes promediaba todas las asistencias del
  mock, que ahora abarcan dos meses) y le pasa `umbral={umbralAsistenciaDemo}`
  explícito a `RadialProgress` en vez de confiar en su default interno, para
  que Home y Asistencia no puedan desincronizarse aunque cambie el umbral.
  `RadialProgress.jsx` no necesitó cambios de código — ya recibía `umbral`
  como prop con default 75 desde la Fase 1, exactamente como pedía esta
  fase. Verificado con Playwright: Septiembre se ve verde (83%, por encima
  del 75%), Agosto se ve ámbar (40%, por debajo), mismo criterio de color
  en ambos sin tocar nada a mano; Home sigue mostrando 83% (coincide con la
  pestaña de Septiembre); Pagos se probó de nuevo tras el cambio de
  `formatPeriodo`→`formatMesLabel` y sigue sin errores.
- 💡 **Decisiones pendientes:** justificar inasistencias
  (`asistencia.justificada` / `asistencia.motivo`, campo nuevo) — a
  proponerle a la compañera, no se construye todavía.
- ✅ **Fase 7 — Clases (ex "Grupos") + inscripción a clases nuevas**
  (completada): `pages/portal/Clases.jsx` (nueva, no un renombre — ver nota
  abajo) con dos secciones, "Mis clases" (click abre
  `components/portal/ClaseDetalleModal.jsx`, nuevo, sobre el `Modal` de
  `components/ui/`) y "Clases disponibles" (cada una con `estadoCupo()` y
  botón según su estado: "Inscribirme" / "Anotarme en lista de espera" /
  estado ya solicitado, sin volver a permitir solicitar). `hooks/useClases.js`
  (nuevo) sigue el patrón de los demás hooks y suma
  `solicitarInscripcion(claseId, tipo)`, que por ahora solo actualiza estado
  local. Los toasts van con `useToast()` de `context/ToastContext.jsx` (de
  mi compañera, reusado tal cual). Ruta `path="clases"` en vez de
  `path="grupos"`; `BottomNav` actualizado (label "Grupos"→"Clases", mismo
  ícono `Users`). Verificado con Playwright: las 3 clases del mock muestran
  los 3 casos de `estadoCupo()` (normal, cupo lleno, últimos lugares —
  ajuste de mock, ver nota abajo), "Inscribirme" en Jazz dispara el toast y
  cambia su tarjeta a "Pendiente de confirmación", "Anotarme en lista de
  espera" en Danza Contemporánea hace lo mismo con "En lista de espera" y
  reactiva la opacidad de la tarjeta (ya no está "deshabilitada", tiene un
  estado real), sin errores de consola.
- ✅ **Fase 8 — Evaluaciones (ex "Notas")** (completada): mismo caso que
  Clases — no había nada que renombrar, `pages/portal/Notas.jsx` nunca
  existió (ver nota abajo). `evaluacionesDemo` en `mock/fixtures.js` (2
  exámenes de Profesorado, "Danza Clásica"); `utils/format.js` suma
  `promedioNotas`, `promedioExamen`, `promedioGeneral`; `hooks/useEvaluaciones.js`
  (nuevo, mismo patrón que los demás — no estaba en los pasos numerados de
  esta tarea pero se agregó para seguir la regla ya documentada de "un hook
  por recurso, ninguna página importa el mock directo"). `pages/portal/Evaluaciones.jsx`
  filtra siempre por `esProfesorado === true` (aunque hoy el mock no tenga
  ningún examen recreativo), agrupa por `grupoNombre` sin asumir uno solo
  (una "sección" completa por grupo: subtítulo + tarjeta de promedio general
  + lista de exámenes), cada examen con su promedio y chips de criterio+nota
  vía `Badge`, mostrando `observaciones` solo donde el mock las tiene
  cargadas. `BottomNav`: label "Notas"→"Evaluaciones" (la ruta
  `/portal/evaluaciones` ya apuntaba bien, no era un placeholder). Se
  revisó si "Evaluaciones" entraba en el ancho del tab a `text-[11px]`
  (mismo tamaño que los demás) — entra perfecto en una línea, no hizo falta
  achicarla a `text-[10px]` como sugería el enunciado. Verificado con
  Playwright: promedio de "Examen Final 2026" = 8.7 (9+8+9)/3, "Examen
  Parcial 2026" = 8 (8+8+8)/3, promedio general del grupo = 8.3
  ((9+8+9+8+8+8)/6) — los tres coinciden con el cálculo manual; la
  observación "Mejoró mucho el timing" aparece solo bajo el chip de
  "Ritmo" del Examen Final, en ningún otro chip; sin errores de consola.
- ✅ **Fase 9 — Header consolidado (avatar → Perfil) + página de Perfil**
  (completada): `familiaDemo` suma `dni`; `alumnoActivoDemo` se elimina —
  `AlumnoActivoContext` ahora inicializa `alumnosVinculados` desde
  `alumnosVinculadosDemo` (nuevo, con `grupoPrincipal`/`activo` por alumno)
  y `alumnoActivo` toma el que tenga `activo: true` (fallback al primero).
  `utils/format.js` suma `iniciales()`. `components/ui/Avatar.jsx` (nuevo,
  compartido — ver nota abajo). `PortalHeader.jsx` pierde el círculo "C",
  el ícono de perfil y el botón "Salir" — queda `<Avatar>` (click → `/portal/perfil`)
  a la izquierda y la campanita sola a la derecha. `pages/portal/Perfil.jsx`
  (nueva): avatar grande + nombre + DNI, sección "Mis alumnas" (fila
  clickeable que llama `setAlumnoActivo`, con check en la activa — la
  estructura soporta N alumnos aunque el mock tenga 1 solo), lista de
  accesos sin destino real (placeholders a propósito, ver nota abajo) y
  botón "Cerrar sesión" que redirige a `/login` sin lógica de sesión real
  todavía. Ruta `path="perfil"` agregada. Verificado con Playwright: el
  header de las 6 páginas del portal (Home, Pagos, Asistencia, Clases,
  Evaluaciones, Perfil) muestra solo avatar + campanita, en ningún lado
  aparece ya "Salir" salvo dentro de Perfil; tocar el avatar desde
  cualquier página navega a `/portal/perfil`; tocar la fila de Sofía y
  después "Cerrar sesión" no rompe nada y termina en `/login`; sin errores
  de consola.
- ✅ **Fase 10 — Pulido de Perfil** (completada): `alumnosVinculadosDemo`
  suma `telefono`/`email`/`domicilio`/`aptoFisicoPresentado`/`aptoFisicoFecha`;
  nuevo `configInstitucionalDemo.plazoDiasAptoFisico`. `utils/format.js`
  suma `estadoAptoFisico()` (con el mismo cuidado de fecha local que
  `esCargoVencido` — ver nota abajo). `AlumnoActivoContext` gana
  `actualizarAlumnoActivo(cambios)`, que actualiza tanto `alumnoActivo`
  como su entrada en `alumnosVinculados` (en memoria, sin backend). Fila
  "Mis alumnas" ahora muestra el estado del apto físico en verde/ámbar
  bajo el grupo principal. Nueva fila "Editar datos de contacto" (no
  existía ninguna fila de contacto antes — se agregó, no se modificó una
  existente) que abre `components/portal/EditarContactoModal.jsx` (nuevo,
  con `Input` de `components/ui/`) precargado con los datos del alumno
  activo; "Guardar" llama `actualizarAlumnoActivo` y dispara un toast.
  "Métodos de pago guardados" y "Ayuda y soporte" pasan a mostrar un
  `Badge` "Próximamente" en vez de la flecha, sin cursor de puntero.
  "Cambiar clave de acceso" y "Notificaciones" quedan como estaban — no
  entraban en el alcance de esta fase (ver nota abajo). "Cerrar sesión"
  ahora abre un `ConfirmModal` de `components/ui/` antes de redirigir.
  Verificado con Playwright: modal de contacto precargado con los valores
  del mock, "Guardar" actualiza el estado (confirmado reabriendo el modal
  y viendo el valor nuevo) y dispara el toast; 2 badges "Próximamente"
  presentes, `cursor: auto` en esas filas vs. `cursor: pointer` en
  "Editar datos de contacto"; "Cerrar sesión" abre el modal de
  confirmación, "Cancelar" no navega, "Confirmar" sí lleva a `/login`; se
  probó cambiando `aptoFisicoFecha` a `2024-01-01` para ver el caso
  "vencido" (ámbar, "vencido desde el 31 de dic de 2024 — hay que
  renovarlo") y se revirtió después — confirmado con `git diff`; sin
  errores de consola.
- ✅ **Fase 11 — Página de Notificaciones + badge en la campanita**
  (completada): `notificacionesDemo` (5 notificaciones, incluye el tipo
  nuevo `'horario'` — ver nota abajo); `utils/format.js` suma
  `infoTipoNotificacion()` (íconos SVG en vez de emoji, mismo criterio que
  `infoMetodoPago` — ver nota abajo) y `formatFechaRelativa()`;
  `hooks/useNotificaciones.js` (nuevo) con `marcarLeida(id)` y
  `marcarTodasLeidas()`. **Cambio de arquitectura no pedido explícitamente
  pero necesario:** `PortalShell.jsx` ahora llama `useNotificaciones()` una
  sola vez y comparte ese estado con `PortalHeader` (prop `noLeidas`) y con
  la página de Notificaciones vía `<Outlet context={...}>` /
  `useOutletContext()` de React Router — ver nota abajo, el enunciado decía
  "mismo patrón que los demás" (hook con estado local propio), pero dos
  instancias independientes del hook nunca se hubieran sincronizado entre
  el header y la página. `pages/portal/Notificaciones.jsx` (nueva): no
  leídas primero (ordenadas, no solo destacadas) con fondo `primary-light`
  + punto; tocar una la marca leída y abre el `Modal` de `components/ui/`
  con el detalle + CTA según `infoTipoNotificacion`/`CTA_POR_TIPO` (este
  último definido en la página, no en `format.js` — es ruteo, no
  formato); "evento" sin CTA a propósito (Eventos sigue pausado). Ruta
  `path="notificaciones"` agregada; el bell ahora navega ahí (no estaba
  pedido explícitamente, pero sin eso la página quedaba inalcanzable, ya
  que no tiene slot en `BottomNav`). Verificado con Playwright, navegando
  siempre dentro de la SPA (nunca con recarga completa, que resetea el
  estado en memoria — ver nota abajo): las 5 notificaciones muestran su
  tipo/color/ícono correcto; badge inicial en "2"; tocar "Tu cuota vence en
  3 días" abre el modal con CTA "Ver mis pagos" y navega a `/portal/pagos`;
  volviendo a Home vía `BottomNav`, el badge baja a "1"; tocar "Cambio de
  horario" y su CTA "Ver mis clases" navega a `/portal/clases` y el badge
  desaparece del todo; "Recordatorio" (evento) no tiene botón de acción en
  el modal; "Marcar todas" desaparece cuando no queda nada sin leer; sin
  errores de consola.
- ✅ **Fase 12 — Calendario dentro de Clases** (completada):
  `misClasesDemo` suma `horarios` (array estructurado por `diaSemana`,
  sin acentos) sin sacar el campo `horario` de texto libre (lo sigue
  usando "Mis clases"); nuevo `eventosCalendarioDemo`. `utils/format.js`
  suma `ocurrenciasDeClaseEnMes()` y `proximosItems()` (con el mismo fix
  de fecha local que ya se aplicó varias veces — ver nota abajo);
  `hoyLocalISO()` pasa a exportarse para reusarla ahí en vez de duplicar
  la lógica. `components/portal/CalendarioMensual.jsx` (nuevo, no va a
  `components/ui/` compartido a propósito — ver nota abajo): grilla
  L-D, punto violeta (clase) / rosa (evento) por día, hoy resaltado con
  anillo, ‹ › para cambiar de mes. `pages/portal/Clases.jsx` suma el
  calendario y "Próximos" arriba de "Mis clases"; la tarjeta "Horarios" de
  Home ahora navega a `/portal/clases` (mismo criterio que Cuotas y
  Asistencia). Verificado con Playwright: Septiembre 2026 muestra puntos
  violeta en los 9 lunes/miércoles de Danza Clásica y el 30/09 muestra
  ambos puntos superpuestos (coincide con la Gala); "Próximos" lista 5
  ítems en orden cronológico (14, 16, 21, 23, 28/09, todos "Danza
  Clásica" — ver nota abajo sobre por qué la Gala no entra en el top 5
  hoy); cambiar a Octubre recalcula los puntos correctamente (mismos
  días de semana, sin punto rosa) y volver a Septiembre los recupera
  intactos; "Próximos" no cambia al mover el calendario (es independiente,
  ver nota abajo); el modal de detalle de "Mis clases" sigue funcionando
  igual después del cambio de forma del mock; sin errores de consola.
- ✅ **Fase 13 — Horarios como página propia + 2 arreglos** (completada):
  `proximosItems()` sube su corte default de 5 a 8. `pages/portal/Horarios.jsx`
  (nueva) — todo lo que la Fase 12 había puesto arriba de "Mis clases" en
  `Clases.jsx` (el `<CalendarioMensual/>`, "Próximos" y el `useState` del
  mes que los controla) se trasladó tal cual a este archivo nuevo.
  `Clases.jsx` queda solo con "Mis clases"/"Clases disponibles" más una
  tarjeta "Ver calendario de horarios →" arriba de todo que navega a
  `/portal/horarios`. La tarjeta "Horarios" de Home apunta directo ahí en
  vez de a `/portal/clases`. Ruta `path="horarios"` agregada. Se sumó
  además la sección "Convenciones de código" a este documento con la regla
  de `hoyLocalISO()` (ya había aparecido 3 veces sin ella). Verificado con
  Playwright: `/portal/horarios` muestra el calendario funcionando igual
  que en la Fase 12; con el corte en 8, la Gala Anual CREAR (30/09) ahora
  sí aparece en "Próximos" (séptimo ítem, después de las 6 ocurrencias de
  Danza Clásica hasta esa fecha — el 30/09 es miércoles, así que ese día
  cuenta doble: clase y evento); `Clases.jsx` quedó liviana, sin rastro del
  calendario, con la tarjeta de acceso funcionando en los dos sentidos
  (Clases → Horarios y Home → Horarios); sin errores de consola.
- ✅ **Fase 14 — Calendario interactivo por día** (completada):
  `utils/format.js` suma `itemsDelDia(clases, eventos, anio, mes, fechaISO)`.
  `components/portal/CalendarioMensual.jsx` sigue controlado (mismo
  criterio que el mes): recibe `diaSeleccionado`/`onSeleccionarDia` nuevos,
  cada celda de día es ahora un `<button>` que llama `onSeleccionarDia`; el
  padre decide deseleccionar (el componente nunca decide por su cuenta) —
  el anillo de "hoy" y el fondo sólido de "seleccionado" son clases
  independientes entre sí, así que un día que es hoy Y está seleccionado
  muestra los dos a la vez (relleno + anillo), no uno tapando al otro.
  `pages/portal/Horarios.jsx` suma `diaSeleccionado` (`useState`, resetea a
  `null` en `cambiarMes`) y el toggle en `seleccionarDia`; debajo del
  calendario, "Próximos" y "Clases del {día}" son mutuamente excluyentes
  según haya o no día seleccionado. Se extrajo `FilaItem` (componente local
  a esta página) porque las dos listas comparten la misma fila
  ícono+título+subtítulo — la única diferencia es qué texto va de
  subtítulo (fecha+hora en "Próximos", solo hora en el detalle del día,
  porque el título de la sección ya dice qué día es). Verificado con
  Playwright: tocar el lunes 14/09 (con clase) muestra "Danza Clásica ·
  18:00"; tocar el martes 15/09 (sin clase) muestra "No tenés clases este
  día."; tocar el mismo día de nuevo vuelve a "Próximos"; seleccionar un
  día y cambiar de mes limpia la selección (vuelve a "Próximos" en el mes
  nuevo); seleccionar el día de hoy muestra el relleno violeta y el anillo
  a la vez, visualmente distinguible tanto de "hoy sin seleccionar" (solo
  anillo) como de "otro día seleccionado" (solo relleno); sin errores de
  consola.
- ✅ **Fase 15 — Flecha de volver en páginas fuera del nav inferior**
  (completada): `PortalHeader.jsx` suma `mostrarVolver` — si es `true`
  renderiza una flecha (`ArrowLeft`, `navigate(-1)`) en el lugar del
  avatar; la campanita no se toca. **Encontré el caso que el spec pedía
  avisar antes de resolver:** `PortalHeader` se renderiza una sola vez en
  `PortalShell.jsx` (layout compartido con `<Outlet/>`), no en cada
  página — así que `Perfil.jsx`/`Notificaciones.jsx`/`Horarios.jsx` nunca
  llaman a `<PortalHeader>` y no hay forma de pasarle la prop desde ahí.
  Pregunté antes de elegir cómo resolverlo (había más de una forma
  válida); se optó por la más simple: `PortalShell.jsx` usa
  `useLocation()` y compara el pathname contra un array constante
  (`RUTAS_CON_VOLVER`), sin cambiar el mecanismo de ruteo actual (se
  descartó migrar a `createBrowserRouter` + `route.handle` por invasivo
  para lo que hacía falta acá). Ninguna página individual necesitó
  tocarse — ni las que quedan con avatar (Home/Pagos/Asistencia/Clases/
  Evaluaciones, ya estaban bien) ni las tres que pasan a mostrar la
  flecha (no la controlan, la decide el shell). Verificado con Playwright:
  las 5 páginas del nav inferior siguen con avatar; Perfil, Notificaciones
  y Horarios muestran la flecha; llegando a Horarios desde Home la flecha
  vuelve a Home, llegando desde Clases vuelve a Clases (`navigate(-1)`
  real, no un destino fijo); sin errores de consola.
- ✅ **Fase 16 — Alertas de Home + fallback de compartir + skeletons**
  (completada):
  - **Alertas**: `utils/format.js` suma `calcularAlertas({cargos,
    asistenciasDelMes, umbral})` (cuota vencida = alta, asistencia baja o
    cuota a vencer en ≤3 días = media, máximo 2, altas primero). Se
    corrigió un cuarto caso del bug de UTC-vs-local dentro de la misma
    función — ver nota abajo. `components/portal/AlertaHome.jsx` (nuevo):
    franja roja/ámbar según urgencia con `<Link>` de React Router (no
    `<a>`, para no recargar la página). `Home.jsx` renderiza
    `#alertas-home` arriba del saludo con el resultado de `calcularAlertas`.
  - **Compartir**: `ComprobanteModal.jsx` ya tenía el fallback a
    `navigator.clipboard`, pero sin toast de confirmación ni el último
    escalón (ningún método disponible). Se completó la cadena de 3
    pasos (`share` → `clipboard` + toast → toast de "no se pudo"),
    usando `useToast()` de `context/ToastContext`.
  - **Skeletons**: `components/ui/Skeleton.jsx` (nuevo, compartido — ver
    nota abajo). Reemplaza el `Spinner` centrado en Home, Pagos,
    Asistencia y Evaluaciones por bloques con la forma real de cada
    pantalla (Clases y Horarios quedan con `Spinner`, no estaban en el
    alcance de esta fase). `Home.jsx` no tenía ningún chequeo de
    `cargando` antes de esta fase — se agregó (`cargandoAsistencias ||
    cargandoCargos`) porque hacía falta para poder mostrar el skeleton.
  - Verificado con Playwright, con un delay artificial de 700ms agregado
    temporalmente en `useCargos`/`useAsistencias`/`useEvaluaciones` (sacado
    después, confirmado con `git diff` vacío): las 4 skeletons se ven con
    la forma pedida antes de que cargue el contenido real; con el mock tal
    cual queda hoy, `calcularAlertas` ya muestra 2 alertas "alta" solas
    (las cuotas de Septiembre y Junio-demo ya están vencidas para la fecha
    actual del entorno) — **para ver la alerta media hubo que además
    neutralizar esos 2 vencimientos temporalmente** (cambiarles la fecha a
    futuro), porque "alta" siempre gana los 2 lugares del `slice(0, 2)`;
    con eso hecho y la asistencia de septiembre bajada a 3/6, apareció
    "Tu asistencia este mes está en 50%..." en ámbar con link a
    Asistencia, navegando sin recargar (confirmado con `reloadCount: 0`);
    todo revertido después, confirmado con `git diff` vacío. El fallback
    de compartir se probó en Chromium desktop (`navigator.share` es
    `undefined` ahí, como es de esperar): cae a `clipboard.writeText`,
    dispara el toast, y el texto copiado es el correcto — el share nativo
    en un celular real queda sin probar (ver Decisiones pendientes).
- 💡 **Decisión pendiente:** confirmar `navigator.share()` en un
  dispositivo móvil real — no se puede validar desde este entorno de
  desarrollo/testing de escritorio.
- ✅ **Fase 17 — Módulo de Eventos (mock completo)** (completada). **Nota
  importante: esta fase reabre una pausa explícita** — el sistema de
  entradas con mapa de butacas y QR venía marcado como pausado desde la
  Fase 1 ("no hay tablas de asientos/entradas en el modelo... pausadas
  hasta coordinar con la otra parte del equipo", ver "Diseño" arriba). Se
  construyó igual, mockeado completo, porque la tarea lo pedía
  explícitamente y porque documentar el schema propuesto para mandárselo a
  la compañera (ver sección arriba) es en sí mismo el paso de
  coordinación — no una continuación silenciosa de algo que se había
  decidido no tocar.
  - `mock/fixtures.js`: `eventosDemo` (2 eventos — uno con mapa de
    butacas, uno de entrada libre sin mapa), `butacasOcupadasDemo`,
    `misEntradasDemo`; `proximoEventoDemo` suma `id` para poder navegar
    desde Home sin hardcodear el string en la página.
  - `utils/format.js`: `generarAsientos(sector)`, `infoEstadoEntrada(estado)`.
  - `hooks/useEventos.js` (lista), `hooks/useEvento.js` (uno + sus butacas
    ocupadas), `hooks/useMisEntradas.js` (lista + `confirmarCompra` +
    `marcarComoPagada`, esta última `// TEMPORAL`).
  - **Mismo problema de estado compartido que ya apareció con
    notificaciones (Fase 11), pero esta vez entre páginas que ni siquiera
    están montadas al mismo tiempo:** `ResumenCompra.jsx` llama
    `confirmarCompra` y navega a `MisEntradas.jsx` — si cada una tuviera su
    propio `useMisEntradas()`, la entrada nueva viviría en el estado de un
    componente que se desmonta al navegar, y `MisEntradas` arrancaría de
    cero sin ella. Se resolvió con el mismo mecanismo que notificaciones:
    `PortalShell.jsx` llama `useMisEntradas()` una sola vez y lo reparte
    por `Outlet context`. Como ya había un valor ahí
    (`notificacionesApi`), el context pasó de ser ese objeto plano a
    `{ notificacionesApi, misEntradasApi }` — `Notificaciones.jsx` se
    actualizó para desestructurar un nivel más.
  - Rutas nuevas, todas hijas de `/portal`: `eventos` (cartelera),
    `eventos/:id` (detalle), `eventos/:id/butacas` (mapa interactivo, solo
    si `mapaAsientos` existe — si no, redirige de vuelta al detalle),
    `eventos/:id/resumen` (recibe la selección de butacas por
    `location.state`, no por prop ni contexto persistente — si se navega
    ahí directo sin haber pasado por el mapa, muestra un `EmptyState` con
    link para volver a elegir), `mis-entradas`. Las 3 rutas de `eventos/*`
    y `mis-entradas` entraron a `RUTAS_CON_VOLVER`/`tieneVolver()` en
    `PortalShell.jsx` — muestran flecha de volver, no el avatar.
  - `components/portal/MapaButacas.jsx` (nuevo, específico del portal —
    mismo criterio que `CalendarioMensual`): grilla por sector con
    `generarAsientos()`, selección múltiple en estado local, footer
    `sticky bottom-0` con cantidad + total. `pages/portal/EventoButacas.jsx`
    es la página delgada que lo envuelve (busca el evento por `:id`, hace
    de guard si no hay `mapaAsientos`) — el spec solo pedía el componente,
    esta página no estaba nombrada explícitamente pero hacía falta para
    que la ruta tuviera algo que renderizar.
  - Conectado: tarjeta "Próx. evento" de Home → `/portal/eventos/:id`
    (cambiado en la Fase 21 a `/portal/eventos`, la cartelera general —
    ver "Estado de avance"); fila nueva "Mis entradas" en Perfil →
    `/portal/mis-entradas` (no existía ninguna fila de entradas antes, se
    agregó).
  - Verificado con Playwright, flujo completo end-to-end: Home → Gala →
    "Elegir mis butacas" → seleccionar Platea D-6 y E-1 (libres) → footer
    muestra "2 butacas / $10.000" → butaca ocupada (A-3) confirmada como
    `disabled` → Continuar → Resumen muestra las 2 butacas y el total
    correcto → Confirmar y pagar → aparece en Mis Entradas como "Pago en
    proceso" (junto a la entrada `ent1` del mock, preexistente) → botón
    `[DEV]` sobre `ent1` la pasa a "Entrada confirmada" con código
    `ENT1` monoespaciado, sin afectar la otra entrada (todavía en
    revisión); la Clase Abierta (`ev2`, sin `mapaAsientos`) no muestra
    botón de compra, y navegar directo a `/portal/eventos/ev2/butacas`
    redirige de vuelta al detalle; sin errores de consola.
- ✅ **Fase 18 — Módulo Vestuario + acceso a Mis Entradas desde Eventos**
  (completada). `vestuarioPorEventoDemo` (mock, diccionario `eventoId →
  item[]`) solo tiene ítems cargados para `ev1` (la Gala) — `ev2` (entrada
  libre) no tiene vestuario, mismo criterio que "sin `mapaAsientos` no se
  muestra el botón de butacas". `hooks/useVestuarioEvento.js` (nuevo,
  mismo patrón que `useMisEntradas`, pero sin necesidad de vivir en
  `PortalShell` — a diferencia de entradas/notificaciones, nada más lee
  este estado en simultáneo, así que se llama directo en
  `VestuarioEvento.jsx`) expone `items` + `pagarVestuario(itemId)` (pasa a
  `'pago_en_revision'`, simula la pasarela) + `marcarComoPagado(itemId)`
  (`// TEMPORAL`, mismo stand-in manual del webhook que ya existía en
  `useMisEntradas`). `pages/portal/VestuarioEvento.jsx` (nueva, ruta
  `eventos/:id/vestuario`) reusa `infoEstadoEntrada()` tal cual pedía el
  spec — ver nota abajo sobre el único costo de esa reutilización.
  `EventoDetalle.jsx` suma el botón "Vestuario" (secundario, debajo de
  "Elegir mis butacas"/el texto de entrada libre), condicionado a que
  `vestuarioPorEventoDemo[evento.id]` tenga al menos un ítem.
  `pages/portal/Eventos.jsx` suma un link "Mis entradas" (píldora con
  ícono `Ticket`) arriba de la lista de eventos, para llegar a
  `/portal/mis-entradas` sin pasar por Perfil. No hizo falta tocar
  `PortalShell.jsx`: `tieneVolver()` ya cubre `eventos/:id/vestuario` con
  el `pathname.startsWith('/portal/eventos')` que se agregó en la Fase 17.
  Verificado con Playwright en esta máquina Windows (primera vez con
  Playwright/Chromium instalados acá — ver nota abajo): desde la cartelera
  de Eventos, "Mis entradas" navega directo a `/portal/mis-entradas`;
  desde la Gala, "Vestuario" muestra los 2 ítems del mock; pagar la Malla
  la deja en "Pago en proceso" con el botón `[DEV]` visible al lado;
  tocar `[DEV]` la confirma sin afectar las Zapatillas (siguen
  "Pendiente de pago"); la Clase Abierta a Familias (`ev2`) no muestra el
  botón "Vestuario" (no tiene ítems cargados); sin errores de consola.
- ✅ **Fase 19 — Corregir label genérico + confirmar doble acceso a Mis
  Entradas** (completada). `infoEstadoEntrada()` → `infoEstadoPago()` en
  `utils/format.js`, mismo mapa de 3 estados pero con el label de
  `'pagado'` generalizado a "Pago confirmado" (antes "Entrada confirmada",
  que sonaba a ticket y quedaba raro para vestuario — ver Fase 18).
  Actualizados los dos consumidores (`MisEntradas.jsx`,
  `VestuarioEvento.jsx`) y el comentario que la mencionaba en
  `fixtures.js`; se buscó en todo el proyecto y no quedó ninguna
  referencia al nombre viejo fuera de este documento (donde se dejan como
  registro histórico de fases previas). El acceso doble a "Mis Entradas"
  ya existía de la Fase 18 (`Eventos.jsx` y `Perfil.jsx` en paralelo, no
  uno reemplazando al otro) — se confirmó que sigue así, sin tocar
  `Perfil.jsx`. Verificado con Playwright: pagar la Malla en Vestuario y
  confirmarla con `[DEV]` ahora muestra "Pago confirmado"; navegar a Mis
  Entradas funciona igual desde la cartelera de Eventos y desde Perfil
  (mismo destino, `/portal/mis-entradas`, sin errores de consola en
  ninguno de los dos caminos).
- ✅ **Fase 20 — Re-confirmar el acceso a Mis Entradas desde Eventos**
  (completada, sin cambios de código). La tarea llegó especificada como si
  el link todavía no existiera ("por el resumen anterior, no está") — al
  abrir `Eventos.jsx` el botón "Mis entradas" ya estaba ahí, igual que
  quedó en la Fase 18 y se reconfirmó en la Fase 19. **Causa real de la
  confusión, no un bug:** las Fases 18 y 19 se hicieron y verificaron en
  el árbol de trabajo, pero **nunca se commitearon** — el último commit
  del repo sigue siendo `40da014 arreglo mapa butacas`, que es el cierre
  de la Fase 17. La conversación de planificación en claude.ai no tiene
  forma de ver cambios sin commitear en esta máquina, así que desde su
  punto de vista el link legítimamente "no estaba". Esta fase no tocó
  código — solo re-verificó ambos accesos (`Eventos.jsx` → link con ícono
  `Ticket`; `Perfil.jsx` → fila sin modificar) con Playwright: los dos
  navegan a `/portal/mis-entradas`, mismo título de página, sin errores de
  consola. **Pendiente real: commitear el trabajo de las Fases 17 a 20**
  (vestuario, rename de `infoEstadoPago`, este mismo re-chequeo) para que
  deje de repetirse esta discrepancia — queda a criterio de la próxima
  conversación de planificación, no se commiteó acá sin que se pida
  explícitamente. **Resuelto poco después:** se pidió explícitamente
  commitear, separado en 3 commits en vez de uno solo mezclando fases
  (`feat(vestuario)`, `fix(eventos)` con el rename, `docs`) — cada uno
  buildable de forma aislada (el commit de vestuario usa todavía
  `infoEstadoEntrada`, que en ese punto de la historia es lo que existe en
  `format.js`; el rename es el commit siguiente). Ya están pusheados a
  `origin/main`.
- ✅ **Fase 21 — Tarjeta "Próx. evento" de Home → cartelera general**
  (completada). `Home.jsx`: el `onClick` de la tarjeta pasa de
  `navigate(`/portal/eventos/${proximoEventoDemo.id}`)` (ir directo a la
  Gala) a `navigate('/portal/eventos')` (la cartelera completa, que ya
  lista todos los eventos incluida la Gala). Sin cambios en
  `fixtures.js` ni en ningún otro archivo — `proximoEventoDemo.id` queda
  sin uso en el código (se agregó en la Fase 17 específicamente para esta
  navegación directa que ahora se saca), pero no se tocó el mock porque no
  estaba pedido y no rompe nada dejarlo. Verificado con Playwright: tocar
  la tarjeta desde Home navega a `/portal/eventos` (título "Eventos", la
  cartelera), no a `/portal/eventos/ev1`; sin errores de consola.
- ✅ **Fase B1 — Esqueleto del backend + Docker + Postgres** (completada).
  Numeración `B` aparte de las fases del portal (1-21 arriba): es un
  proyecto Python separado en `backend/`, no continúa esa secuencia.
  Estructura completa según "Backend (FastAPI + Postgres + Docker)" más
  arriba. `docker-compose.yml` con `db` (Postgres 16, volumen persistente,
  healthcheck con `pg_isready`) y `api` (build del Dockerfile, espera a
  que `db` esté healthy antes de arrancar). Verificado con
  `docker compose up --build`: ambos contenedores levantan sin error,
  `curl localhost:8000/health` devuelve `{"status": "ok"}`. `.env` (no
  `.env.example`) confirmado en el `.gitignore` de la raíz — el patrón sin
  `/` inicial ya cubría `backend/.env` sin tocar nada (confirmado con
  `git check-ignore -v backend/.env`). Se sumaron además `__pycache__`,
  `*.pyc`, `.venv`, `venv` al `.gitignore` raíz (no estaba pedido
  explícitamente, pero hacían falta apenas se corre Python localmente).
- ✅ **Fase B2 — Modelos SQLAlchemy + Alembic (schema completo)**
  (completada). 27 tablas, un archivo por tabla en `app/models/` (ver
  `backend/SCHEMA.md` para el detalle columna por columna y qué está
  confirmado vs. propuesto). `alembic init`, `env.py` configurado para
  tomar `DATABASE_URL` de `app.core.config` (no del `alembic.ini`, para no
  mantener la cadena de conexión en dos lugares) y para ver
  `Base.metadata` completo (`app/models/__init__.py` importa las 27
  clases). Migración autogenerada (`alembic revision --autogenerate`),
  revisada a mano — autogenerate no agrega la extensión `pgcrypto` sola,
  se sumó `CREATE EXTENSION IF NOT EXISTS pgcrypto` al principio de
  `upgrade()` a mano, antes de la primera tabla. Aplicada con
  `alembic upgrade head` contra el Postgres del `docker-compose`.
  Verificado con `\dt` dentro del contenedor de `db`: 28 filas (27 tablas
  + `alembic_version`). Se probó además, a mano: `gen_random_uuid()`
  funciona, el índice parcial `cargo_butaca_activa_unica` quedó creado
  con el `WHERE` correcto, y un insert de prueba vía `SessionLocal` de
  SQLAlchemy confirmó que el default de un campo `Enum` (`usuario.estado`)
  se aplica bien por el ORM (un insert equivalente por `psql` crudo, sin
  pasar por el ORM, falla por `NOT NULL` — ver la nota de auth más arriba,
  es el comportamiento esperado dado cómo está definido el default, no un
  bug). Filas de prueba borradas después de verificar. Cada tabla/columna
  `NUEVO`/`PROPUESTO` quedó con un comentario claro en el modelo de Python
  correspondiente (no solo en `SCHEMA.md`) — ver por ejemplo
  `app/models/cargo.py` o `app/models/vestuario_evento.py`.
- ✅ **Fase B3 — Corregir los defaults de enum a nivel de base de datos**
  (completada). Cierra el hallazgo de la Fase B2 (ver "Decisión de auth"
  más arriba). Las 8 columnas con default real en el schema original
  (`usuario.estado`, `alumno.estado`, `grupo_clase.estado`,
  `inscripcion.estado`, `lista_espera.estado`, `cargo.estado`,
  `liquidacion.estado`, `evento_institucional.tipo`) pasaron de
  `default=EstadoX.valor` (Python) a `server_default=text("'valor'")`
  (Postgres). Confirmadas contra `SCHEMA.md` las otras 4 columnas `Enum`
  del schema (`padre_tutor.parentesco`, `usuario.rol`,
  `grupo_clase_horario.dia_semana`, `pago.metodo`) — ninguna tenía default
  en el original, quedaron sin tocar. Migración nueva
  (`alembic revision --autogenerate -m "server_default en columnas de estado"`)
  — **primer intento salió vacía** (`upgrade()`/`downgrade()` con solo
  `pass`): Alembic no compara `server_default` a menos que se le pida
  explícito, así que autogenerate literalmente no vio el cambio. Se agregó
  `compare_server_default=True` a los dos `context.configure(...)` de
  `alembic/env.py` (offline y online) y se regeneró — ahí sí detectó las 8
  columnas y generó 8 `op.alter_column(...)` correctos en `upgrade()` (y
  su reverso en `downgrade()`), sin necesitar ajuste manual esta vez.
  Aplicada con `alembic upgrade head`. Verificado con las dos pruebas
  pedidas: insert por `psql` crudo sin `estado`/`tipo` en las 8 tablas
  (todas devolvieron el default correcto: `activo`, `activa`,
  `esperando`, `pendiente`, `generada`, `otro`, según la tabla) y un
  insert vía `SessionLocal` de SQLAlchemy (ORM) para confirmar que ese
  camino sigue funcionando igual que antes. Un alumno de prueba sin
  `estado` explícito falló por otro motivo (`autorizacion_imagen`, un
  booleano con `default=` de Python, fuera del alcance de esta fase —
  no es un enum) — se volvió a probar pasando esos dos booleanos y
  `estado` salió `activo` sin problema, confirmando que el fallo inicial
  no tenía nada que ver con el fix. Todas las filas de prueba (en 8+
  tablas, incluyendo las filas de `disciplina`/`concepto_cobro`/
  `grupo_clase` armadas solo para poder insertar `inscripcion`/
  `lista_espera`/`cargo`/`liquidacion` de prueba) se borraron después de
  verificar.
- ✅ **Fase B4 — Auditoría completa de defaults (más allá de los enums)**
  (completada). Se recorrieron las 27 tablas de `SCHEMA.md` contra el
  schema original, columna por columna, no solo las que ya se sabía que
  tenían problema. Resultado: la gran mayoría de los `server_default=`
  que ya venían de la Fase B2 (fechas, timestamps, numéricos, booleanos)
  estaban bien desde el principio — la Fase B2 solo se había equivocado
  con los enums. Se encontraron y corrigieron 2 columnas `Boolean` más con
  el mismo bug (`default=` en vez de `server_default=`):
  `alumno.autorizacion_imagen`, `alumno.apto_fisico_presentado`. Además,
  la auditoría encontró **un tipo de error distinto**, no cubierto por el
  patrón anterior: 2 columnas tenían un default que directamente no
  estaba en el schema original (`disciplina.tiene_profesorado`,
  `grupo_clase.es_profesorado` — el original las lista como `bool` a
  secas, sin la palabra `default`, a diferencia de otras columnas de las
  mismas tablas que sí la tienen) — se les había puesto `default=False`
  de más en la Fase B2. Se sacó el default por completo en vez de
  convertirlo, para que el modelo vuelva a exigir el valor en cada INSERT
  como el original. Un tercer caso similar
  (`configuracion_sistema.actualizado_en`, con `server_default=now()` que
  tampoco aparecía explícito en `SCHEMA.md`) se había dejado sin tocar y
  marcado para confirmar con la compañera — **resuelto en la Fase B5, ver
  más abajo: era un error de transcripción de `SCHEMA.md`, no del
  modelo.** Migración nueva generada con `compare_server_default=True` ya
  configurado desde
  la Fase B3 — detectó sola las 2 columnas que sí cambiaban algo en la
  base (los `default=False` sacados de `disciplina`/`grupo_clase` nunca
  habían tocado la base, así que no generaron diff — comportamiento
  esperado, no un problema). Migración revisada a mano, sin necesitar
  ajustes, aplicada con `alembic upgrade head`. Verificado a mayor escala
  que las veces anteriores: insert por `psql` en `alumno` (los 2 casos
  nuevos), confirmación de que `disciplina`/`grupo_clase` ahora **fallan**
  correctamente sin valor explícito (prueba de que sacar el default
  funcionó, no quedó un default fantasma), y una muestra amplia de tablas
  nunca antes probadas con SQL crudo (`configuracion_sistema` con
  `INSERT ... DEFAULT VALUES`, `concepto_cobro`, `comprobante`,
  `criterio_evaluacion`, `registro_auditoria`, `notificaciones`,
  `notificaciones_leidas`, `sueldo_usuario`) — todas devolvieron el
  default correcto. Todas las filas de prueba borradas después.
- ✅ **Fase B5 — Corregir `actualizado_en` con el dato correcto**
  (completada). Cierra el caso que la Fase B4 había dejado "pendiente de
  confirmar". **La causa real era un error de transcripción en
  `SCHEMA.md`, no del modelo**: el bullet de la tabla `configuracion_sistema`
  (escrito en la Fase B2) siempre había dicho `actualizado_en (timestamptz,
  default ahora)` — sí tenía default —, pero la sección de auditoría que
  se agregó en la Fase B4 afirmó lo contrario ("sin la palabra `default`"
  en el original), dos frases contradictorias en el mismo documento. El
  original en realidad especifica `default clock_timestamp()`, no un
  `now()` genérico — a diferencia de los otros 3 campos `timestamptz` del
  schema (todos "creado en", donde `now()` alcanza),
  `configuracion_sistema.actualizado_en` es una marca de "última
  modificación": `now()`/`CURRENT_TIMESTAMP` devuelve la hora de *inicio
  de la transacción* (congelada durante toda la transacción),
  `clock_timestamp()` la hora real del reloj en el momento exacto del
  `UPDATE`. Modelo corregido (`server_default=text("clock_timestamp()")`),
  migración generada (autogenerate la detectó sola, `compare_server_default=True`
  sigue funcionando), revisada sin necesitar ajustes, aplicada. Verificado
  con `psql`: valor por defecto correcto en un insert simple, y — prueba
  más concluyente — dos inserts dentro de la misma transacción separados
  por `pg_sleep(1)` devolvieron `actualizado_en` **distintos**, lo que
  solo pasa con `clock_timestamp()` (con `now()` habrían salido iguales).
  Filas de prueba borradas después (la del `ROLLBACK` se descartó sola).
  `SCHEMA.md` se había releído completo contra el original para esta tabla
  en ese momento y parecía no haber más problemas — **eso resultó
  incompleto: la Fase B6 (más abajo) encontró que "releer de memoria"
  seguía sin ser suficiente**, había más columnas y hasta una tabla nueva
  sin transcribir bien.
- ✅ **Fase B6 — Auditoría mecánica completa contra
  `schema_original_supabase.sql`** (completada). Cambio de método: en vez
  de comparar contra `SCHEMA.md` o de memoria (que es como se venían
  arrastrando errores desde la Fase B2), se puso el archivo SQL original
  al lado de cada modelo de Python, tabla por tabla, columna por columna
  — existencia, default, `CHECK`. Encontró bastante más que las fases
  anteriores:
  - **Columna faltante**: `configuracion_sistema.kapso_api_key` (text,
    nullable) no existía en el modelo. Agregada, mismo criterio de dato
    sensible que `mp_access_token`.
  - **Defaults faltantes**: `configuracion_sistema.direccion` (default
    `'Barrio Observatorio, Córdoba'`) y `.leyenda_comprobante` (default
    `'Comprobante administrativo interno - Escuela de Danzas CREAR'`) no
    tenían ningún default en el modelo.
  - **Defaults de más, sacados por error en la Fase B4**:
    `disciplina.tiene_profesorado` y `grupo_clase.es_profesorado` **sí**
    tienen `DEFAULT false` en el original — la Fase B4 los había sacado
    asumiendo lo contrario sin tener el archivo real a mano. Recuperados.
  - **Un tercer caso de `now()` en vez de `clock_timestamp()`**:
    `registro_auditoria.fecha_hora` — la Fase B5 había corregido este
    mismo error solo en `configuracion_sistema.actualizado_en`, asumiendo
    sin confirmar que los demás timestamptz sí usaban `now()`. El
    original muestra que `registro_auditoria.fecha_hora` **también** es
    `clock_timestamp()`.
  - **Precisión numérica**: 7 columnas (`configuracion_sistema.arancel_cuota_base`,
    `.arancel_matricula_base`, `.porcentaje_recargo_mora`,
    `.porcentaje_descuento_familiar`, `.umbral_asistencia_alerta`,
    `cargo.descuento_aplicado`, `.recargo_aplicado`) tenían el default
    numéricamente correcto pero sin los decimales del original (`40000`
    en vez de `40000.00`, etc.) — importa de verdad: una columna
    `numeric` sin precisión declarada conserva la escala del literal.
  - **Nullability invertida, encontrada de yapa** (no era parte de la
    lista original de "existencia/default/CHECK", pero saltó a la vista
    comparando columna por columna): `grupo_clase.nivel` es NOT NULL en
    el original y estaba `nullable=True`; `cargo.descuento_aplicado` y
    `.recargo_aplicado` son nullable en el original (el propio `CHECK`
    de cada una, `... IS NULL OR ... >= 0`, solo tiene sentido si pueden
    ser NULL) y estaban `nullable=False`. Las 3 corregidas.
  - **15 `CheckConstraint` agregados** — nunca se habían auditado en
    ninguna fase anterior: `alumno.fecha_nacimiento`,
    `configuracion_sistema` (4), `asistencia.fecha`,
    `comprobante.numero`, `cargo` (4), `pago` (2), `sueldo_usuario.monto`,
    `liquidacion.monto`. Más la precisión de `calificacion.nota` corregida
    a `1.00`/`10.00` (ya existía, pero con `1`/`10`).
  - **`usuario`/`padre_tutor.auth_user_id` revisado y confirmado que NO
    se porta** — sí existe en el original (Supabase Auth), pero es
    justo lo que este backend reemplaza (ver "Decisión de auth" en
    `SCHEMA.md`); quedó documentado explícitamente en el modelo para que
    no se "redescubra" como columna faltante en una futura auditoría.
  - **Una sola migración con todo** (no una por hallazgo, a propósito).
    Autogenerate detectó 8 de los cambios solo; **no detectó nada de la
    precisión numérica** (normaliza literales numéricos al comparar, no
    marca diff entre `"40000"` y `"40000.00"`) **ni ningún `CHECK`**
    (limitación conocida de Alembic con Postgres) — los 7 `alter_column`
    de precisión y los 15 `create_check_constraint` se agregaron a mano
    a la migración generada, con su reverso simétrico en `downgrade()`.
    Aplicada con `alembic upgrade head`.
  - Verificado con `psql`: los defaults nuevos/corregidos salen bien en
    un `INSERT ... DEFAULT VALUES`; los 15 `CHECK` se probaron con una
    muestra representativa de inserts inválidos (`alumno` con
    `fecha_nacimiento` futura, `comprobante.numero = 0`,
    `configuracion_sistema.dia_vencimiento_cuota = 30`) — los 3
    rechazados correctamente por Postgres, no solo "existen" sino que
    bloquean de verdad. Filas de prueba borradas después.
  - `SCHEMA.md` reescrito: la sección de defaults dejó de ser una lista
    de parches fase por fase y pasa a listar, tabla por tabla, el estado
    final confirmado (default + `CHECK` + nullability donde no es obvia)
    contra el archivo original. Nueva sección dedicada a la limitación de
    Alembic con `CHECK` constraints. Agregada la línea final pedida:
    "Este documento se valida contra `schema_original_supabase.sql`, no
    de memoria — ante cualquier duda futura, comparar contra ese archivo,
    no contra una descripción de él."
- ✅ **Fase B7 — Primera conexión real: Asistencia de punta a punta**
  (completada). Primera vez que el portal habla con el backend de
  verdad en vez de usar mocks — todo lo anterior (B1-B6) construyó el
  backend pero nada del frontend lo consumía todavía.
  - **CORS**: `CORSMiddleware` agregado en `app/main.py`, permite el
    origin `http://localhost:5173` (Vite). Sin esto el navegador
    bloquea la llamada aunque el backend responda bien.
  - **`relationship()` agregados por primera vez** en los modelos —
    hasta ahora todas las FK eran `Column(..., ForeignKey(...))` crudas,
    sin forma de navegar `objeto.relacion` sin escribir un join manual
    en cada query. Se agregaron las 3 mínimas necesarias para este
    endpoint, unidireccionales (sin `back_populates`, no hacían falta):
    `Asistencia.inscripcion`, `Inscripcion.grupo_clase`,
    `GrupoClase.disciplina`. Cualquier endpoint nuevo que necesite
    navegar otras relaciones las va a necesitar agregar también — no
    existen todavía en el resto de los modelos.
  - **Script de datos de prueba de esta fase** (idempotente — busca por
    clave natural antes de insertar — email, `nombre` de disciplina, combo
    disciplina+profesora, `dni`, combo alumno+grupo, combo
    inscripción+fecha — así se podía correr de nuevo sin duplicar) creó
    una profesora, la disciplina "Danza Clásica", un `grupo_clase`, la
    alumna Sofía Ramírez (mismo nombre que la persona del mock, para
    poder comparar visualmente) con una inscripción y 6 registros de
    asistencia (5 presente / 1 ausente, mismo patrón que
    `asistenciasDemo`). Las fechas usadas fueron
    `2026-09-01/03/08/10/15(ausente)/17` — no `2026-09-22` como el mock
    de septiembre, porque esa fecha cae después de "hoy" en este
    entorno y el `CHECK asistencia_fecha_check` (`fecha <= CURRENT_DATE`)
    la hubiera rechazado. **Este script se eliminó en la Fase B9**,
    reemplazado por `gestion_datos.py`/`cargar_datos_reales.py` — ver esa
    fase más abajo para el mecanismo vigente de carga de datos.
  - **`GET /alumnos/{alumno_id}/asistencia`** (`app/routers/asistencia.py`
    + `app/schemas/asistencia.py`) — en esta fase quedó **⚠️ TEMPORAL,
    sin auth**: no verificaba que quien preguntaba tuviera derecho a ver
    esos datos, cualquier UUID válido servía. **Reemplazado por
    autorización real en la Fase 3a** — ver esa fase más abajo.
  - **Frontend**: `src/api/client.js` nuevo (`getAsistencia`, lee
    `VITE_API_URL`, default `http://localhost:8000`). `useAsistencias`
    intentaba la llamada real primero y caía al mock (`asistenciasDemo`)
    si fallaba, mismo espíritu que el patrón `conFallback` del proyecto
    viejo — ver "Patrón de datos" más abajo, que sigue vigente como
    estructura para el resto de los hooks. **Este fallback a mock se
    sacó en la Fase B9** para `useAsistencias`/`useCargos` específicamente
    (ver esa fase): ahora si la llamada real falla, se propaga el error
    y la página lo muestra, no cae más a datos de prueba en silencio.
  - **UUID hardcodeado temporalmente**: como `AlumnoActivoContext`
    todavía arranca desde `alumnosVinculadosDemo` (no hay login), el
    `id` de Sofía en `src/mock/fixtures.js` se reemplaza a mano por el
    UUID real que imprime por consola el mecanismo de carga de datos de
    turno (`gen_random_uuid()`, así que cambia cada vez que se recrea la
    base — no lo tomes literal de este documento, correlo y usá el que
    te imprima a vos) para que el alumno activo del mock apunte a una
    fila que sí existe en la base. Esto se resuelve solo cuando exista
    login real y el `id` venga de la sesión, no de un mock.
  - **Verificado con Playwright** (Chromium headless): con el backend
    arriba, `/portal/asistencia` mostraba los 6 registros reales (83% =
    5/6, fechas y estado "Ausente" del 15/09 coincidiendo con los datos
    de prueba cargados, sin el warning `[modo demo]` en consola). Con
    `docker compose stop api`, la misma página caía al mock sin
    romperse — aparecía el tab "Agosto de 2026" y la fecha 22/09 (que
    solo existen en `asistenciasDemo`) y sí aparecía el warning
    `[modo demo] asistencia real falló, usando mock` en consola. Los dos
    sentidos se confirmaron antes de dar la tarea por terminada en su
    momento — **este comportamiento de fallback ya no existe desde la
    Fase B9**, queda descripto acá solo como historia de esta fase.
  - `.env.example` nuevo en la raíz del frontend, con `VITE_API_URL`.
- ✅ **Fase B8 — Segunda conexión real: Pagos de punta a punta** (completada).
  - **Cambio de forma mock↔real hecho a propósito**: `cargosDemo` tenía
    `metodo`/`comprobante` como campos sueltos directo en el cargo (un
    solo pago posible), pero `pago` es una tabla aparte 1-a-muchos hacia
    `cargo` (un cargo `parcial` puede tener más de un pago en el
    tiempo) — el mock viejo no podía representarlo. Se corrigió de una:
    la API devuelve `pagos` como array (`CargoOut.pagos: list[PagoOut]`)
    y `cargosDemo` se ajustó a la misma forma, así front y backend
    hablan el mismo idioma desde el principio en vez de arrastrar el
    desajuste hasta que doliera.
  - **`relationship()` nuevos**: `Cargo.concepto_cobro`,
    `Cargo.pagos` (con `back_populates="cargo"` desde `Pago.cargo` —
    primera vez que se usa `back_populates` en el proyecto, hacía falta
    porque acá sí se navega en las dos direcciones: `cargo.pagos` en el
    router, y potencialmente `pago.cargo` a futuro) y
    `Pago.comprobante`. Mismo criterio que en la Fase B7: solo lo que
    el endpoint necesita, no un repaso general de las 27 tablas.
  - **Script de datos de prueba extendido** (mismo script de la Fase
    B7, no uno nuevo — luego eliminado en la Fase B9): agregó 2
    `concepto_cobro` ("Cuota mensual", "Matrícula Anual") y 4 `cargo`
    para el mismo alumno de la Fase B7, cubriendo los 3 estados reales
    del enum `EstadoCargo` (`pago_en_revision` es el cuarto,
    `NUEVO`/propuesto, no usado acá): Septiembre `pendiente` (vencimiento
    a futuro cercano), Agosto `pagado` (pago Mercado Pago + comprobante
    2026-00047), Matrícula `pagado` (pago efectivo + comprobante
    2026-00003), Julio `parcial` (un pago por menos del `monto_final`,
    sin comprobante). Reutilizaba la profesora de la Fase B7 para
    `generado_por`/`registrado_por`/`emitido_por` — no creaba un usuario
    nuevo sin necesidad. Idempotente con el mismo criterio que el resto
    del script (clave natural por entidad: nombre de concepto, combo
    alumno+concepto+periodo para el cargo, `cargo_id` para el pago,
    combo numero+año para el comprobante).
  - **`GET /alumnos/{alumno_id}/cargos`** (`app/routers/cargos.py` +
    `app/schemas/cargo.py`) — en esta fase quedó **⚠️ TEMPORAL, sin
    auth**, mismo criterio que `/alumnos/{id}/asistencia` (Fase B7):
    cualquier UUID válido servía, no verificaba pertenencia.
    **Reemplazado por autorización real en la Fase 3a.**
  - **Frontend**: `getCargos` en `src/api/client.js`; `useCargos` con el
    mismo patrón intento-real-con-fallback que `useAsistencias` tenía en
    ese momento (**fallback sacado en la Fase B9**, ver esa fase).
    `Pagos.jsx` y `ComprobanteModal.jsx` dejaron de leer
    `cargo.metodo`/`cargo.fecha_pago`/`cargo.comprobante` directo y pasan
    a usar el pago más reciente vía el helper nuevo `ultimoPago(cargo)`
    en `utils/format.js`.
  - **⚠️ Límite conocido, dejado anotado a propósito (no resuelto en
    esta fase, sigue sin resolverse)**: tanto el historial de
    `Pagos.jsx` como `ComprobanteModal` muestran únicamente
    `ultimoPago(cargo)` (el pago más reciente), no la lista completa.
    Alcanza mientras cada cargo tenga 0 o 1 pago en la práctica, pero el
    día que un cargo `parcial` acumule 2+ pagos reales, `ComprobanteModal`
    va a necesitar poder listarlos todos en vez de mostrar solo uno —
    documentado con un comentario en el código (`utils/format.js` y
    `ComprobanteModal.jsx`) además de acá.
  - **Verificado con Playwright**: con el backend arriba, `/portal/pagos`
    mostraba los 4 cargos reales (1 pendiente, 2 pagados con su N.º de
    comprobante correcto en el modal, 1 parcial), sin `Cuota Junio 2026`
    (dato que solo existe en el mock) y sin el warning `[modo demo]`.
    Con `docker compose stop api`, la misma página caía a `cargosDemo`
    sin romperse — aparecía `Cuota Junio 2026 (demo vencida)` y el
    warning `[modo demo] cargos real falló, usando mock` en consola.
    **Este comportamiento de fallback ya no existe desde la Fase B9.**
- ✅ **Fase B9 — Script de carga de datos reales + sacar el fallback a
  mock en Asistencia y Pagos** (completada).
  - **`backend/app/seed.py` eliminado.** Reemplazado por dos archivos
    con responsabilidades separadas:
    - **`backend/app/gestion_datos.py`**: funciones reutilizables, una
      por entidad (`crear_usuario`, `crear_disciplina`,
      `crear_grupo_clase`, `crear_alumno`, `inscribir`), cada una hace
      un `add`+`commit`+`refresh` y devuelve el objeto con su id real ya
      generado — así se encadena sin copiar UUIDs a mano
      (`crear_grupo_clase(db, disciplina.id, ...)`). No es un script de
      una corrida, es una librería chiquita.
    - **`backend/app/cargar_datos_reales.py`**: el archivo editable
      donde se escriben las altas reales, usando las funciones de
      `gestion_datos.py`. A diferencia de `seed.py`, **no es
      idempotente a propósito** — cada corrida son altas reales (gente
      nueva), no un reset de datos de prueba. Se corre con
      `docker compose exec api python -m app.cargar_datos_reales` cada
      vez que hay que agregar a alguien; se edita el archivo primero.
  - **Gotcha encontrado probando**: si se imprime `objeto.id` de un
    objeto creado por una función de `gestion_datos.py` *después* de que
    otra función posterior haga su propio `db.commit()` en la misma
    sesión, SQLAlchemy expira el objeto (`expire_on_commit=True` es el
    default) y el acceso dispara un refresh silencioso contra la base —
    funciona mientras la sesión siga abierta, pero **revienta con
    `DetachedInstanceError` si ya se llamó a `db.close()`**. Pasó en la
    primera corrida de prueba: el `print(alumna1.id)` estaba después de
    `db.close()`. Corregido moviendo el print antes del `close()`. Ojo
    con este patrón en cualquier script futuro que imprima ids después
    de varios `commit()` encadenados.
  - **No hace falta convertir el `rol` a enum de Python a mano**:
    `crear_usuario(db, ..., rol="profesor")` con un string plano
    (no `RolUsuario.profesor`) funciona bien contra la columna
    `Enum(RolUsuario)` — confirmado corriendo el script tal cual se
    pidió, sin adaptar esa parte.
  - **Fallback a mock sacado de `useAsistencias`/`useCargos`**
    (`hooks/useAsistencias.js`, `hooks/useCargos.js`): ya no importan
    `asistenciasDemo`/`cargosDemo`. Ahora devuelven `{ datos, cargando,
    error }` — si la llamada real falla, `error` queda seteado y no se
    intenta ningún mock. `Asistencia.jsx` y `Pagos.jsx` muestran un
    estado de error simple (`EmptyState` con ícono `AlertTriangle`) en
    vez de datos de prueba silenciosos.
  - **⚠️ Cambio de comportamiento real, a propósito**: si el backend
    está caído, Asistencia y Pagos ahora se rompen (muestran error) en
    vez de caer elegante al mock como en las Fases B7/B8. Es lo que se
    pidió. Si en algún momento estorba para seguir desarrollando el
    resto del portal con el backend apagado, se puede volver a agregar
    el fallback **solo para desarrollo** — no se agregó preventivamente
    acá porque se pidió sacarlo.
  - **Verificado en el navegador**: se cargó una alumna real (Sofía
    Ramírez, mismos datos que las fases anteriores para no perder
    continuidad, vía `cargar_datos_reales.py`) sin ningún registro de
    asistencia ni cargo todavía — es una alta real recién hecha, no
    tiene historial. Con el backend arriba, `/portal/asistencia` y
    `/portal/pagos` muestran el estado vacío real (0%, "$0 / al día")
    sin ningún dato de `asistenciasDemo`/`cargosDemo` ni el warning
    `[modo demo]` (ya no existe ese código). Con `docker compose stop
    api`, las dos páginas muestran el estado de error nuevo en vez de
    romperse con una pantalla en blanco o un mock silencioso.
  - `AlumnoActivoContext`/`alumnosVinculadosDemo` (el mock del alumno
    activo, no las listas de asistencia/cargos) sigue existiendo sin
    cambios — sigue siendo el mecanismo temporal para simular "qué
    alumno está logueado" hasta que exista login real; no forma parte
    de lo que esta fase pidió sacar.
- ✅ **Fase B10 — Cargar varios alumnos + tutores para probar login y
  roles** (completada).
  - **`gestion_datos.py` extendido** con 7 funciones más, mismo criterio
    de siempre (una por entidad, devuelve el objeto guardado con su id
    real): `crear_padre_tutor`, `vincular_tutor_alumno` (pedidas en esta
    fase) y, además, `crear_concepto_cobro`, `registrar_asistencia`,
    `crear_cargo`, `crear_comprobante`, `registrar_pago` — **no estaban
    en el pedido original, se agregaron porque hacían falta**: sin ellas
    no había forma de darle a cada alumna un historial de
    asistencia/cargos distinto (que sí era un requisito explícito de la
    fase), y ya existía el mismo patrón hecho a mano en el `seed.py` que
    se eliminó en la Fase B9 — acá simplemente se llevó ese mismo código
    a `gestion_datos.py` como funciones reutilizables en vez de lógica
    de un solo script.
  - **`cargar_datos_reales.py` reescrito** con 3 alumnas repartidas en 2
    tutores, cada una con un perfil de asistencia/cargos distinto a
    propósito — ver la tabla completa en "Datos de prueba disponibles"
    (arriba, dentro de "Backend"). En resumen: Tutor A con 1 sola alumna
    (caso simple, sin selector) al día con todo; Tutor B con 2 alumnas
    (prueba el selector "Mis Alumnas"), una con asistencia baja y cuota
    vencida, la otra con asistencia buena pero cuota parcial — así
    cuando exista login, cambiar de tutor/alumna va a mostrar
    información realmente distinta en Asistencia y Pagos, no la misma
    pantalla con otro nombre.
  - **Verificado con un `SELECT` que junta `padre_tutor` + `alumno_tutor`
    + `alumno`** (via `docker compose exec db psql`) antes de dar la
    carga por buena — confirmó los 3 vínculos armados correctamente. Se
    verificaron además los dos endpoints (`/asistencia`, `/cargos`) por
    `curl` para las 3 alumnas, confirmando que cada una devuelve
    exactamente el % de asistencia y el estado de cargo pensado (Sofía
    6/6 y pagado; Valentina 3/6 y vencido; Martina 5/6 y parcial).
  - Sin verificación en el navegador en esta fase — no hay todavía forma
    de elegir tutor/alumno desde la UI (`AlumnoActivoContext` sigue
    hardcodeado a un solo mock), así que no hay nada que un
    Playwright pudiera ejercitar todavía; esto se retoma cuando exista
    login real.
- ✅ **Fase 3a — Login, JWT y roles (backend)** (completada). Primer login
  real del proyecto — hasta acá, `/alumnos/{id}/asistencia` y
  `/alumnos/{id}/cargos` aceptaban cualquier UUID sin verificar nada.
  - **Paso 0, antes de tocar nada**: se confirmó contra la base real
    (`SELECT unnest(enum_range(NULL::rol_usuario))`) que el enum
    `rol_usuario` tiene 5 valores:
    `administrador/secretaria/profesor/alumno/tutor`. **`alumno` y
    `tutor` son valores de más, sin uso** — el rol de una identidad no
    sale de esa columna para esos dos casos: se determina por en qué
    tabla se la encontró (`usuario` → su `rol` real, que en la práctica
    es administrador/secretaria/profesor; `padre_tutor` → `"tutor"`
    fijo, ni siquiera es una columna). No se migró el enum para sacar
    esos 2 valores — alcanza con no usarlos — pero quedó anotado en
    `backend/SCHEMA.md` como limpieza pendiente para una migración
    futura.
  - **`app/core/security.py`** (nuevo): `hash_password`/`verificar_password`
    con `passlib[bcrypt]`, `crear_token`/`decodificar_token` con
    `python-jose`. **Simplificación consciente**: un solo access token
    de 24hs, sin refresh token — implementar rotación de refresh tokens
    es un esfuerzo aparte que no aporta valor proporcional al alcance de
    este proyecto.
  - **`SECRET_KEY` nuevo en `Settings`** (`core/config.py`, minúscula
    como el resto de los campos — el código dado usaba `SECRET_KEY` en
    mayúscula, se adaptó a la convención del archivo). Agregado a
    `.env`/`.env.example`. **Gotcha real encontrado probando**: `.env`
    está en `.dockerignore`, así que el `env_file=".env"` que lee
    pydantic-settings dentro del contenedor no encuentra nada — hace
    falta además pasar la variable por `environment:` en
    `docker-compose.yml` (docker compose sí lee el `.env` del host para
    resolver `${SECRET_KEY}` ahí, es un mecanismo aparte). Sin ese paso,
    el contenedor no arrancaba (`pydantic_core.ValidationError: Field
    required`) aunque el `.env` estuviera bien. Documentado en "Cómo
    levantarlo" arriba para no repetir el error con la próxima variable
    nueva.
  - **Gotcha de dependencias, encontrado probando**: `passlib==1.7.4`
    (última versión, sin mantenimiento activo) es incompatible con
    `bcrypt>=4.1` — esa versión sacó el atributo `__about__` que
    `passlib` usa para detectar la versión instalada, y en vez de un
    fallback prolijo termina en un `ValueError` bastante confuso
    (`password cannot be longer than 72 bytes`, que no tiene nada que
    ver con la causa real). Se fijó `bcrypt==4.0.1` en
    `requirements.txt`, con el porqué comentado ahí mismo.
  - **`gestion_datos.py` extendido** con `establecer_password(db, modelo,
    id, password_plano)` — genérica para `Usuario` o `PadreTutor`, mismo
    criterio de siempre. **`app/asignar_passwords_prueba.py`** (nuevo,
    uso único, no idempotente a propósito — no se corre de nuevo salvo
    que se quiera resetear estas contraseñas): le pone `prueba123` a
    Marcela y Diego. Ver la tabla en "Datos de prueba disponibles" con
    la advertencia de que es una contraseña de desarrollo, no una real.
  - **`POST /login`** (`app/routers/auth.py` + `app/schemas/auth.py`):
    busca primero en `usuario` por email, después en `padre_tutor` — el
    primero que matchea con password correcto gana. El JWT lleva `sub`
    (id), `rol` (el real de `usuario.rol.value`, o `"tutor"` fijo si es
    `padre_tutor`) y `tipo` (`"usuario"` vs `"padre_tutor"` — distinto
    de `rol`, es lo que dice en qué tabla vive la identidad, necesario
    para saber qué verificar en la autorización).
  - **`app/core/deps.py`** (nuevo): `obtener_identidad_actual` decodifica
    el JWT del header `Authorization: Bearer ...` (vía
    `OAuth2PasswordBearer`) y devuelve `{id, rol, tipo}`; token
    inválido/vencido → 401. `verificar_acceso_a_alumno` — si `tipo` es
    `"usuario"` (staff) pasa sin restricción (no es el alcance de esta
    fase); si es `"padre_tutor"`, exige que exista una fila en
    `alumno_tutor` que vincule a ese tutor con ese alumno, si no 403.
  - **`GET /tutores/me/alumnos`** (`app/routers/tutores.py`, nuevo):
    devuelve los alumnos vinculados al tutor autenticado — lo que el
    front va a usar para armar el selector "Mis Alumnas" con datos
    reales en la Fase 3b. Necesitó agregar `AlumnoTutor.alumno =
    relationship("Alumno")` en el modelo (no existía, solo había FK
    cruda) para poder navegar `v.alumno.nombre` como pedía el código
    dado.
  - **`/alumnos/{id}/asistencia` y `/alumnos/{id}/cargos` dejaron de ser
    "TEMPORAL, sin auth"**: ahora piden `identidad: dict =
    Depends(obtener_identidad_actual)` y llaman a
    `verificar_acceso_a_alumno` al principio. El comentario `TEMPORAL`
    se sacó del código de los dos routers.
  - **Verificado con `curl`, la prueba que importa de verdad**: login de
    Diego (`prueba123`) → token; `GET /tutores/me/alumnos` con ese token
    → devuelve exactamente a Valentina y Martina; `GET
    /alumnos/{id_de_sofía}/asistencia` con el token de Diego → **403**
    (Sofía es hija de Marcela, no de Diego — esto confirma que la
    autorización filtra de verdad, no solo que el login funciona);
    mismo alumno con su propio token de Diego (Valentina) → 200 con los
    datos reales; sin token → 401; login con password incorrecta → 401.
    Los 6 casos confirmados antes de dar la fase por terminada.
- ✅ **Fase 3b — Login real, token y selector de alumno (frontend)**
  (completada). Primera vez que el portal usa el login real de la Fase 3a
  en vez de arrancar directo con el mock.
  - **`context/AuthContext.jsx`** (nuevo): `token`/`rol`/`nombre` en
    estado + `localStorage` (`crear_token`/`crear_rol`/`crear_nombre`).
    **Decisión documentada, no el estándar de oro**: `localStorage` en
    vez de una cookie httpOnly — más simple (la cookie httpOnly necesita
    configuración extra de CORS/`SameSite`/dominio compartido del lado
    del backend), pero legible por cualquier script que corra en la
    página, a diferencia de la cookie. Razonable para el alcance de este
    proyecto (una app de facultad, no un sistema bancario) — si en algún
    momento hace falta más rigor contra XSS, revisar esta decisión.
  - **Ajuste de arquitectura de rutas, no pedido explícitamente pero
    necesario para que el flujo funcione**: `AlumnoActivoProvider` pasó
    de envolver solo `/portal` a envolver un grupo de rutas compartido
    (`/portal-login`, `/seleccionar-alumno` y `/portal`, ver `App.jsx`).
    Motivo: `PortalLogin` necesita el `setAlumnosVinculados` de ese
    contexto para guardar la respuesta de `/tutores/me/alumnos` *antes*
    de navegar a `/portal` — si el provider solo envolviera `/portal`,
    se hubiera remontado con el mock de cero al entrar y perdido los
    datos reales que el login acababa de cargar.
  - **`api/client.js`**: `login`/`getMisAlumnos` nuevos; `getAsistencia`/
    `getCargos` ahora piden `token` y mandan
    `Authorization: Bearer ...` — dejó de ser opcional: el backend exige
    el token desde la Fase 3a, así que sin este cambio esas dos pantallas
    hubieran empezado a fallar con 401. El token se lo pasan
    `useAsistencias`/`useCargos` leyendo `AuthContext` internamente (no
    hizo falta tocar `Asistencia.jsx`/`Pagos.jsx`/`Home.jsx`, que ya le
    pasaban el `alumnoId` al hook sin saber nada de auth).
  - **`pages/PortalLogin.jsx`** (nuevo): formulario simple, llama
    `login()` del contexto. Si `rol !== 'tutor'` (alguien de staff
    tocando esta pantalla por error) muestra un mensaje y no navega a
    nada del portal. Si es tutor, pide `/tutores/me/alumnos` con el
    `access_token` recién recibido (no con el `token` del estado de
    contexto, que todavía no se actualizó de forma síncrona) y navega
    directo a `/portal` si hay 1 solo alumno vinculado, o a
    `/seleccionar-alumno` si hay más de uno.
  - **`pages/portal/SeleccionarAlumno.jsx`** (nuevo — no existía de
    ninguna fase anterior, hubo que armarlo): tarjetas simples con
    nombre de cada alumno vinculado: tocar una lo selecciona
    (`setAlumnoActivo`) y navega a `/portal`. Estado vacío si el tutor
    no tiene ninguna alumna vinculada (caso raro, pero real).
  - **`routes/RequireRole.jsx`** (nuevo, carpeta `routes/` no existía):
    tal cual el código dado — solo verifica que haya `token`, no el
    valor de `rol` (el nombre del componente sugiere más de lo que hace
    hoy; la verificación de rol específico queda para cuando haga falta
    distinguir tutor de staff dentro del portal mismo). Envuelve
    `/portal` y `/seleccionar-alumno` en `App.jsx` — antes no tenían
    ningún guard, a propósito, porque no existía login.
  - **"Cerrar sesión" real**: el botón vive en `pages/portal/Perfil.jsx`
    (no en `PortalHeader.jsx` como decía el enunciado — ahí no hay UI de
    logout, se ajustó al archivo real). Su `ConfirmModal` ya construido
    en una fase anterior ahora llama `logout()` del `AuthContext` y
    navega a `/portal-login` en vez de a `/login` (esa ruta es la del
    panel de administración, no del portal).
  - **Verificado con Playwright, los 5 casos pedidos + el negativo**:
    (1) entrar a `/portal` sin login → redirige a `/portal-login`; (2)
    login Diego (`prueba123`) → selector con Valentina y Martina; (3)
    elegir una → Home con sus datos reales (probado con Valentina: 50%
    asistencia, alerta de cuota vencida, todo consistente con lo cargado
    en la Fase B10); (4) Asistencia y Pagos siguen funcionando mandando
    el token (sin 401, con los datos reales de Valentina); (5) login
    Marcela → directo a Home de Sofía sin selector (1 sola alumna,
    100% asistencia, 0 cuotas pendientes); (6) logout desde Perfil →
    vuelve a `/portal-login`. **El caso negativo que realmente importa**:
    logueado como Diego, pedir por `fetch` (con su token real, desde la
    consola del propio navegador) la asistencia del `alumno_id` de
    Sofía → **403** — confirma que la autorización de la Fase 3a se
    respeta también desde el navegador, no solo por `curl`.
  - ~~Límite conocido, no resuelto en esta fase: si la página se recarga
    estando logueado...~~ **✅ Resuelto en la Fase 3c**, ver esa entrada
    más abajo.
  - `mock/fixtures.js` (`familiaDemo`, usado en el saludo de Home y el
    encabezado de Perfil) sigue siendo cosmético/mock — no viene del
    login todavía (el login no devuelve nombre de familia, solo nombre
    del tutor). Fuera del alcance de esta fase.
- ✅ **Fase 3c — Rehidratar la sesión al recargar la página** (completada).
  Cierra el límite que había quedado pendiente al final de la Fase 3b.
  - **`AlumnoActivoContext` deja de arrancar con el mock**: pasó a
    arrancar con `alumnosVinculados: []` y `alumnoActivo: null`. Esto
    era **obligatorio, no opcional**, para que la lógica de `RequireRole`
    dada en el enunciado funcionara — esa lógica usa
    `alumnosVinculados.length === 0` para decidir si hace falta volver a
    pedir `/tutores/me/alumnos`, y `!alumnoActivo` para decidir si hace
    falta mandar a `/seleccionar-alumno`. Con el default viejo (el mock
    de Sofía, siempre no-vacío y siempre no-null) ninguno de los dos
    chequeos se hubiera cumplido nunca, y una recarga habría seguido
    mostrando a Sofía sin importar quién esté logueado de verdad —
    exactamente el bug que esta fase pedía cerrar.
  - **`routes/RequireRole.jsx` reescrito** con la lógica dada
    (verificar token → repoblar `alumnosVinculados` si hace falta →
    mostrar `Spinner` mientras tanto → mandar a `/seleccionar-alumno` si
    no hay `alumnoActivo` → dejar pasar). Se le agregó **una excepción
    no pedida explícitamente pero necesaria**: si ya está en
    `/seleccionar-alumno`, no aplica el chequeo de `!alumnoActivo` — la
    lógica dada, aplicada tal cual a esa misma ruta (que también pasa
    por este guard, porque necesita token), redirige a
    `/seleccionar-alumno` estando ya ahí, en bucle — la pantalla
    quedaba completamente en blanco, sin ningún error visible en
    consola. Encontrado recién al probar en el navegador, no se veía
    con una lectura del código.
  - **Segundo bug encontrado probando, más sutil**: repoblar
    `alumnosVinculados` no alcanza para saber *cuál* alumno estaba
    elegido antes de la recarga — para un tutor con +1 alumna (Diego),
    tras un F5 el pedido explícito de la tarea era volver a ver los
    datos de la que ya había elegido, no que le vuelvan a preguntar. La
    primera implementación intentó resolver esto con un `useEffect`
    aparte en `AlumnoActivoContext` reaccionando a cambios en
    `alumnosVinculados` (buscar en `localStorage` el id guardado y
    restaurarlo) — **tenía una carrera real**: `verificando` podía pasar
    a `false` (sacando el spinner) en un render antes de que ese efecto
    aparte llegara a restaurar `alumnoActivo`, y `RequireRole` mandaba
    de más al selector aunque el alumno recordado existiera. Se movió la
    restauración al mismo `.then()` que repuebla la lista (mismo
    callback síncrono que guarda `alumnosVinculados` y, si corresponde,
    `alumnoActivo`, antes de que se dispare el `.finally()` que saca el
    spinner) — sin efecto aparte, sin carrera. `AlumnoActivoContext`
    ahora solo se encarga de *guardar* el id elegido en
    `localStorage` (`crear_alumno_activo_id`) cuando se llama
    `setAlumnoActivo`; quien lo *restaura* es `RequireRole`, en el lugar
    donde ya tiene la lista fresca a mano.
    `AuthContext.logout()` también limpia esa clave (no es estrictamente
    necesario — son UUIDs reales, una colisión entre tutores distintos
    es virtualmente imposible — pero es la higiene correcta: nada de la
    sesión anterior debería sobrevivir un logout).
  - **`pages/portal/SeleccionarAlumno.jsx`**: mismo criterio que ya
    tenía `PortalLogin` — si `alumnosVinculados.length === 1`, se
    autoselecciona y navega a `/portal` sin mostrar la lista. Hacía
    falta acá también (no solo en el login) porque a esta pantalla
    también se llega por una recarga con `alumnoActivo` en null, no
    solo recién saliendo del formulario de login.
  - **Verificado con Playwright, los 2 casos pedidos + los que hicieron
    falta para encontrar los bugs de arriba**: logueado como Diego,
    elegir a Martina, navegar a Pagos, F5 → sigue en `/portal/pagos`
    mostrando "Cuota mensual — Parcial — $32.000" (el cargo real de
    Martina), sin pedir elegir de nuevo, sin ningún dato de
    `cargosDemo`; mismo resultado yendo a Asistencia ("Asistencia de
    Martina", 83%, 5/6). Borrar `crear_token` a mano desde la consola +
    F5 → `/portal-login` directo, sin pantalla en blanco ni loop.
    Casos de regresión confirmados de nuevo por las dudas: login
    Marcela (1 sola alumna) + F5 → sigue en `/portal` con los datos de
    Sofía (100%); entrar a `/seleccionar-alumno` sin token → redirige a
    `/portal-login` en vez de mostrar la pantalla en blanco del bug.
- ✅ **Fase B11 — Conectar Clases + Horarios a datos reales** (completada).
  - **`relationship()` nuevos**: `GrupoClase.profesora` (hacia `Usuario`)
    y `GrupoClase.horarios` (uno-a-muchos hacia `GrupoClaseHorario`).
    `GrupoClase.disciplina` e `Inscripcion.grupo_clase` ya existían desde
    la Fase B7, se reusaron tal cual.
  - **`gestion_datos.py` extendido** con `crear_horario_clase` (misma
    firma que se dio). **Al revisar los datos de prueba, el grupo de
    Danza Clásica no tenía ninguna fila en `grupo_clase_horario`**
    (nunca se había cargado un horario en ninguna fase anterior) — se
    agregaron 2 (lunes y miércoles 18:00–19:30, mismo horario que ya
    usaba `misClasesDemo` en el mock, para poder comparar visualmente).
    Se sumó además un segundo grupo, disciplina "Jazz" (viernes
    17:00–18:00), e inscribió a Valentina ahí también — es la única de
    las 3 alumnas con 2 clases, justamente para que su calendario en
    Horarios se vea distinto al de sus hermanas (ver tabla en "Datos de
    prueba disponibles").
  - **`GET /alumnos/{alumno_id}/clases`** (`app/routers/clases.py` +
    `app/schemas/clase.py`) — mismo patrón de autorización que
    `/asistencia`/`/cargos` (`verificar_acceso_a_alumno`, reusada tal
    cual, sin cambios). Devuelve las inscripciones **activas** del
    alumno, con `hora_inicio`/`hora_fin` formateadas a `"HH:MM"` desde
    los `time` de Python (`.strftime("%H:%M")`) — el schema pide texto,
    no vienen así solos.
  - **Frontend — adaptación de forma, no solo agregar el fetch**:
    `utils/format.js` (`ocurrenciasDeClaseEnMes`, `itemsDelDia`, etc., ya
    existentes desde que el portal era 100% mock) esperan
    `horarios[].diaSemana/.horaInicio/.horaFin` en **camelCase** — la API
    real devuelve `dia_semana`/`hora_inicio`/`hora_fin` en snake_case.
    `hooks/useClases.js` hace esa traducción (función `adaptarClase`) en
    vez de tocar `utils/format.js`, que es código puro compartido y no
    tiene por qué saber de la forma de la API. También arma ahí mismo el
    string de horario para mostrar ("Lunes y Miércoles 18:00–19:30",
    agrupando por rango horario) — la API solo da el array estructurado,
    no un string ya armado.
  - **Nombre de la clave devuelta por el hook, distinto de lo pedido**:
    el enunciado decía `{ datos, cargando, error }`; se usó
    `{ clases, cargando, error }` en su lugar, mismo criterio de nombrado
    específico por recurso que ya tienen `useAsistencias`
    (`asistencias`) y `useCargos` (`cargos`) — no una clave genérica
    `datos` distinta al resto de los hooks del proyecto.
  - **`pages/portal/Clases.jsx` — la sección "Mis clases" y "Clases
    disponibles" dejaron de compartir un solo hook**: antes las dos
    salían de `useClases()` (mockeado). Ahora "Mis clases" sale de
    `useClases()` real (con su propio estado de `cargando`/`error`,
    acotado a esa tarjeta, no a la página entera — a diferencia de
    Asistencia/Pagos, esta página es mitad real/mitad mock a propósito,
    así que un error en la parte real no debía tapar la parte mock que
    sigue andando); "Clases disponibles" pasó a importar
    `clasesDisponiblesDemo`/`solicitudesInscripcionDemo` directo del
    mock, con el estado de `solicitudes` manejado en la propia página,
    marcado `// MOCK A PROPÓSITO` — el cupo por clase no existe en el
    modelo real (`grupo_clase` no tiene esa columna), documentado en
    `backend/SCHEMA.md` en la sección de propuestas sin confirmar.
  - **`pages/portal/Horarios.jsx`**: pasó a usar el mismo `useClases()`
    real (ya trae `horarios` estructurado, no hace falta una segunda
    consulta) — página de un solo propósito (a diferencia de Clases.jsx),
    así que sí sigue el patrón completo de página-entera-en-error como
    Asistencia/Pagos.
  - **Verificado con `curl` y en el navegador con Playwright**: Martina
    (`GET /clases`) devuelve 1 sola clase (Danza Clásica); Valentina
    devuelve 2 (Danza Clásica + Jazz) — confirmado también visualmente:
    "Mis clases" de cada una se ve distinta, "Clases disponibles" se ve
    igual en las dos (mock estático, no se mezcla con lo real), y el
    calendario de Horarios de Valentina marca puntos los viernes además
    de lunes/miércoles, cosa que el de Martina no tiene.
- ✅ **Fase B12 — Conectar Evaluaciones a datos reales** (completada).
  - **`relationship()` nuevos**: `Calificacion.examen_criterio`,
    `Calificacion.alumno`, `ExamenCriterio.examen`,
    `ExamenCriterio.criterio` (hacia `CriterioEvaluacion`),
    `Examen.grupo_clase`. Ninguno existía todavía (se revisaron los 5
    modelos antes de escribir nada, como pedía la tarea, y los 5 solo
    tenían `ForeignKey` crudas).
  - **`gestion_datos.py` extendido** con las 4 funciones pedidas
    (`crear_criterio`, `crear_examen`, `agregar_criterio_a_examen`,
    `calificar`) tal cual se dieron. **Además**, se le agregó un
    parámetro opcional `es_profesorado=False` a `crear_grupo_clase`
    (que hasta ahora lo fijaba siempre en `False`, sin forma de
    cambiarlo) — hacía falta porque `Evaluaciones.jsx` filtra por ese
    campo ("Solo Profesorado") y el grupo de Danza Clásica, creado en la
    Fase B7 antes de que este filtro importara, tenía `es_profesorado`
    en `False`. Sin este cambio, las calificaciones cargadas iban a
    existir en la base pero el filtro del front las iba a esconder a
    todas — se notó recién al leer `Evaluaciones.jsx` con cuidado, no
    estaba explícito en el pedido.
  - **Datos de prueba**: 1 examen ("Examen Final 2026") sobre el grupo de
    Danza Clásica, 3 criterios con los mismos nombres que ya usaba el
    mock (`Expresión`/`Ritmo`/`Técnica`, para comparar visualmente sin
    fijarse en el código) y calificaciones para Sofía y Martina —
    **distintas a propósito** (Sofía 9/8/9 = 8.7 de promedio, Martina
    7/6.5/7.5 = 7.0) para que la prueba confirme algo real, no que las
    dos vean la misma pantalla con otro nombre arriba. Valentina no
    tiene calificaciones (no está en el grupo que tiene el examen).
  - **`GET /alumnos/{alumno_id}/evaluaciones`** (`app/routers/evaluaciones.py`
    + `app/schemas/evaluacion.py`) — mismo patrón de autorización que el
    resto (`verificar_acceso_a_alumno`, sin cambios). Trae todas las
    `Calificacion` del alumno (una fila por criterio) y las agrupa por
    examen en Python armando un diccionario `{examen_id: EvaluacionOut}`
    — la tabla no tiene una fila "por examen", cada calificación es
    suelta y hay que juntarlas. `titulo` sale de `examen.descripcion`
    con el mismo fallback que el mock (`"Evaluación — {grupo_nombre}"`
    si es null).
  - **`EvaluacionOut` con un campo de más, agregado a propósito**: el
    schema pedido no tenía `es_profesorado`. Se agregó porque
    `Evaluaciones.jsx` necesita ese dato para el filtro y no hay ninguna
    otra fuente de él del lado del front (`ClaseOut`, de la Fase B11,
    tampoco lo expone) — sale gratis, el join a `grupo_clase` ya hacía
    falta para `grupo_nombre`. Es la opción que pedía la propia tarea
    evaluar ("¿lo devuelve el endpoint, o hay que resolverlo del lado
    del front?") — resolverlo del lado del front hubiera necesitado
    inventar una fuente de datos que hoy no existe en ningún lado.
  - **Frontend**: `getEvaluaciones` en `api/client.js`. `useEvaluaciones`
    reescrito real-only, `{ evaluaciones, cargando, error }` (mismo
    nombrado específico por recurso que `useAsistencias`/`useCargos`/
    `useClases`, no el `{ datos, ... }` genérico — mismo ajuste que ya
    se hizo en la Fase B11). Adapta la forma snake_case de la API
    (`grupo_nombre`/`es_profesorado`/`criterio_nombre`) a la camelCase
    que ya esperaban `Evaluaciones.jsx` y `promedioExamen`/
    `promedioGeneral` de `utils/format.js` — esas funciones no se
    tocaron, tal como pedía la tarea.
  - **Verificado con `curl` y en el navegador con Playwright**: Sofía
    (token de Marcela) y Martina (token de Diego) devuelven el mismo
    examen con notas distintas; Valentina devuelve `[]`. En el portal,
    "Evaluaciones de Sofía" muestra promedio **8.7** y "Evaluaciones de
    Martina" muestra promedio **7** — calculados por las mismas
    funciones de `utils/format.js` sin modificar, solo con datos reales
    en vez de `evaluacionesDemo`.
- ✅ **Fase B13 — Conectar Perfil a datos reales** (completada).
  - **`GET /configuracion`** (`app/routers/configuracion.py` +
    `app/schemas/configuracion.py`) — solo devuelve
    `plazo_dias_apto_fisico`/`umbral_asistencia_alerta`, tal cual pedía
    la tarea; `mp_access_token`/`kapso_api_key` siguen sin exponerse en
    ninguna respuesta (ver comentarios en el modelo).
  - **Gap real encontrado probando**: `configuracion_sistema` es una
    fila única de sistema, pero **nada en el proyecto la creaba nunca**
    — ni una migración, ni `cargar_datos_reales.py` hasta ahora. Contra
    una base recién armada, `GET /configuracion` le pegaba a una tabla
    vacía y rompía. Se agregó `crear_configuracion_inicial(db)` a
    `gestion_datos.py` — **es la única función de todo el archivo que sí
    es idempotente a propósito** (busca antes de crear): no tiene
    sentido una segunda fila de configuración de sistema, a diferencia
    del resto de las altas reales de este script. Se llama al principio
    de `cargar_datos_reales.py`. Todos los campos quedan en su
    `server_default` (ver `backend/SCHEMA.md`).
  - **Cierra un gap documentado desde la Fase B2**: el comentario en
    `models/configuracion_sistema.py` decía *"el mock del frontend usa
    365, no 30 — discrepancia a resolver con la compañera antes de
    conectar el portal a este valor real"*. Ya está conectado (`Home.jsx`
    y `Perfil.jsx` usan `useConfiguracion()`), así que el valor real
    (`30`, el `server_default` de la base) es el que manda ahora — el
    comentario se actualizó para reflejar esto en vez de seguir
    describiendo una discrepancia ya resuelta por conexión, no por
    acuerdo con la compañera (que sigue sin confirmarse; ver el
    comentario actualizado).
  - **`GET /tutores/me` y `PATCH /tutores/me`** (mismo router
    `tutores.py`, `app/schemas/tutor.py` nuevo) — tal cual el código
    dado. `PATCH` persiste de verdad contra la base (`db.commit()`), a
    diferencia del mock viejo que solo actualizaba estado en memoria de
    React y volvía al valor original al recargar la página.
  - **`GET /tutores/me/alumnos` extendido** con `apto_fisico_presentado`/
    `apto_fisico_fecha` — mismo endpoint de la Fase 3a, no uno nuevo,
    tal cual pedía la tarea.
  - **`gestion_datos.py`: `crear_alumno` con 2 parámetros opcionales
    más** (`apto_fisico_presentado=False`, `apto_fisico_fecha=None`,
    default compatible con las llamadas ya existentes) — no estaba en
    el pedido de esta fase, pero hacía falta: sin datos de prueba
    variados, las 3 alumnas iban a caer todas en la misma rama de
    `estadoAptoFisico()` ("no presentó todavía") y el checklist propio
    de la tarea ("el apto físico de cada alumna calcula bien contra el
    plazo real") no se podía confirmar de verdad — solo se hubiera
    probado la rama fácil. Se cargaron los 3 casos: Sofía **vigente**
    (presentado 2026-09-05, plazo 30 días → vence 2026-10-05), Martina
    **vencido** (presentado 2026-06-01, ya pasado), Valentina **sin
    presentar** (default, sin cambios) — las 3 ramas de la función
    quedan cubiertas.
  - **Frontend**: `getConfiguracion`/`getMiPerfil`/`actualizarMiPerfil`
    en `api/client.js`. `getMisAlumnos` (ya existente, Fase 3a) ahora
    también adapta `apto_fisico_presentado`/`apto_fisico_fecha`
    (snake_case) a `aptoFisicoPresentado`/`aptoFisicoFecha` (camelCase,
    lo que ya espera `estadoAptoFisico()`) — se hace ahí mismo porque
    esa llamada no pasa por ningún hook (se usa directo desde
    `PortalLogin`/`RequireRole`), no había otro lugar natural para la
    adaptación. `hooks/useConfiguracion.js` y `hooks/useTutorPerfil.js`
    nuevos, real-only, `{ configuracion, cargando, error }` y `{ tutor,
    cargando, error, actualizarPerfil }` — nombrado por recurso, mismo
    criterio que el resto.
  - **`Home.jsx`**: el umbral hardcodeado (`umbralAsistenciaDemo`, 75)
    pasó a salir de `useConfiguracion()`. Con un respaldo de `75` **solo**
    para el caso de que la llamada falle (no mientras carga — se espera
    a que termine antes de calcular alertas) — mismo valor que el
    `server_default` real de la base, no un mock reintroducido por la
    puerta de atrás, para que un fallo puntual de esta llamada no
    crítica no rompa toda la página.
  - **`Perfil.jsx` reescrito**: encabezado usa `useTutorPerfil()`
    (nombre + apellido reales, sin "Familia X" ni DNI inventado — el
    modelo `padre_tutor` ni siquiera tiene columna de DNI). "Mis
    alumnas" usa `configuracion.plazo_dias_apto_fisico` real en vez de
    `configInstitucionalDemo.plazoDiasAptoFisico` (365, mock). Se sacó
    también la línea de `alumno.grupoPrincipal` de esa lista — no
    estaba pedido explícitamente, pero ya venía renderizando vacío para
    cualquier tutor real desde la Fase 3b (el campo nunca existió en la
    respuesta real de `/tutores/me/alumnos`), así que se limpió de paso
    en vez de dejar una línea en blanco conocida. Agregado un estado de
    carga (`Skeleton`) y uno de error (`EmptyState`), que la página no
    tenía de ninguna fase anterior (corría siempre sincrónica sobre el
    mock).
  - **`EditarContactoModal.jsx`**: pasó de editar
    `telefono`/`email`/`domicilio` de la alumna activa a editar
    `telefono`/`email` del tutor — sin campo de domicilio (no existe en
    `padre_tutor`). `onGuardar` en `Perfil.jsx` ahora llama
    `actualizarPerfil()` (con `await`, antes de mostrar el Toast) en vez
    de `actualizarAlumnoActivo()`.
  - **Verificado con `curl` y en el navegador con Playwright**: header
    del portal muestra "Diego Torres" (no "Familia Torres", sin DNI);
    Valentina "No presentó apto físico todavía", Martina "Apto físico
    vencido desde el 1 de jul de 2026", Sofía "Apto físico vigente hasta
    el 5 de oct de 2026" — las 3 ramas confirmadas con datos reales;
    editar el email del tutor y recargar la página (F5) mantiene el
    cambio (a diferencia del mock, que volvía al valor original) — se
    confirmó de hecho sin querer en el propio testeo, al notar que el
    login con el email viejo dejaba de funcionar después de cambiarlo,
    exactamente lo que se esperaría de una persistencia real; la alerta
    de Home de Valentina ("por debajo del mínimo de 75%") sigue
    disparando igual que antes, ahora con el umbral viniendo de
    `/configuracion` en vez de hardcodeado.

### Notas de implementación / ajustes al spec por convenciones reales del repo

- **`components/layout/admin/` no existe como subcarpeta.** `Header.jsx`,
  `Sidebar.jsx` y `Layout.jsx` (el shell de mi compañera) están sueltos
  directo en `components/layout/`, no reorganizados bajo `admin/` como
  sugiere este doc más arriba. No afectó nada de lo construido (el portal
  vive en su propia subcarpeta `components/layout/portal/`, separada), pero
  si en algún momento se reorganiza a `admin/` de verdad, avisar antes.
- **`pages/administrador/` tampoco existe.** Las páginas de mi compañera
  (`Dashboard.jsx`, `Alumnos.jsx`, etc.) están sueltas en `pages/`, sin
  reorganizar. `pages/portal/` se creó igual, como carpeta nueva y separada
  — no hubo conflicto, pero la reorganización que este doc da por hecha
  todavía no pasó.
- **Ruteo del portal: montado en `App.jsx`, fuera del guard de sesión de
  Supabase.** Se agregó `<Route path="/portal">` (con
  `AlumnoActivoProvider` envolviendo `PortalShell`) como rama hermana de
  `/login` y `/`, **no anidada** dentro de la ruta `/` que chequea
  `session`. Es intencional: como no existe login del portal todavía, si se
  anidaba bajo el guard de admin, `/portal` quedaba bloqueado por una
  sesión de Supabase que no tiene nada que ver con Alumno/Tutor. Cuando
  exista `RequireRole`, ahí se decide cómo se guardan ambas ramas.
- **Verificación local requiere `.env` con credenciales de Supabase.** El
  repo no trae `.env`/`.env.local` (están en `.gitignore`) y
  `lib/supabase.js` hace `createClient(undefined, undefined)` si faltan
  `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`, lo cual tira
  `supabaseUrl is required` y rompe el render de **toda** la app (no solo
  admin) porque `App.jsx` importa `supabase` de forma incondicional. Esto
  es preexistente, no algo que introdujo el portal — pero cualquiera que
  clone el repo sin `.env` real se va a encontrar con pantalla en blanco en
  cualquier ruta, incluida `/portal`. Para probar localmente sin backend
  real alcanza con un `.env.local` con valores placeholder (no hace falta
  que apunten a un proyecto Supabase real, `createClient` no valida
  conectividad al construirse).
- **`badgeEstadoCargo` cambió de firma en la Fase 2.** Antes recibía el
  cargo completo y decidía "vencido" internamente; ahora recibe solo
  `estado` (`'pagado' | 'pendiente' | 'parcial'`) y no sabe nada de fechas.
  `esCargoVencido`/`obtenerBadgeCargo` son los únicos que deciden "vencido"
  — un solo lugar, como pedía el spec. No había otros llamadores todavía
  (Home no la usa), así que no rompió nada, pero si alguien busca la firma
  vieja en un commit previo, ya no existe.
- **`esCargoVencido` solo aplica a cargos `'pendiente'`.** El mock de
  prueba (`c6`, estado `'parcial'`) tiene `fecha_vencimiento` en el pasado
  a propósito, para poder ver el badge "Parcial" — si `esCargoVencido`
  hubiera evaluado cualquier estado no pagado, ese caso se veía como
  "Vencido" y nunca se probaba el badge parcial. Se restringió a
  `estado === 'pendiente'`; queda como decisión temporal hasta que se
  defina la regla real de mora para cargos parciales.
- **Bug de zona horaria encontrado y corregido en `esCargoVencido`:**
  comparaba contra `new Date().toISOString().slice(0,10)`, que es la fecha
  en UTC. En Argentina (UTC-3) eso hace que "hoy" salte al día siguiente
  ya pasadas las 21hs locales, marcando cargos como vencidos casi un día
  antes de tiempo. Se cambió a un cálculo de fecha local
  (`hoyLocalISO()` en `utils/format.js`). No estaba en el spec de esta
  tarea, pero se corrigió al detectarlo durante la verificación con
  Playwright porque afectaba directamente el criterio que esta fase pedía
  centralizar.
- **`infoMetodoPago()` devuelve un `icono` como string, no un componente.**
  El spec sugería emojis (💵🏦💳) salvo que ya hubiera un sistema de íconos
  SVG propio — no hay un componente de íconos dedicado en `components/ui/`,
  pero **todo el repo** (admin y portal, cada página) ya usa `lucide-react`
  de forma consistente y no hay un solo emoji en ningún lado. Meter emojis
  al lado de eso rompía esa consistencia, así que se usó `lucide-react`
  igual. Para que `utils/format.js` siga siendo puro (sin React),
  `infoMetodoPago` devuelve una clave (`'banknote' | 'landmark' |
  'credit-card'`) en vez del componente — el mapeo clave→ícono vive en
  `components/portal/ComprobanteModal.jsx` (`IconoMetodoPago`, export
  nombrado que también usa `Pagos.jsx` para no duplicarlo).
- **El color de `parcial` en `badgeEstadoCargo` (`bg-blue-50 text-blue-700`)
  no es el que se ve en pantalla.** `Pagos.jsx` renderiza los badges con el
  componente `Badge` de `components/ui/` (no con las clases crudas de
  `badgeEstadoCargo`), mapeando la etiqueta a uno de los 5 colores fijos de
  `Badge` (`Parcial` → `color="blue"`, que en `Badge.jsx` es
  `bg-primary-light`/violeta, no el azul literal de Tailwind). Las clases
  que devuelve `format.js` quedan como dato puro disponible para quien
  renderice sin pasar por `Badge`; visualmente "Parcial" ya se distingue
  bien de "Pendiente" (ámbar) y "Vencido" (rojo) por el color de `Badge`.
  No se tocó `Badge.jsx` para agregar un color azul literal — es de mi
  compañera, y el criterio de "reusar tal cual" pesó más que igualar el
  hex exacto que sugería el spec.
- **`components/portal/` es una carpeta nueva**, distinta de
  `components/layout/portal/`. La convención que quedó: layout/shell del
  portal (`PortalShell`, `PortalHeader`, `BottomNav`) va en
  `components/layout/portal/`; componentes de una página específica del
  portal (como `ComprobanteModal`, propio de Pagos) van en
  `components/portal/`, sin `layout/`.
- **Badge "Ausente" usa `color="red"`, no un rosa literal.** El spec de
  Asistencia pedía "Ausente rosa" — `Badge.jsx` no tiene un color rosa en
  su paleta fija (green/red/yellow/blue/gray), y su `red`
  (`bg-red-50 text-red-600`) ya es un tono rosado/suave, no un rojo fuerte.
  Mismo criterio que con "Vencido" en Pagos: no se tocó `Badge.jsx` para
  agregar una variante nueva, se usó la más parecida de las que ya existen.
- **"Renombrar Grupos.jsx → Clases.jsx" no era un renombre real.** El spec
  de esta fase asumía un `pages/portal/Grupos.jsx` con una sección "Mis
  clases" y un modal de detalle ya construidos en una fase anterior — nunca
  se construyeron (las fases previas fueron Home, Pagos, Asistencia
  nomás). Lo único que existía con el nombre "Grupos" es
  `src/pages/Grupos.jsx`, el CRUD de administración de grupos de mi
  compañera — totalmente distinto (gestiona altas/bajas de grupos con
  cupo/profesor, no una vista de alumno), y fuera de mi territorio, no se
  tocó. Se construyó `pages/portal/Clases.jsx` y
  `components/portal/ClaseDetalleModal.jsx` de cero en vez de renombrar
  nada. La ruta admin `path="grupos"` (`src/pages/Grupos.jsx`) sigue
  intacta — coexiste sin conflicto con `path="clases"` del portal.
- **`cupoDisponible` de Jazz (`g2`) es 2 en el mock, no 3 como en el
  enunciado original.** Con 3, `estadoCupo()` lo clasificaba como
  "3 lugares disponibles" (caso normal) — igual que Folklore — y el caso
  "¡Últimos N lugares!" nunca aparecía en la demo, aunque el pedido de
  confirmación final pedía ver los 3 casos (normal/lleno/últimos lugares)
  en las 3 clases del mock. Se bajó a 2 para que los 3 casos se vean de
  verdad, sin tocar el umbral (`<= 2`) de `estadoCupo()` — ese vino dado
  literal en el spec.
- **El toast de `ToastContext` se superpone un poco al `BottomNav` en el
  layout mobile del portal.** El contenedor de toasts es
  `fixed bottom-6 right-6`, pensado originalmente para el shell de
  escritorio del admin. Es un componente de mi compañera, reusado tal cual
  sin tocarlo — el toast se ve y se lee bien igual, pero queda anotado acá
  por si en algún momento se quiere ajustar su posición para mobile (eso
  sería tocar `context/ToastContext.jsx`, fuera de mi territorio sin
  avisar primero).
- **"Renombrar Notas → Evaluaciones" tampoco era un renombre real** —
  mismo caso que Clases/Grupos. No había ningún `pages/portal/Notas.jsx`
  (ni con ningún otro nombre): la única pieza que ya existía con "Notas"
  era el label del `BottomNav`, que sí apuntaba a la ruta correcta
  (`/portal/evaluaciones`) desde que se creó — así que ese link nunca fue
  un placeholder roto, solo tenía el label viejo. Se construyó
  `pages/portal/Evaluaciones.jsx` de cero.

## Decisiones de producto (cont.)

- ~~Cupo por clase (`cupoDisponible`/`capacidad`) está mockeado y sin
  confirmar contra el schema real~~ **conectado de verdad, ver Tarea M más
  abajo.** Se confirmó: es justo lo que esta nota anticipaba como posible
  — `vacantes_disponibles` viene **calculado** del lado del backend
  (`cupo_maximo - inscriptos_activos`), no es un campo propio editable.
- **Flujo de inscripción / lista de espera — decisión de producto ya
  tomada, no volver a discutirla al conectar el backend:** el alumno/tutor
  nunca queda inscripto de forma directa al tocar un botón — siempre
  genera una *solicitud* (`'inscripcion'` o `'lista_espera'`) que la
  academia confirma después. Por eso el botón nunca dice "Inscribirse"
  sin más, y el estado post-click es "Pendiente de confirmación" /
  "En lista de espera", nunca "Inscripto". Una vez que hay una solicitud
  activa para una clase, no se puede volver a solicitar (ni cambiar de
  "lista de espera" a "inscripción" ni viceversa) hasta que la academia
  resuelva esa solicitud — hoy eso solo se resetea si se recarga la
  página (es local al hook), el reset real va a venir del backend cuando
  la solicitud cambie de estado.
- **`Avatar` quedó en `components/ui/`, compartido — no específico del
  portal.** Es una pieza de UI genérica (círculo con iniciales) igual que
  `RadialProgress`. Si el sistema de administración quiere mostrar
  avatares de usuarios (admin/profesor/etc.) en vez de sus círculos con
  iniciales hardcodeados a mano (`Header.jsx`, `Dashboard.jsx` admin ya
  arman ese mismo círculo con `style={{ background: 'linear-gradient(...)' }}`
  inline en cada lugar que lo necesitan), este componente lo resuelve una
  sola vez.
- **Las filas de "Cambiar clave de acceso", "Métodos de pago guardados",
  "Ayuda y soporte" y "Notificaciones" en `Perfil.jsx` son placeholders
  visuales a propósito, no funcionalidad pendiente de esta tarea puntual.**
  No hay páginas de destino para ninguna todavía. Desde la Fase 10,
  "Métodos de pago guardados" y "Ayuda y soporte" tienen un `Badge`
  "Próximamente" (sin cursor de puntero) — visualmente distinguibles de las
  filas que sí funcionan. "Cambiar clave de acceso" y "Notificaciones"
  siguen con el tratamiento viejo (ícono + flecha, sin `onClick`) porque no
  entraban en el alcance de la Fase 10 — no se tocaron por decisión
  explícita del spec de esa fase, no por descuido; si en algún momento se
  quiere el mismo badge ahí, es un cambio de una línea cada una. No
  confundir con deuda técnica: son UI intencionalmente inerte, cada una se
  activa cuando exista la pantalla real detrás.
- **`estadoAptoFisico()` se adaptó para parsear la fecha en horario local
  (`${fecha}T00:00:00`), no como vino literal en el spec
  (`new Date(alumno.aptoFisicoFecha)`).** Mismo bug de fondo que ya se
  encontró y corrigió en `esCargoVencido` (Fase 2): un `new Date()` sobre
  un string `'YYYY-MM-DD'` sin hora se interpreta en UTC, y
  `getDate()`/`setDate()` operan en hora local — mezclar los dos corre la
  fecha de vencimiento calculada hasta casi un día en Argentina (UTC-3).
  Se aplicó la misma disciplina que ya usa el resto de `format.js`.
- **El mensaje de `estadoAptoFisico()` en "Mis alumnas" no lleva
  `truncate`.** Se probó primero con `truncate` (como las otras líneas de
  esa fila) y el caso "vencido" cortaba el mensaje justo antes de
  "— hay que renovarlo", la parte más importante. Se cambió a
  `leading-snug` para que haga wrap en 2 líneas en vez de cortarse.
- **`useNotificaciones()` no puede vivir como estado local independiente en
  dos componentes a la vez** (el header y la página de Notificaciones) —
  cada llamada a `useState` es su propia copia, así que marcar una
  notificación leída en la página nunca iba a mover el contador de la
  campanita si cada uno tenía su propia instancia del hook. Se resolvió
  levantando la única llamada al hook a `PortalShell.jsx` (el ancestro común
  de header y `<Outlet/>`) y repartiendo ese mismo objeto de estado hacia
  abajo: como prop (`noLeidas`) a `PortalHeader`, y como
  `<Outlet context={notificacionesApi}>` hacia la página, que lo lee con
  `useOutletContext()` de React Router (ya era una dependencia, no se sumó
  nada nuevo). El hook en sí (`useNotificaciones.js`) sigue teniendo la
  misma forma que los demás — la diferencia es *dónde* se lo llama, una
  sola vez arriba en vez de una vez por componente.
- **`infoTipoNotificacion()` devuelve claves de ícono, no emojis** — mismo
  criterio y misma razón que `infoMetodoPago()` en la Fase 2 (Pagos): el
  spec sugería emojis (💳📅⭐🎭✅), pero todo el repo usa `lucide-react` de
  forma consistente y no hay un solo emoji en ningún lado. El mapeo
  clave→ícono vive en `Notificaciones.jsx` (único consumidor por ahora),
  no en un archivo compartido — a diferencia de `IconoMetodoPago`, que sí
  se exporta porque lo usan dos páginas (`Pagos.jsx` y `ComprobanteModal.jsx`).
- **Verificar esta fase requirió navegar siempre por client-side routing
  (clicks dentro de la app), nunca con `page.goto()` a mitad de la prueba.**
  Como el estado de notificaciones vive en memoria (en `PortalShell`, sin
  backend), una recarga completa de la página lo resetea a los datos
  originales del mock — cualquier verificación que use `page.goto()` para
  "volver a Home" en medio de una prueba va a mostrar el badge sin
  actualizar y hace parecer que "marcar leída" no funciona, cuando en
  realidad el bug está en la prueba, no en la app.
- **`CalendarioMensual` es un componente controlado, no dueño de su propio
  mes.** El spec decía "Botones ‹ › para cambiar de mes (estado local del
  componente, no hace falta persistirlo)", que se podía leer como "el mes
  vive adentro de `CalendarioMensual.jsx`". Pero el componente recibe
  `ocurrencias` ya filtradas para un mes específico por props — si el mes
  mostrado viviera como estado interno del componente, al tocar ‹ › no
  habría forma de pedirle a `Clases.jsx` que recalcule `ocurrencias` para
  el nuevo mes (los datos de `misClases`/`eventosCalendarioDemo` ni están
  disponibles ahí adentro). Se implementó como componente controlado:
  `mesVisto` vive en `Clases.jsx` (con `useState`, sigue siendo "estado
  local" en el sentido de "no global, no persistido" — solo que el
  componente dueño es la página, no `CalendarioMensual` en sí), y
  `CalendarioMensual` solo expone `onMesAnterior`/`onMesSiguiente` para
  pedir el cambio.
- **"Próximos" no se recalcula al mover el calendario, a propósito.**
  `proximosItems()` recibe `anio`/`mes` y filtra por `fecha >= hoy` — si se
  le pasara el mes que se está navegando (`mesVisto`) en vez del mes real,
  navegar a un mes pasado vaciaría la lista (todo queda antes de "hoy") y
  navegar a uno futuro perdería los ítems intermedios entre hoy y ese mes.
  Se llama siempre con el mes real (`hoy.getFullYear()`/`hoy.getMonth()`),
  independiente de qué mes esté mirando el calendario arriba.
- **La Gala Anual CREAR (30/09) no aparece en "Próximos" al día de hoy** —
  no es un bug. `proximosItems()` corta en `cantidad = 5` (default), y hoy
  (11/09/2026) hay exactamente 5 ocurrencias de Danza Clásica antes del
  30/09 (14, 16, 21, 23, 28), así que la Gala queda 6ª en la lista
  cronológica y no entra. Es una consecuencia esperable de combinar una
  clase que se repite 2 veces por semana con un `cantidad` fijo chico —
  no se lo tocó porque no estaba pedido, pero si se quiere garantizar que
  los eventos (más esporádicos que las clases) siempre aparezcan, hay que
  subir `cantidad` o tratar eventos aparte de clases en el corte.
- **`ocurrenciasDeClaseEnMes()`/`proximosItems()` usan `hoyLocalISO()`
  (exportada ahora) en vez de `new Date().toISOString().split('T')[0]`
  como venía en el snippet del spec** — mismo bug de UTC-vs-local ya
  corregido dos veces antes (`esCargoVencido` en Pagos, `estadoAptoFisico`
  en Perfil): de noche en Argentina (UTC-3) el "hoy" en UTC ya es mañana,
  y sin el fix eso excluía el día de hoy de "Próximos" unas horas antes de
  tiempo. Se prefirió exportar la función ya existente en vez de duplicar
  la lógica por tercera vez.
- **`calcularAlertas()` — cuarta aparición del mismo bug de UTC-vs-local.**
  El snippet del spec calculaba `en3DiasISO` con
  `en3Dias.toISOString().split('T')[0]`; se cambió a armar el string desde
  `getFullYear()/getMonth()/getDate()` directo (sin pasar por UTC en
  ningún momento, ni siquiera con el truco de offset de `hoyLocalISO()`).
  Motivó agregar la sección "Convenciones de código" un par de fases
  atrás — esta es la cuarta vez, no la primera, así que vale la pena
  revisar cualquier función nueva que toque fechas contra esa regla antes
  de darla por buena.
- **`Skeleton` quedó en `components/ui/`, compartido — no específico del
  portal.** Mismo criterio que `Avatar`/`RadialProgress`: es una pieza de
  UI genérica (un bloque `animate-pulse`), no algo propio del portal. Si
  el sistema de administración quiere reemplazar sus `Spinner` centrados
  por skeletons con la forma de cada pantalla, esta pieza les sirve tal
  cual.
- **Follow-up sin hacer:** la notificación tipo `'evento'` en
  `Notificaciones.jsx` sigue sin CTA (`CTA_POR_TIPO` no tiene entrada para
  `evento`), aunque desde la Fase 17 ya existe `/portal/eventos/:id` para
  mandarla ahí. No se tocó porque no entraba en el alcance de esa tarea —
  el comentario en el código se actualizó para no decir "pausado" (ya no
  lo está), pero conectar el CTA queda pendiente.
- **Reusar `infoEstadoEntrada()` para vestuario (Fase 18) dejó un label un
  poco raro — resuelto en la Fase 19.** El spec de la Fase 18 pedía
  explícitamente no crear una función nueva para los mismos 3 estados —
  correcto, hubiera sido puro duplicado. El costo era que el label de
  `'pagado'` decía "Entrada confirmada", que sonaba a ticket, no a una
  malla o un par de zapatillas. La Fase 19 lo resolvió del lado correcto
  (generalizar la función existente, no bifurcarla en dos):
  `infoEstadoEntrada()` → `infoEstadoPago()`, con "Pago confirmado" en vez
  de "Entrada confirmada" — mismo cambio para `MisEntradas.jsx` también,
  ya que comparten la función.
- **Primera vez corriendo Playwright en la máquina Windows del usuario, no
  en el sandbox Linux de las fases anteriores.** No había Playwright ni
  Chromium instalados acá — se preguntó antes de instalar (~280MB de
  Chromium a `%LOCALAPPDATA%\ms-playwright`) en vez de asumirlo, porque a
  diferencia del sandbox descartable de antes, esta es la PC real del
  usuario. Confirmó que sí. Queda instalado ahí para la próxima vez, igual
  que en el entorno anterior.
- 💡 **Decisión pendiente: cambiar el email de login (`usuario.email`) no
  tiene ningún endpoint todavía — ni para tutor ni para ningún rol.** Surgió
  al aclarar en `EditarContactoModal.jsx` que el email de "Editar datos de
  contacto" (`tutores.email`, vía `/portal/perfil`) es solo para que la
  academia contacte a la familia, distinto del email con el que se inicia
  sesión (`usuarios.email`, usado en `/auth/login`). Cambiar el email de
  login no es una tarea de conexión simple si en algún momento se pide:
  toca autenticación (¿requiere confirmar la clave actual? ¿un correo de
  verificación al nuevo email?) y probablemente unicidad/normalización
  (ver "email sin mayúsculas" en otra fase). Es una conversación de
  producto + seguridad con la compañera antes de tocar nada, no algo para
  resolver del lado del portal de familias solo.

## Tarea B — Portal de datos reales: 4 recortes de alcance

Al conectar Home/Pagos/Asistencia/Horarios/Perfil contra el backend real
(`/api/v1/portal/hijas/...`, `/api/v1/auth/me`), el spec original pedía
algunas cosas que **no tienen respaldo en lo que el backend realmente
devuelve**. Se resolvió recortando la feature en vez de inventar el dato en
el frontend — quedan documentadas acá para no repetir la pregunta:

1. **Apto físico desapareció de `Perfil.jsx`.** El spec pedía
   `alumno.apto_fisico` / `alumno.fecha_apto`, pero `HijaResponse` (lo único
   que devuelve `GET /portal/hijas`) no serializa esos campos — existen en
   la tabla `alumnos` (`apto_fisico`, `fecha_apto`) pero el schema del
   portal de familias no los expone. Mostrarlos tal como pedía el spec
   hubiera dado "No presentado" para cualquier alumna, sea cierto o no. Se
   sacó la sección entera de la tarjeta de cada alumna en "Mis alumnas".
   Si en algún momento se agrega el campo a `HijaResponse`, se puede volver
   a poner con el formato simple que pedía el spec (sin el cálculo de
   vigencia que tenía antes `estadoAptoFisico()`, que ya no existe).
   **Resuelto en la Tarea L**: el campo se agregó y `estadoAptoFisico()`
   volvió, con cálculo de vigencia incluido.
2. **Home conserva Alertas y el % de asistencia, con más de una llamada.**
   El spec sugería "una sola llamada" ya que `/portal/hijas` trae `clases`
   y `total_exigible` — pero no trae nada de asistencia, así que la tarjeta
   de asistencia (RadialProgress) y las Alertas (cuota vencida / asistencia
   baja) no se podían armar sin pedir también `getCuentaCorriente` y
   `getAsistenciaHija`. Se decidió mantenerlas (son las mismas que ya
   existían) agregando esas dos llamadas de más en `Home.jsx`, en vez de
   sacar esas secciones para cumplir literal el "una sola llamada".
3. **`Clases.jsx` ("Mis clases" + "Clases disponibles") no estaba en el
   mensaje, pero dependía de `getClases`/`useClases`**, que el spec pedía
   borrar del cliente (sin endpoint real). Se adaptó "Mis clases" al mismo
   dato que ya usa `Horarios.jsx` (`alumnoActivo.clases`, forma
   `ClaseDeLaHija`: `disciplina`/`nivel`/`dias_horarios`/`docente_nombre`),
   y se actualizó `ClaseDetalleModal.jsx` a esos campos. "Clases
   disponibles" sigue con `clasesDisponiblesDemo` — cupo por clase sigue
   sin existir en el modelo real (ver "Decisiones de producto (cont.)"
   arriba), eso no cambió con la Tarea B. `useClases.js` se borró (sin
   consumidores).
4. **Eventos y Vestuario pasan de "pendiente/pausado" a "sin endpoint en
   el backend real, mock indefinido"** (ver "Diseño" más arriba) — no es
   un matiz cosmético: antes la expectativa era "esto se conecta cuando
   el backend lo tenga"; ahora, con el resto del portal ya conectado, es
   evidente que **no existe ninguna tabla ni ruta para esto en el backend
   real** (ni en `database/migrations/`, ni en `app/api/v1/`), así que no
   hay "cuándo" — queda mockeado hasta que alguien diseñe esa parte del
   modelo de datos desde cero.
5. ~~"Editar datos de contacto" se sacó de Perfil (sin endpoint,
   `EditarContactoModal.jsx` borrado)~~ — **resuelto en la Tarea D**, ver
   más abajo. El backend sí tenía el endpoint, solo no era el que se había
   probado (`/tutores/me` no existe; el real es `/portal/perfil`).

**Otros ajustes mecánicos, consecuencia directa de los anteriores (no
decisiones de producto, solo lo que hacía falta para que compile):**
`AlumnoActivoContext`/`RequireRole`/`SeleccionarAlumno`/`Perfil` pasaron de
`alumno.id`/`alumno.nombre`+`alumno.apellido` a `alumno.alumno_id`/
`alumno.nombre_completo` (la forma real de `HijaResponse`); `Header.jsx`
(el de `components/layout/`, no el login) dejó de mostrar `familiaDemo.nombre`
y ahora usa el nombre real de `AuthContext` (poblado en el login), para no
mostrar un tutor inventado arriba de una pantalla que ya muestra el
verdadero más abajo; `useTutorPerfil.js`, `useConfiguracion.js` y
`EditarContactoModal.jsx` se borraron (sin endpoint, sin consumidores
después del recorte de Perfil); `familiaDemo`, `alumnosVinculadosDemo`,
`configInstitucionalDemo`, `cargosDemo`, `grupoAsistenciaDemo`,
`asistenciasDemo`, `umbralAsistenciaDemo`, `horariosResumenDemo` y
`misClasesDemo` se sacaron de `mock/fixtures.js` (cero usos).

## Tarea C — Horarios reconectados al horario estructurado real (resuelto)

El recorte de la Tarea B ("Horarios bajó de calendario a lista") **quedó
resuelto**: `ClaseDeLaHija` ahora trae `horarios: [{ dia_semana,
hora_inicio, hora_fin }]` estructurado (`dia_semana` sin acentos y sin
domingo, `hora_*` como `HH:MM:SS`), además del texto `dias_horarios`.

- `Horarios.jsx` volvió a usar `CalendarioMensual`, alimentado por
  `alumnoActivo.clases` (ya está en el contexto: sin fetch propio). Solo
  existe un tipo de marca, **Clase** (violeta): se sacó el punto rosa y la
  leyenda de "Evento" del componente.
- `utils/format.js`: `ocurrenciasDeClaseEnMes`, `proximosItems` e
  `itemsDelDia` volvieron con la forma nueva (sin eventos). Las fechas se
  arman con campos locales, no con `toISOString()` (regla de "Convenciones
  de código"), y cada ocurrencia lleva `tipo: 'clase'` porque el calendario
  lo usa para pintar el punto.
- Una comisión con `horarios: []` (sin estructurar todavía) no se marca en
  el calendario: se muestra aparte como "Otros horarios: {disciplina} —
  {nivel} ({dias_horarios})".
- `Clases.jsx` no cambió (sigue con `alumnoActivo.clases` + `dias_horarios`).
- **Eventos y Vestuario siguen igual:** sin endpoint en el backend real,
  mock indefinido.

## Tarea D — "Editar datos de contacto" reconectado (resuelto)

El recorte 5 de la Tarea B (`EditarContactoModal.jsx` borrado por falta de
endpoint) **quedó resuelto**: el endpoint sí existe, era `GET`/`PATCH
/api/v1/portal/perfil` (`TutorResponse` / `PerfilTutorUpdate`), no
`/tutores/me` (que nunca existió).

- `api/client.js`: `getMiPerfilTutor()` y `actualizarMiPerfil(datos)` — esta
  última reemplaza a la versión que la Tarea B había borrado; ahora apunta
  al endpoint real.
- **`fetchConToken` cambió cómo arma el error** (afecta a todos sus
  consumidores, no solo a este): antes descartaba el cuerpo de la respuesta
  y tiraba `Error ${status}` a secas. Ahora lo lee e intenta sacar un
  mensaje humano: `mensaje` si es una `DominioException` del backend
  (`{ codigo, mensaje, detalles }`, ej. `ERR_SIN_CAMBIOS`), o `detail` si es
  el 422 default de FastAPI/Pydantic (string, o lista de `{msg, loc, ...}`
  — se concatenan los `msg`). Sin esto, el pedido explícito de "mostrar el
  mensaje del backend, no uno genérico" no se podía cumplir: el mensaje
  real nunca llegaba a `catch`.
- `hooks/useMiPerfilTutor.js` (nuevo): `{ perfil, cargando, error,
  actualizar }`, mismo patrón que el resto de los hooks de recurso.
- `EditarContactoModal.jsx` (recreado): valida en el cliente con los mismos
  límites que `PerfilTutorUpdate` (`telefono_whatsapp` 6–30 caracteres,
  `direccion` ≤255, `email` con formato válido) — pero **solo manda los
  campos que cambiaron** (diff contra `perfil`), no el formulario entero:
  si no cambió nada, el payload es `{}` y el backend responde
  `ERR_SIN_CAMBIOS` de verdad, que es el mensaje que se termina mostrando.
  El formulario se resincroniza contra `perfil` cada vez que se abre (no
  solo al montar), así que si se guardó una vez y se reabre, arranca con el
  valor ya persistido.
- `Perfil.jsx`: la fila "Editar datos de contacto" volvió, ahora con
  flecha `>` (ya no placeholder ni "Próximamente"), usando
  `useMiPerfilTutor()`. Mientras `cargando` es `true` (el `GET` tarda un
  instante), el click no hace nada y la flecha se reemplaza por un spinner
  chico — así no se abre el modal (ni se precarga con datos vacíos) antes
  de tener el perfil real.
- Probado con Playwright contra un mock que replica los tres shapes reales
  de respuesta (200, 400 `ERR_SIN_CAMBIOS`, 422 de Pydantic): la validación
  de cliente bloquea un email con formato inválido sin llegar a pegarle al
  backend; guardar un cambio real actualiza, muestra el toast y persiste al
  reabrir el modal; guardar sin cambiar nada muestra el mensaje real
  "No se indicó ningún dato para modificar."; y un 422 real (simulando
  saltear la validación de cliente) muestra el mensaje real de
  email-validator, no un "Error 422" genérico. Falta repetir el click
  antes de que resuelva el `GET` y todo lo demás contra el backend real
  con Diego — no se pudo probar en el sandbox por una caída transitoria
  del entorno de comandos esa sesión.

## Tarea E — PWA instalable de verdad (resuelto por completo)

`vite-plugin-pwa` agregado (`vite.config.js`): manifest con
`theme_color`/`background_color` tomados de `primary`/`primary-light` de
`tailwind.config.js` (no inventados, son los mismos hex ya definidos:
`#6D5AE6` / `#EEE9FF`), `display: standalone`, `registerType: 'autoUpdate'`,
y `workbox.navigateFallbackDenylist` excluyendo `/api/` — las llamadas al
backend real (cuotas, asistencia) nunca deben quedar cacheadas por el
service worker.

- **Íconos:** generados de verdad desde `public/logo.png` (2362×2362, sobra
  resolución) con `sharp-cli` — `icon-192.png`, `icon-512.png`.
- **Favicon corregido:** `index.html` apuntaba a `/favicon.PNG`, un
  archivo que nunca existió en `public/` (404 silencioso en consola,
  arrastrado de una iteración anterior). Había una sola etiqueta
  `<link rel="icon">` — se cambió a `<link rel="icon" type="image/png"
  href="/logo.png" />`, reusando el logo real en vez de generar un
  favicon aparte.
- `index.html`: `<meta name="theme-color" content="#6D5AE6">`, alineado
  con el manifest.
- Verificado con `npm run build && npm run preview`: por código
  (Playwright headless contra el build real) — manifest se sirve y
  parsea sin errores, los 3 íconos y `/logo.png` resuelven 200, el
  service worker se registra y llega a `activo`, la pestaña tiene una
  sola `<link rel="icon">` resuelta a `/logo.png`, cero requests
  fallidos y cero errores de consola. **Instalación confirmada por el
  usuario**: ícono de instalar visible en la barra de direcciones de
  Chrome/Edge, y "Agregar a pantalla de inicio" probado desde un celular
  real contra la IP de la red local.
- **Único pendiente: el ícono maskable (`icon-512-maskable.png`) es una
  copia lisa del 512, sin safe zone** — el logo real no tiene margen
  pensado para que Android lo recorte en círculo/squircle (el texto
  "CREAR" llega cerca del borde inferior). Sirve para instalar y pasa la
  validación, pero conviene reemplazarlo el día que haya una versión del
  logo diseñada para eso (contenido dentro del ~80% central).

## Tarea F — Feriados en el calendario de Horarios (resuelto)

Confirmado antes de conectar nada: `GET /api/v1/calendario/feriados?anio=`
existe de verdad en `crear-backend` (`app/api/v1/calendario.py`,
`FeriadoResponse = { fecha, nombre, tipo }`), habilitado para `tutor`
además del personal (`require_roles(*ROLES_PERSONAL, *ROLES_FAMILIA)`).

- `api/client.js`: `getFeriados(anio)`. `hooks/useFeriados.js` (nuevo):
  toma `anio`, no `mesVisto` completo — Horarios ya guardaba el mes
  visible como `{ anio, mes }`, así que `useFeriados(mesVisto.anio)` solo
  vuelve a pedir cuando cambia el año (diciembre → enero), no en cada
  cambio de mes dentro del mismo año.
- `utils/format.js`: `feriadosDelMes(feriados, anio, mes)`, función nueva
  y separada de `ocurrenciasDeClaseEnMes` (no se tocó) — son dos fuentes
  de datos distintas, se combinan recién en `CalendarioMensual`.
- `CalendarioMensual.jsx`: prop nueva `feriados` (default `[]`), segundo
  punto en `bg-amber-500` (violeta ya usado por "Clase") — si un día tiene
  clase y es feriado a la vez, los dos puntos se muestran juntos uno al
  lado del otro (mismo contenedor `flex gap-0.5` que ya separaba las
  marcas, no hubo que inventar nada). Leyenda con la segunda entrada.
- `Horarios.jsx`: al tocar un día feriado, el detalle muestra su nombre
  (viene de la API) en una franja ámbar arriba de la lista de clases de
  ese día — **sin ocultar que ese día "en teoría" había clase**: si hay
  clase ese día, se sigue mostrando debajo; si no hay, sigue el mensaje
  normal de "No tenés clases este día."
- Verificado con Playwright contra un mock con feriados reales de
  diciembre 2026 (Inmaculada Concepción 8/12, Navidad 25/12 — Argentina no
  tiene feriado nacional en septiembre, el mes que se ve por defecto, así
  que se navegó a diciembre para probar, tal como anticipaba la consigna):
  septiembre sin ningún punto ámbar, diciembre con los dos feriados
  marcados; el 25/12 (viernes, coincide con la Jazz de Valentina) muestra
  **los dos puntos juntos** en el calendario y, al tocarlo, "Navidad" +
  "Jazz — Inicial 17:00–18:00" en el mismo detalle; el 8/12 (sin clase ese
  martes) muestra "Inmaculada Concepción de María" + "No tenés clases este
  día." Sin errores de consola.

**Al margen, no es de esta tarea:** apareció un módulo `/api/v1/evaluaciones`
nuevo en `crear-backend` desde la última vez que se revisó (criterios y
exámenes) — pero es exclusivo de personal (`ROLES_PERSONAL`/`ROLES_GESTION`/
`ROLES_DIRECCION`), sin nada en `portal.py` para el rol `tutor`. No cambia
lo documentado en "Diseño" sobre Evaluaciones en el portal de familias
(sigue sin endpoint para una tutora que quiera ver las notas de su hija) —
pero si en algún momento se agrega ese lado family-facing, hay que revisar
esto de nuevo antes de asumir que sigue sin backend.

## Tarea G — Eventos conectado a datos reales, solo lectura

Confirmado antes de tocar nada: `GET /api/v1/portal/eventos?desde=` existe
en `crear-backend` (`EventoResponse = { id, nombre, tipo, fecha, lugar,
descripcion, created_at }` — **sin `hora`, sin `mapaAsientos`, sin
`fechaLimitePago`**, esos eran campos del mock viejo que este endpoint real
no tiene). El backend ya filtra `tipo != "examen"` del lado del servidor.
No hay `GET /portal/eventos/{id}` — no existe un endpoint de detalle único.

- `api/client.js`: `getEventos(desde)`. `hooks/useEventos.js` reescrito
  (dejó de usar `eventosDemo`): pide con `desde=hoyLocalISO()`, así la
  cartelera no muestra eventos que ya pasaron.
- `Eventos.jsx`: cartelera real (`nombre`, `formatFecha(fecha)`, `lugar` si
  existe, chip de `tipo` vía `infoTipoEvento()` nuevo en `format.js`) —
  **sin el link a "Mis entradas"** que estaba arriba. Estado vacío real
  ("No hay eventos próximos") en vez de inventar uno si la cartelera viene
  vacía.
- `EventoDetalle.jsx`: reescrito para **no usar `useEvento` (singular,
  mock)** — usa `useEventos()` (la lista real) y busca el id con
  `useParams()`, porque no hay endpoint de detalle único y esta pantalla
  solo se llega clickeando una tarjeta de la cartelera ya cargada. Muestra
  nombre/tipo/fecha/lugar/descripción tal cual vienen (nada si `lugar` o
  `descripcion` vienen `null`, no un placeholder inventado) — **sin botón
  "Elegir mis butacas", sin link a Vestuario, sin ninguna sección de
  compra**.
- `Perfil.jsx`: se sacó la fila "Mis entradas" **del todo**, no quedó como
  "Próximamente" — mismo criterio que se usó con "Vestuario" en Home (ver
  "Diseño" arriba): no hay ningún dato real detrás, así que no se ofrece
  ni como placeholder.
- **`hooks/useEvento.js` (singular) no se tocó** — sigue mockeado
  (`eventosDemo`/`butacasOcupadasDemo`), porque `EventoButacas.jsx`
  (el viejo flujo de compra, que queda sin ruta de navegación pero sin
  borrar) todavía depende de él. Si se llegara a borrar ese hook sin
  revisar esto, `EventoButacas.jsx` se rompe.
- **Quedan sin tocar, a propósito** (base de diseño para el módulo de
  compra real, el día que se encare): `MapaButacas.jsx`,
  `EventoButacas.jsx`, `ResumenCompra.jsx`, `VestuarioEvento.jsx`,
  `MisEntradas.jsx`, sus rutas en `App.jsx` (`eventos/:id/butacas`,
  `eventos/:id/resumen`, `eventos/:id/vestuario`, `mis-entradas` — las
  rutas siguen registradas, solo que ya no hay ningún botón o link que
  lleve un usuario real hasta ahí) y en `mock/fixtures.js`: `eventosDemo`
  (con `mapaAsientos`), `butacasOcupadasDemo`, `misEntradasDemo`,
  `vestuarioPorEventoDemo`.
- Verificado con Playwright contra un mock con dos eventos reales (uno con
  `lugar`/`descripcion`, otro con ambos en `null`, para probar que no
  rompe ni muestra "null" en pantalla): la cartelera lista los dos con su
  chip de tipo y sin el link a "Mis entradas"; el detalle de cada uno no
  tiene ningún botón de compra; Perfil ya no tiene la fila "Mis entradas".
  Sin errores de consola.

**Módulo de compra de entradas: queda pendiente como tarea grande aparte**
(mapa de butacas, QR, pagos de tickets, "Mis entradas") — no hay una sola
tabla de esto en el backend real todavía; los archivos de diseño viejo
mencionados arriba son el punto de partida cuando se encare.

## Tarea H — Evaluaciones conectado a datos reales

Evaluaciones pasa de **"en construcción del lado de la academia"** a
**conectado real**. Confirmado antes de tocar nada:
`GET /api/v1/portal/hijas/{alumno_id}/evaluaciones` existe de verdad
(`app/api/v1/portal.py`, `EvaluacionDeLaHija`), ordenado por
`Evento.fecha.desc()` del lado del backend (no hace falta ordenar en el
frontend).

- **Detalle importante de la forma real que no era obvio del spec:**
  `CalificacionDeLaHija.notas` es un **diccionario** `{ [criterio_id]:
  nota }` (`Dict[str, int]` en Pydantic), no un array de
  `{criterio_id, nota}` — hay que iterar con `Object.entries(...)`, no
  `.map()`. Los `criterios` (con `nombre`/`escala_max`) vienen **por
  examen** (`evaluacion.criterios`), no en un endpoint aparte.
- `api/client.js`: `getEvaluaciones(alumnoId)` reapunta a
  `/api/v1/portal/hijas/{id}/evaluaciones` (antes: `/alumnos/{id}/evaluaciones`,
  que ni siquiera existía). `useEvaluaciones.js` reescrito sin el
  adaptador viejo (`grupo_nombre`/`es_profesorado`/`detalle[]` — formas
  que nunca existieron del lado real, eran puro mock).
- `utils/format.js`: se sacaron `promedioNotas`/`promedioExamen`/
  `promedioGeneral` (confirmado con grep, cero usos fuera de
  `Evaluaciones.jsx`, que ya no calcula promedios — el spec no lo pidió y
  la forma real tampoco se presta a un promedio simple entre distintos
  criterios/escalas). Agregada `notaConEscala(nota, escalaMax)`.
- `Evaluaciones.jsx` reescrito sobre la forma real: por examen,
  `nombre`/`formatFecha(fecha)`/`clases.join(', ')`; según
  `calificaciones.length` — 0: "Todavía no tiene nota cargada en este
  examen."; 1: chips por criterio (buscado en `examen.criterios` por id) +
  observaciones si las hay + "Corregida por X" si `corregida_por` no es
  null; más de 1: el mismo bloque repetido con un encabezado "Cargada por
  {cargada_por}" antes de cada uno, para distinguir dos calificaciones
  reales del mismo examen de una nota rara. Se sacó el footer "Solo se
  muestran notas de Profesorado..." (distinción inventada para el mock
  viejo — el backend real ya solo devuelve exámenes donde la alumna está
  anotada de verdad). El error real (conexión) volvió a usar el
  `EmptyState` genérico de Home/Pagos/Asistencia — la razón para el
  mensaje especial ("módulo en construcción") ya no aplica, el endpoint
  existe.
- Verificado con Playwright contra un mock con los tres casos de
  `calificaciones.length` a la vez (0, 1, y 2 — este último con
  `corregida_por` cargado): título con el nombre real de la alumna,
  orden por fecha descendente respetado, sin el footer viejo, chips
  `Ritmo: 8 / 10` / `Técnica: 9 / 10` con observaciones para el caso de 1,
  y para el caso de 2 — "Cargada por Lorena" dos veces, cada uno con su
  propio chip, y "Corregida por Dirección" en el segundo. Sin errores de
  consola. Falta repetirlo con datos reales de Diego/Valentina o Martina
  contra el backend real — si ninguna tiene notas cargadas todavía, cargar
  una de prueba con el flujo real (examen → fijar clases → cargar nota)
  para poder ver la pantalla con datos de verdad.

## Tarea I — Avisos en Home: 2 de 3 resueltos, 100% del lado del front

> El tercer aviso (apto físico) quedó resuelto después, en la Tarea L —
> ahí sí hizo falta tocar el backend.

De los tres avisos que tenía el proyecto viejo (cuota vencida/próxima,
asistencia baja, apto físico vencido), **2 quedaron resueltos acá, sin
tocar el backend** — el tercero sigue bloqueado por lo mismo que ya se
documentó en la Tarea B (recorte 1): **falta un endpoint chico que
exponga `apto_fisico`/`fecha_apto` en el portal** (`HijaResponse` no los
trae; los campos existen en la tabla `alumnos` pero no en el schema del
portal de familias). Mientras ese endpoint no exista, el aviso de apto
físico no se puede armar.

- **`AlertaHome.jsx` se reusó tal cual** — ya existía (de la Tarea B) con
  la misma franja de color por urgencia (rojo/alta, ámbar/media) y el
  mismo shape `{mensaje, ctaLabel, ctaRuta}` que pedía esta tarea. No se
  creó ningún `AvisoHome.jsx` nuevo.
- `utils/format.js`: `calcularAvisos({hijas, cuentasCorrientes,
  asistencias})` nueva, **sin tocar `calcularAlertas()`** (sigue existiendo
  tal cual, aunque después de este cambio `Home.jsx` ya no la llama — quedó
  así porque la consigna pidió explícitamente no tocar nada existente en
  este archivo). Dos ajustes sobre el snippet del mensaje: (1) el período
  de la cuota se muestra con `formatMesLabel()` en vez de la fecha ISO
  cruda (`"2026-09-01"` no es un mensaje legible); (2) `en3Dias` se arma
  con los campos locales (`getFullYear/getMonth/getDate`), no con
  `.toISOString()` — es la quinta vez que aparece ese mismo bug de
  UTC-vs-local en este archivo (ver "Convenciones de código"), así que se
  corrigió antes de copiarlo de nuevo.
- `Home.jsx`: además del `useCargos`/`useAsistencias` de siempre (para las
  tarjetas de la hija activa), ahora también pide con `Promise.all` la
  cuenta corriente y la asistencia de **todas** las `alumnosVinculados` en
  un `useEffect` aparte, para poder calcular avisos agregados de las hijas
  que no están seleccionadas en este momento. El contenedor de avisos
  quedó arriba de todo, antes de la tarjeta de saludo, igual que en el
  proyecto viejo.
- **Costo a vigilar, tal como pedía la consigna:** esto dispara 2×N
  llamadas en paralelo al entrar a Home (N = cantidad de hijas vinculadas).
  Para los casos reales de hoy (2-3 hijas) no es un problema. Si en algún
  momento aparece un tutor con muchas más hijas, esto hay que revisarlo
  (ej. un endpoint agregado del lado del backend en vez de N llamadas
  desde el frontend).
- Verificado con Playwright simulando una cuenta con 3 hijas (una con
  cuota vencida, una con cuota a 2 días de vencer, una con asistencia por
  debajo del umbral — los tres candidatos a aviso a la vez): aparecen
  exactamente 2 avisos (nunca más), con el nombre correcto de cada hija,
  el de mayor urgencia primero (vencida antes que próxima a vencer), el
  período legible, y el tercer candidato (asistencia) quedó afuera por el
  tope de 2 — tal como exige la consigna. Sin errores de consola. Falta
  repetirlo con la cuenta real `familia@demo.crear-academia.com` (o forzar
  un caso de asistencia baja a mano en una base de prueba si no hay
  ninguno real, nunca en producción).

## Tarea J — Notificaciones reales, combinando datos existentes

`Notificaciones.jsx` dejó de ser mock — combina cuotas, asistencia, pagos,
evaluaciones y eventos de **todas** las hijas en una sola lista, 100% del
lado del front (no hay tabla de notificaciones en el backend real, ni
hace falta: todo sale de endpoints que ya existen).

- `utils/format.js`: `calcularNotificaciones({hijas, cuentasCorrientes,
  asistencias, evaluaciones, eventos, pagos})` nueva — combina y ordena por
  fecha descendente (a diferencia de `calcularAvisos()`, que recorta a 2
  para Home, acá entran todas). Dos ajustes sobre el snippet: (1)
  `formatMesLabel(cuota.periodo)` iba a romper — `periodo` es una fecha
  completa (`"2026-09-01"`), `formatMesLabel` espera `"YYYY-MM"`, hace
  falta el mismo `.slice(0, 7)` que ya usa `calcularAvisos()`; (2)
  `en14Dias`/`hace30Dias` armados con `.toISOString()` es el mismo bug de
  UTC-vs-local ya corregido varias veces en este archivo — se armaron con
  los campos locales.
- **Bug nuevo que apareció al conectar datos reales, corregido de paso:**
  `formatFechaRelativa()` nunca había recibido una fecha del futuro (en el
  mock viejo, toda notificación era un evento ya ocurrido) — con cuotas
  por vencer y próximos eventos, daba `"Hace -7 días"` en vez de
  `"En 7 días"`. Se agregaron los casos `dias < 0` (`"En N días"`) y
  `dias === -1` (`"Mañana"`).
- `hooks/useNotificaciones.js` reescrito: ya no toma `alumnoId` (lee
  `alumnosVinculados` del contexto), trae todo con `Promise.all` en un
  único `useEffect`, y agrega `leidas` como `Set` persistido en
  `localStorage` (`crear_notifs_leidas`) — `marcarLeida`/`marcarTodas`
  escriben ahí, así que sobrevive a un F5. El hook devuelve `notifs` (no
  `notificaciones`) — `Shell.jsx` (el contador de la campanita) se
  actualizó para leer el campo nuevo.
- `Notificaciones.jsx`: se sacó `CTA_POR_TIPO` por completo — cada
  notificación ya trae su `ctaRuta` resuelta desde `calcularNotificaciones()`,
  no hace falta un mapa aparte. El botón del modal quedó con un label
  genérico ("Ver más") en vez de uno por tipo, ya que `calcularNotificaciones()`
  no manda un label de CTA. `infoTipoNotificacion()` se actualizó a los 5
  tipos reales (`cuota`/`asistencia`/`pago`/`evaluacion`/`evento`) — el
  tipo `horario` del mock viejo desapareció (ver "Decisiones pendientes"
  abajo) y `vencimiento` pasó a llamarse `cuota`. `mock/fixtures.js`:
  `notificacionesDemo` se borró (sin consumidores).
- Verificado con Playwright con una cuenta de una hija con los 5
  ingredientes a la vez (cuota vencida, pago reciente, nota cargada, y un
  evento — Gala Anual — dentro de los 14 días; sin caso de asistencia baja
  en este mock puntual): aparecen las 4 notificaciones correspondientes,
  ordenadas por fecha descendente, con el nombre de la hija en cada
  mensaje. "Marcar todas" escribe en `localStorage` y, tras recargar la
  página completa, los puntos de "no leída" y el badge de la campanita
  quedan en cero — confirma que persiste de verdad, no solo en memoria.
  Sin errores de consola.

### Decisiones pendientes (nuevas, ninguna se construye ahora)

- **Notificación de "cambio de horario"** (existía en el mock viejo, tipo
  `horario`) — necesita exponer auditoría filtrada por alumno/clase para
  el rol `tutor`. Confirmado contra `crear-backend`: `/api/v1/auditoria`
  es exclusivo de `ROLES_DIRECCION`
  (`app/api/v1/auditoria.py`), no hay nada equivalente para el portal de
  familias. Sin ese endpoint, no hay forma de saber si/cuándo cambió el
  horario de una comisión.
- **Mensajes de la academia a las familias** — funcionalidad nueva de
  punta a punta (no es "conectar" nada existente, como las demás tareas de
  este bloque): no hay tabla, ni endpoint, ni pantalla de redacción del
  lado del personal. A diseñar desde cero cuando se encare.

## Tarea K — ESLint: .toISOString() suelto pasa a ser error de lint

El proyecto no tenía ESLint configurado en absoluto (sin `.eslintrc`, sin
`eslint.config.js`, sin el paquete instalado, sin script `lint`) — se armó
de cero, acotado a esta sola regla (no es un setup general de lint para
todo el proyecto, eso sería otra tarea aparte).

- `eslint.config.js` (formato flat config — no `.eslintrc`, porque no
  había nada previo que mantuviera el formato legado y Vite 7 ya asume el
  ecosistema nuevo): una sola regla, `no-restricted-syntax` sobre
  `CallExpression[callee.property.name='toISOString']` en
  `src/**/*.{js,jsx}`, con `src/utils/format.js` exceptuado (confirmado
  antes de excluirlo: `hoyLocalISO()` sí usa `.toISOString()` adentro,
  pero sobre una fecha ya corregida con el offset local, no el patrón
  roto). No se instaló `eslint-plugin-react` ni ningún ruleset
  `recommended` a propósito — eso haría aparecer de golpe todos los
  issues preexistentes del código que nunca se lintió (variables sin usar,
  etc.), que no son el objetivo de esta tarea puntual y enterrarían la
  señal real (si quedaba algún `.toISOString()` suelto).
- `package.json`: script `"lint": "eslint ."`.
- Corrido `npm run lint` sobre todo el código actual: **pasó limpio, exit
  0** — no quedó ningún `.toISOString()` sin corregir en ningún archivo
  que no se haya tocado en las tareas anteriores.
- Verificado que la regla funciona de verdad (no es un falso "pasó limpio"
  por mala configuración): un archivo de prueba con
  `new Date().toISOString()` sí tira el error (`exit 1`, con el mensaje
  completo apuntando a `hoyLocalISO()`), y `src/utils/format.js` sigue
  pasando limpio con la excepción puesta.

## Tarea L — Apto físico: el tercer aviso pendiente, resuelto

Cierra el recorte 1 de la Tarea B y el tercer aviso que había quedado
bloqueado en la Tarea I: el backend sumó `apto_fisico`/`fecha_apto` a
`HijaResponse` (`GET /portal/hijas`, rama `feat/apto-fisico-portal` del
repo `crear-backend`), así que ya hay dato real para calcular vigencia del
lado del portal.

- `utils/format.js`: `estadoAptoFisico(hija)` vuelve a existir (se había
  sacado en la Tarea B al no haber dato). Calcula el vencimiento sumando
  `MESES_VIGENCIA_APTO` (12) a `fecha_apto` y marca `vencePronto` en los
  últimos `DIAS_AVISO_APTO` (30) antes de esa fecha. **Estas dos
  constantes están duplicadas a mano contra `MESES_VIGENCIA_APTO`/
  `DIAS_AVISO_APTO` de `avisos_service.py` en el backend** — no hay un
  endpoint de configuración accesible al tutor desde el portal, así que no
  hay forma de pedirlas en vez de hardcodearlas. **Si cambian del lado del
  backend, hay que acordarse de actualizarlas acá también** (no hay nada
  que avise del desfasaje si alguien las cambia de un solo lado).
- Reusa `fechaLocalISO(anio, mes, dia)` (ya existía, usado por
  `ocurrenciasDeClaseEnMes`) en vez de declarar un helper nuevo con el
  mismo nombre y otra firma — confirmado antes de escribir código.
- `Perfil.jsx`: "Mis alumnas" vuelve a mostrar el estado debajo del
  nombre de cada hija — verde (`text-emerald-600`) si vigente, ámbar
  (`text-amber-600`) si no (vencido o nunca presentado).
- `calcularAvisos()` (Home) y `calcularNotificaciones()` ganan un tercer/
  sexto tipo respectivamente (`apto_fisico`), con el mismo criterio de
  urgencia que especificó la tarea: `alta` si no está vigente, `media` si
  vence dentro de los próximos `DIAS_AVISO_APTO` días. `ctaRuta: '/perfil'`
  en los dos (no hay una pantalla propia de apto físico). `calcularAlertas()`
  sigue sin tocarse, igual que en la Tarea I.
- `Notificaciones.jsx`: ícono nuevo (`ShieldAlert` de lucide-react,
  clave `shield-alert`) agregado a `ICONOS_TIPO` — sin esto el tipo nuevo
  caía al ícono genérico (`Bell`) en vez de tener uno propio.
- Verificado llamando `estadoAptoFisico()`/`calcularAvisos()`/
  `calcularNotificaciones()` directo con Node (sin levantar la UI) contra
  fechas armadas a mano: vencido hace 13 meses, a 10 días de vencer, a 40
  días de vencer (no entra en el aviso todavía) y vencido hace 2 días —
  los cuatro casos dieron `vigente`/`vencePronto`/mensaje correctos, y una
  hija con apto vencido hace 400 días genera el aviso `alta` en
  `calcularAvisos()` y la notificación `apto_fisico` esperada. `npm run
  lint` y `npm run build` sin errores. **Falta repetirlo contra el backend
  real con una alumna de la base forzada a `fecha_apto` vencida (UPDATE
  manual + revertir después), como pedía la tarea** — no se hizo en esta
  pasada.

  ## Pendiente: Vestuario — ver y pagar desde el portal (bloqueado en diseño, no en código)

Ver el vestuario de una alumna es chico (GET /vestuarios?alumno_id= ya existe, falta
el endpoint de portal que lo filtre). Pagarlo online es grande: confirmado que
`OrdenPago.cuota_id` es una FK fija a `cuotas`, no genérica — todo
`CobroElectronicoService` (enlace de pago, webhook, acreditación) está escrito
específicamente para cuotas mensuales, no para cualquier cargo.

Extender esto a vestuario implica una decisión de arquitectura real (¿`OrdenPago`
pasa a ser polimórfica, o se duplica el mecanismo para un segundo tipo de cargo?)
que le corresponde a la compañera tanto como a nosotros, dado que toca un sistema
de cobros con dinero real ya en uso. Pendiente de hablarlo con ella antes de
escribir código — no empezar esta tarea sin esa conversación primero.
(**Nota de la Tarea L:** esa conversación ya no hace falta para la parte
de *lectura* — el backend real terminó con su propio modelo de vestuario,
no una extensión polimórfica de `OrdenPago`: `CuentaVestuario`/`CargoVestuario`
aparte, con su propio enum de estado. La decisión de arquitectura de más
arriba sigue siendo relevante si en algún momento se quiere *pagar*
vestuario desde el portal, no solo verlo.)

## Tarea L — Vestuario, pantalla nueva

`/vestuario` conectada de verdad — cuotas y pagos de vestuario de la
alumna activa, **sin filtro por evento** (el backend no lo permite:
`GET /portal/hijas/{id}/vestuario` devuelve todas las cuentas de la
alumna, no una por evento).

- **Confirmado contra `crear-backend` antes de armar los badges de
  estado, tal como pedía la consigna:** el enum de vestuario es distinto
  al de cuotas mensuales — `PENDIENTE`/`PAGO_PARCIAL`/`PAGADO` (masculino,
  "cargo"), **sin `EN_MORA`** (vestuario no tiene mora, confirmado
  leyendo `vestuario_service.py`). `infoEstadoCuotaVestuario()` nueva en
  `format.js`, separada de `infoEstadoCuota()` — no se reusó.
- **El campo real se llama `cuotas`, no `cargos`** como decía el mensaje
  (`VestuarioDeLaHija.cuotas: List[CuotaVestuarioDeLaFamilia]`, en
  `app/schemas/portal.py`).
- **Corrección a la consigna, verificada antes de aplicarla:** el mensaje
  decía "sin ningún botón de descarga, no existe el endpoint" para los
  pagos de vestuario — **no es así**. `PortalService.recibo()` busca el
  `pago_id` tanto en pagos de cuota como en pagos de vestuario
  (`propios = {...cuotas} | {...vestuario}`), y
  `CobroService.generar_recibo()` tiene una rama completa para vestuario
  (`get_datos_recibo_vestuario`, concepto
  `"Vestuario: {descripción} - cuota N/M"`) — genera un PDF real, no un
  stub. Como ya estaba `descargarRecibo(alumnoId, pagoId)` de la Tarea D
  (usado en `ComprobanteModal.jsx` para cuotas), se reusó acá tal cual
  para los pagos no anulados — mismo patrón de descarga
  (`URL.createObjectURL` + `<a download>`).
- `api/client.js`: `getVestuarioHija(alumnoId)`. `hooks/useVestuario.js`
  (nuevo), mismo patrón que el resto de los hooks de recurso.
- `pages/Vestuario.jsx` (nueva): por cuenta — descripción + badge "Listo
  para entrega" si corresponde, barra de progreso (`costo_total -
  saldo_total` pagado de `costo_total`), lista de cuotas con su badge de
  estado, lista de pagos con ícono de descarga (o badge "Anulado" en vez
  del ícono, sin descarga, para los anulados). Estado vacío real si
  `cuentas` es `[]`.
- `Eventos.jsx`: tarjeta "Vestuario" (ícono `Shirt`, subtítulo "Cuotas y
  pagos de disfraces/trajes") **arriba de la cartelera, como sección
  aparte** — no adentro de `EventoDetalle.jsx`, que insinuaría un vínculo
  con un evento puntual que no existe. `Shell.jsx`:
  `/vestuario` sumada a `RUTAS_CON_VOLVER` (header con flecha "volver", no
  el avatar — mismo criterio que `/perfil`/`/mis-entradas`/etc.).
- Verificado con Playwright: una hija con una cuenta real (3 cuotas en
  los 3 estados posibles, 3 pagos — uno con medio efectivo, uno con
  transferencia, uno anulado) muestra la descripción, la barra de
  progreso, los 3 badges de estado correctos, y el pago anulado con su
  badge rojo **sin** ícono de descarga; la descarga de un pago real
  disparó un PDF de verdad con el nombre del comprobante
  (`V-2026-001.pdf`); una segunda hija sin vestuario muestra el estado
  vacío con su nombre. La tarjeta "Vestuario" en Eventos quedó separada
  de la cartelera, sin insinuar que pertenece a un evento — capturas en
  el hilo. Sin errores de consola.

## Tarea M — Clases disponibles real

`Clases.jsx` ("Clases disponibles") dejó de usar `clasesDisponiblesDemo` —
ahora pide de verdad a `/portal/comisiones-disponibles` y deja pedir un
lugar con `/hijas/{id}/solicitudes-inscripcion`.

- **Dos cosas confirmadas contra el backend real antes de armar la UI,
  tal como pedía el paso 0, con un resultado distinto al esperado en
  ambas:**
  1. `/comisiones-disponibles` **ya excluye** las comisiones sin cupo del
     lado del servidor (`app/api/v1/portal.py`:
     `if c.cupo_maximo - inscriptos <= 0: continue`) — **nunca** llegan
     con `vacantes_disponibles: 0`. La rama "Sin cupo" de la UI está
     implementada (es gratis, no rompe nada tenerla por robustez), pero
     **no hay forma de probarla contra el backend real tal como está
     hoy** — el paso de "Al terminar" que pedía buscar la comisión llena
     de la demo no se puede cumplir, se verificó simulándola en un mock
     aparte, dejado aclarado en el propio test.
  2. El backend **no rechaza** pedir un lugar en una comisión donde la
     alumna ya está inscripta — `SolicitudInscripcionService.crear()`
     solo valida que no haya otra solicitud *pendiente* de la misma
     alumna+comisión, nada sobre inscripciones activas. El filtro del
     lado del cliente (comparar `comision.id` contra los `comision_id` de
     `alumnoActivo.clases`) es la única defensa real, no un adorno.
  3. **Hallazgo extra, no pedido pero necesario para la UI:** el estado
     real de una solicitud tiene **tres** valores, no dos —
     `pendiente`/`atendida`/`descartada` (migración
     `035_solicitudes_inscripcion.py`), no solo
     "pendiente, o descartada" como daba a entender el mensaje. `atendida`
     no tiene un caso de UI propio a propósito: si la secretaría la
     atendió de verdad (aceptándola), la comisión ya debería aparecer en
     `alumnoActivo.clases` y quedar filtrada por "ya cursa" — se trata
     igual que "sin solicitud" para el caso raro de que no sea así.
- `api/client.js`: `getComisionesDisponibles()`, `getMisSolicitudes(alumnoId)`,
  `solicitarInscripcion(alumnoId, comisionId, mensaje)`.
  `hooks/useClasesDisponibles.js` (nuevo): lee `alumnoActivo` del contexto
  directamente (no recibe `alumnoId` por parámetro), trae comisiones y
  solicitudes en paralelo, se vuelve a pedir solo cuando cambia el
  `alumno_id` activo, y `solicitar()` agrega la solicitud devuelta al
  estado local al toque (sin F5).
- Un 409 real (`ERR_SOLICITUD_DUPLICADA`) se probó forzando el mismo
  pedido dos veces desde la consola del navegador (la UI ya lo previene
  mostrando "Ya enviado", así que no sale solo) — el mensaje real del
  backend se mostró con el mismo mecanismo de `EditarContactoModal.jsx`
  (`catch (err) { setErrorServidor(err.message) }`), nada crudo.
- **Limpieza confirmada con grep antes de borrar:** `clasesDisponiblesDemo`
  y `solicitudesInscripcionDemo` fuera de `mock/fixtures.js` (sin
  consumidores tras la reescritura); `estadoCupo()` fuera de `format.js`
  (solo lo usaba `Clases.jsx`).
- Verificado con Playwright (`familia@demo.crear-academia.com`, Valentina
  con una clase ya cursada): la comisión que Valentina ya cursa no
  aparece en "disponibles"; pedir un lugar en Jazz cambia el botón a "Ya
  enviado" sin recargar, con el toast de éxito; el 409 real al reenviar
  mostró el mensaje real del backend; cambiando a Martina (sin clases
  cursadas) la misma comisión Jazz vuelve a mostrar el botón activo —
  confirma que las solicitudes son por alumna, no compartidas. Sin
  errores de consola.

## Tarea N — Notificaciones híbridas: servidor + calculadas

`Notificaciones.jsx` pasó a combinar dos fuentes en vez de una. El
backend sumó `NotificacionService` (tabla real, con estado de lectura
server-side), pero solo para `tutor` y solo 3 tipos: `CUOTA_NUEVA`,
`CUOTA_VENCIDA`, `PAGO_RECIBIDO` (confirmado en
`services/notificacion_service.py`, rama `_de_la_familia()`). Los otros
4 tipos que armaba `calcularNotificaciones()` desde Tarea J (asistencia,
apto físico, nota cargada, evento) siguen calculándose 100% del lado del
cliente — el backend no los tiene todavía.

- **Reparto de fuentes:**
  - Servidor (`getNotificaciones()`, `GET /api/v1/notificaciones`):
    cuota/pago. `no_leidas` cuenta **todas** las pendientes, no solo las
    últimas 30 que trae `items` (`LIMITE = 30` en el service) — el hook
    usa ese número tal cual para el badge, no cuenta `items` a mano.
  - Cliente (`calcularNotificaciones()`, recortada): asistencia, apto
    físico, nota cargada, evento. `calcularAvisos()` (Home) no se tocó —
    sigue con cuota/pago propios, es un aviso distinto con otro recorte
    (2 items) y no es parte de este pedido.
- `api/client.js`: `getNotificaciones()`, `marcarNotificacionLeida(id)`,
  `marcarTodasLeidas(id)` — las dos últimas responden 204 sin cuerpo, ya
  cubierto por el `if (res.status === 204) return null` que
  `fetchConToken` ya tenía desde antes (no hizo falta tocarlo, la
  "trampa" ya estaba resuelta).
- `utils/format.js`:
  - `calcularNotificaciones({hijas, asistencias, evaluaciones, eventos})`
    — se sacaron las ramas de cuota (vencida/por vencer) y pago, y los
    parámetros `cuentasCorrientes`/`pagos`. Quedan asistencia, apto
    físico, nota cargada y evento tal cual estaban.
  - `tipoVisualDeBackend(tipo)` nueva: traduce los 3 `tipo` reales del
    backend a los mismos `'cuota'`/`'pago'` que ya usaba
    `TIPOS_NOTIFICACION`, con fallback a `'general'` para un tipo futuro
    que el backend todavía no manda.
  - `fechaLocalDeInstante(iso)` nueva: el `fecha` del backend es datetime
    con timezone (ej. `2026-10-05T01:30:00Z` = 22:30 Argentina del día
    4) — se arma el día calendario con `new Date(iso)` + el
    `fechaLocalISO` privado que ya existía (mes base 0, igual que
    `getMonth()`, no hizo falta ajustarlo). Nada de `.toISOString()`
    (bloqueado por el lint de Tarea K de todos modos).
  - `infoTipoNotificacion()` **no se tocó**: el `?? {label: 'Aviso', ...,
    icono: 'bell'}` que ya tenía de antes cubre cualquier `tipo` sin
    entrada en `TIPOS_NOTIFICACION`, `'general'` incluido — agregar una
    entrada explícita para `'general'` habría sido redundante.
- `hooks/useNotificaciones.js` reescrito: `delServidor`/`noLeidasServidor`
  (del `GET /notificaciones`) y `calculadas` (de
  `calcularNotificaciones()`) se piden en paralelo con
  `Promise.allSettled` — si una fuente falla la otra igual se muestra,
  en vez de que un timeout de notificaciones tire abajo toda la pantalla.
  Se combinan en un `notifs` memoizado, cada item con un `origen`
  (`'server'`/`'local'`) y un `orden` numérico (`new Date(fecha).getTime()`
  para servidor, mediodía local para calculadas — evita que la hora del
  día mueva un item al lado equivocado de la medianoche al mezclar
  ambas fuentes). `noLeidas = noLeidasServidor + no leídas de calculadas`
  (nunca se cuenta `notifs.length`, por la razón de arriba). `marcarLeida`
  bifurca por `origen`: servidor hace update optimista + POST +
  rollback si falla (probado forzando un 500 en el mock: el item vuelve
  a quedar sin leer y el badge recupera el número); local escribe
  directo a `localStorage` (`crear_notifs_leidas`, mismo mecanismo de
  Tarea J, nunca falla). `marcarTodas` hace ambas cosas a la vez.
- `Notificaciones.jsx`: tocar una notificación ahora navega directo a
  `ctaRuta` después de `marcarLeida(n)` (antes abría un modal con botón
  "Ver más"); el modal queda como respaldo solo para el caso sin
  `ctaRuta` (hoy inalcanzable, los 6 tipos actuales siempre la traen —
  pensado para cuando el backend agregue un tipo nuevo sin ruta
  resuelta). El orden de la lista pasó de `fecha.localeCompare()` a
  `orden` numérico: con dos fuentes, `fecha` ya no es un formato único
  (`'YYYY-MM-DD'` en calculadas vs. datetime completo convertido a local
  en servidor) y compararlas como string ordenaba mal los empates de
  mismo día.
- `Shell.jsx`: el badge de la campanita pasó a leer `noLeidas` del hook
  en vez de contar `notifs.filter(n => !n.leida).length` a mano (así
  entran las pendientes fuera de las últimas 30). Confirmado que
  `Shell.jsx` y `Notificaciones.jsx` ya comparten una sola instancia del
  hook desde Tarea J/I (`useNotificaciones()` se llama una vez en
  `Shell.jsx` y se pasa por `<Outlet context={{notificacionesApi}}/>`,
  consumida con `useOutletContext()`) — no hizo falta agregar ningún
  Provider nuevo.
- `AuthContext.jsx`: `logout()` ahora también borra
  `crear_notifs_leidas` — es estado de lectura por usuario, no debía
  sobrevivir a un cambio de sesión en la misma pestaña.
- **Verificado con un mock de Node + Playwright, no contra el backend
  real**: había un backend real con Docker/Postgres corriendo en esta
  sesión (aparentemente para las pruebas manuales que pide este mismo
  pedido — SQL de la cuota de Clara, evento de Swagger), así que se
  evitó tocarlo para no pisar esos datos; se armó un mock aparte en otro
  puerto. Casos probados: una notificación de servidor (`CUOTA_VENCIDA`,
  `fecha` a las 22:30 Arg del día anterior en UTC) y una calculada
  (evento dentro de los 14 días) aparecen juntas, sin duplicados,
  ordenadas por `orden`; la cuota se muestra "Ayer" y no "Hoy" (confirma
  que la conversión de timezone no corre el día); tocar cada una navega
  a su `ctaRuta` (`/pagos` y `/eventos/{id}` respectivamente) y marca
  leído: la de servidor via POST real al mock (confirmado con un
  contador de llamadas), la calculada via `localStorage`; ambas
  sobreviven un F5; "Marcar todas" llama una sola vez al POST masivo,
  marca las calculadas en `localStorage`, y el badge queda en 0; forzar
  un 500 en el mock al marcar la de servidor confirma el rollback
  (sigue sin leer, badge vuelve a 2). Sin errores de consola nuevos (los
  únicos 404 son de `cuenta-corriente`/`pagos`, que pide `Home.jsx` para
  `calcularAvisos()` — endpoints fuera del alcance de este mock, no una
  regresión de esta tarea).
- **Pendiente de probar contra el backend real, responsabilidad del
  compañero que armó el pedido** (no se hizo en esta sesión para no
  tocar datos reales sin que el usuario lo pida): disparar la cuota
  vencida real de Clara (el UPDATE SQL mencionado en el pedido) y un
  evento de prueba por Swagger, confirmar en `familia@demo.crear-academia.com`,
  y después limpiar con `DELETE /api/v1/eventos/{id}` y el segundo UPDATE
  que revierte la cuota.

### Decisiones pendientes (nuevas)

- **Migrar los 4 tipos calculados a `NotificacionService`** — pedido
  explícito para el compañero de backend. Hoy asistencia/apto
  físico/nota cargada/evento se calculan en el cliente porque el backend
  no los tiene; si se agregan al service del lado del servidor se
  elimina esta rama del todo y, de paso, se arregla la asimetría de
  estado de lectura (calculadas = por dispositivo vía `localStorage`,
  servidor = server-side de verdad) y la limitación ya documentada de
  "nota cargada" (usa la fecha del examen, no el momento real de carga
  de la nota — no existe ese dato todavía del lado del cliente, pero el
  backend sí sabe cuándo se guardó la calificación).
- **Texto de `CUOTA_VENCIDA` no calza con lo que la PWA puede hacer** —
  **resuelto en la Tarea O**: el `cuerpo` real del backend dice *"Ya
  corre el recargo por mora. Podés pagarla desde Pagos."* (verbatim,
  confirmado en `notificacion_service.py`) y, desde la Tarea O, Pagos
  sí ofrece pagar la cuota online — el texto ya no promete algo que la
  pantalla no hace. Se deja la entrada tal cual para que quede el
  rastro de por qué existía el desajuste.

## Tarea O — Pago online de cuotas (PR 2b): el botón "Pagar"

**Spec**: PR 2b del plan de `claude.ai` — conectar el botón "Pagar" de
Pagos.jsx (hasta acá `disabled`, con el tooltip "Integración de pago
pendiente") al backend real de `feat/pago-cuotas-portal` (branch
aparte de `crear-backend`, con los endpoints de orden de pago de
cuotas — no existen en `main` del backend todavía). Alcance: solo
cuotas. Vestuario y matrícula quedan afuera a propósito (tienen su
propio pago online pendiente, no es parte de este PR).

- **Paso 0 (leer antes de escribir)**: estados reales de `OrdenPago`
  (`backend/app/models/cobros.py`, `cobro_electronico_service.py`):
  `CREADA` (default, con `checkout_url`), `PAGADA`, `CONFLICTO`.
  `CONFLICTO` sale cuando Mercado Pago aprueba un pago pero la cuota ya
  estaba cerrada por otra vía (o el saldo bajó) — `imputado > debe` o
  `lectura.cerrado` — y queda para devolución manual de la academia
  (nunca se pisa nada ni se le "regala" el saldo a otra cuota). El GET
  `/portal/hijas/{id}/ordenes-pago/{id}` (`portal_service.orden_pago`)
  no es un GET tonto: si la orden sigue `CREADA` y tiene `mp_order_id`,
  le pregunta a Mercado Pago antes de contestar (mismo código que
  correría un webhook) — por eso alcanza con pollear este endpoint,
  sin túnel ni firma de webhook, tal como pedía el spec.
- `api/client.js`: `crearOrdenPagoCuota(alumnoId, cuotaId)` (POST, sin
  body — el email sale del perfil del lado del backend, no se manda
  acá) y `getOrdenPago(alumnoId, ordenId)` (GET). Ambas via
  `fetchConToken`, nada nuevo ahí. El shape de `OrdenPagoDeLaFamilia`
  es `{ id, estado, monto, importe, recargo, checkout_url }` — ojo que
  es `importe`, no `importe_cuota` (ese nombre es solo interno,
  `schemas/portal.py` lo expone distinto).
- `hooks/usePagoOnline.js` (nuevo): fases `idle | creando | resumen |
  esperando | pagado | sin_confirmar | conflicto | error`. Decisiones
  no obvias:
  - **Un solo flujo por alumna, no por cuota**: la clave de
    localStorage es `crear_orden_pendiente:<alumnoId>` (como pide el
    spec), así que si la familia arranca un pago para una cuota y
    después otro para otra, se pierde el rastro de la primera — alcance
    aceptado tal cual lo pide el spec, no es un bug.
  - **"Pagar" y "Retomar pago" llaman a la misma función**
    (`abrirPago`, que hace el POST): el backend ya es idempotente
    (`CobroElectronicoService.crear_enlace_de` devuelve la orden activa
    existente en vez de crear otra — confirmado con dos POST seguidos
    contra el backend real, mismo `id` de orden ambas veces), así que
    no hace falta un camino GET separado para "retomar". El label del
    botón (`cuotaPendienteId === cuota.id`) solo se actualiza si el
    POST salió bien — si `abrirPago` falla (409/422/502/503) el botón
    se queda diciendo "Pagar", no "Retomar pago" (bug que apareció y se
    corrigió en esta misma tarea: `cuotaId` se seteaba antes del
    `try`, no después del éxito).
  - **El polling es un `setInterval` de 5s con límite de 2 minutos**
    (`inicioRef`, se reinicia cada vez que arranca una espera nueva, no
    se persiste el tiempo transcurrido entre recargas de página — al
    reabrir Pagos con una orden pendiente se hace UNA consulta y, si
    sigue `CREADA`, se arranca una ventana de 2 minutos nueva, no la
    que quedaba).
  - **`visibilitychange`**: mientras `fase === 'esperando'`, al volver
    a la pestaña se dispara una consulta inmediata (típico volver de
    Mercado Pago desde el celular). Se resuscribe cada vez que cambia
    `orden` (barato, sin problema).
  - **Nunca se marca nada como pagado por una URL de retorno** — no
    hay ninguna (regla explícita del spec): todo pasa por la respuesta
    del GET, nunca por query params ni por el storage del tab que abrió
    Mercado Pago.
  - El `<a href={orden.checkout_url}>` no tiene `preventDefault` ni
    `window.open` — el `onClick` (`confirmarSalida`) solo arranca el
    polling, la navegación sigue su curso normal. Confirmado con
    Playwright que al clickear se abre una pestaña nueva de verdad
    (evento `popup`) con la URL real de Mercado Pago y la pestaña
    original pasa a "esperando" sin que nada la bloquee.
- `hooks/useCargos.js`: `recargar()` ahora devuelve los datos frescos
  (no solo actualiza el estado) — el flujo de pago necesita leer el
  pago recién acreditado en el mismo tick en que se resuelve, no en el
  próximo render.
- `hooks/useNotificaciones.js`: se extrajo la carga a `cargarTodo` (ya
  estaba toda en el `useEffect`) y se expone como `recargar()` — sin
  tocar `cargando`, para que la campana se actualice sola al acreditarse
  un pago sin tapar la pantalla con el Skeleton de la carga inicial.
- `Pagos.jsx`: pasó de mostrar un solo "próximo cargo pendiente" a una
  tarjeta por cada cuota de `cuotas_pendientes` (pedido explícito del
  spec: "un botón Pagar en cada cuota pendiente", no en la más
  próxima nada más). La hoja de confirmación/estado es un único
  `Modal` cuyo contenido cambia según `fase` — nada de `window.open`
  en el botón principal, es un `<a target="_blank">` con las clases de
  `Button` copiadas a mano (`Button.jsx` solo sabe renderizar
  `<button>`, no soporta polimorfismo). Maneja los errores del spec:
  409 → toast + recarga silenciosa de la lista + cierra la hoja (no
  hay nada que explicarle a la familia, la cuota ya estaba saldada);
  422 (`ERR_EMAIL_REQUERIDO`) → mensaje del backend + link a Perfil;
  502/503 → mensaje del backend tal cual, sin intentar mejorarlo.
  **Bug encontrado y corregido durante la prueba manual**: la fase
  `'pagado'` no tiene ninguna vista propia en el Modal (se resuelve con
  un efecto que recarga, muestra el toast y abre `ComprobanteModal`),
  pero al principio nada cerraba la hoja de `usePagoOnline` — quedaba
  una hoja "Pagar cuota" vacía apilada atrás del comprobante. Se arregló
  moviendo la lógica de "pagado" (y la de 409) a dos `useEffect` en
  `Pagos.jsx` que, además de recargar/tostar, llaman a `cerrarHoja()`.
- `AuthContext.jsx`: `logout()` ahora también recorre
  `Object.keys(localStorage)` buscando el prefijo
  `crear_orden_pendiente:` — la lista fija de claves que ya borraba no
  alcanza porque esta clave lleva el id de la alumna adentro.
- **Probado contra el backend real** (`crear-backend` en
  `feat/pago-cuotas-portal`, Docker Compose local, con el
  `MP_ACCESS_TOKEN` de prueba que ya estaba en `backend/.env`) con
  Playwright headless (`chromium-cli` no está instalado en este
  entorno; se usó `playwright` directo vía `npx`, mismo patrón) contra
  `familia@demo.crear-academia.com`:
  - Crear la orden, ver el desglose (sin fila de recargo porque
    `recargo_mercadopago_pct` está en 0 en la config de esta base),
    tocar "Ir a Mercado Pago": se abre una pestaña nueva con la URL
    real de Mercado Pago (confirmado que es la misma orden que un POST
    repetido por `curl` — reutilización confirmada de punta a punta,
    no solo a nivel de API).
  - Recargar la página en plena espera (simula cerrar/reabrir la PWA):
    reanuda la fase `esperando` sin perder la orden.
  - Flujo "pagado" y flujo "conflicto": **no se pudo completar un pago
    real en el checkout de Mercado Pago desde este entorno** (hace
    falta un comprador de prueba con usuario/clave propios del panel
    de Mercado Pago del compañero, y no hay forma de manejar un
    navegador real no-headless acá) — se verificó en cambio corriendo
    el código real de acreditación (`CobroElectronicoService.
    acreditar_notificacion`, el mismo que correría un webhook o el GET
    de polling) con un script que solo mockea la respuesta HTTP de
    `MercadoPagoAdapter.obtener_orden` (nunca se tocó la base a mano
    con UPDATE/INSERT directos). Con un pago "aprobado" simulado: la
    cuota pasa a PAGADA, se genera comprobante y pago reales, y la PWA
    (ya cargada, con la orden guardada en localStorage) lo detecta solo
    y muestra toast + comprobante + limpia el pendiente. Con la cuota
    cerrada por otra vía primero (cobro real en efectivo vía
    `POST /cobros/mostrador` como secretaria) y la misma simulación de
    pago aprobado: la orden pasa a CONFLICTO y la PWA muestra el
    mensaje de devolución manual. Sin errores de consola en ningún
    caso.
  - Se regeneró `demo cargar` dos veces (antes y después de probar,
    para no dejar cuotas de Constanza/Josefina pagadas de prueba) — la
    contraseña demo cambia en cada corrida, no quedó anotada en ningún
    lado a propósito (es la contraseña de un entorno de desarrollo
    local, no un secreto que vaya a un archivo).
- **Pendiente, responsabilidad de quien corra la prueba manual
  completa** (no se pudo hacer desde este entorno sin navegador
  interactivo ni comprador de prueba propio): el paso del spec que pide
  pagar de verdad en el checkout de Mercado Pago en incógnito con el
  comprador de prueba, confirmar que la campana avisa con la
  notificación real del backend (`PAGO_RECIBIDO`, no simulada), y los
  dos casos de UI que necesitan una cuota pendiente real y vigente para
  reproducir con un click real en vez de localStorage inyectado a mano:
  409 (tocar "Pagar" sobre una cuota que se saldó mientras la lista
  estaba abierta) y 422 (perfil sin email). La lógica de estos tres
  casos se confirmó por lectura de código y, 409, contra el backend
  real por `curl` — no en la UI en vivo.

### Tarea O.1 — Saldo con mora tras pagar, y aviso de vencimiento próximo

Ajuste pedido después de la Tarea O, mismo PR: cubrir el caso en que la
mora sigue corriendo entre crear la orden y que Mercado Pago acredita
el pago — el `monto` de la orden quedó congelado en el momento de
crearla, pero la cuota puede deber más para cuando se acredita.

- **`usePagoOnline.js`**: la fase `'pagado'` dejó de existir — nunca
  tuvo vista propia (la resolvía un efecto en `Pagos.jsx` que encima
  había que acordarse de cerrar, bug de la Tarea O). Ahora, al resolver
  `PAGADA`, el hook llama a `onPagado(cuotaId, orden)` y vuelve directo
  a `'idle'`: `Pagos.jsx` decide con esos dos datos qué mostrar, sin
  ningún estado intermedio que cerrar. El `cuotaId` que le llega a
  `onPagado` no puede salir del estado `cuotaId` del hook tal cual
  (los closures de `consultar`/`iniciarPolling` no lo llevan en sus
  deps y pueden estar viejos) — se agregó `cuotaIdRef`, un espejo del
  estado que se lee en el momento exacto de la resolución, antes de
  limpiarlo.
- **`Pagos.jsx`, `onPagado`**: recarga `cuentaCorriente` + `pagos`,
  busca la cuota recién pagada en la lista fresca de pendientes por
  `id` y mira su `saldo_pendiente`. Si es `0` (el caso normal): toast
  de éxito de siempre. Si es `> 0`: toast *"Recibimos tu pago de $X.
  Quedó un saldo de $Y"*, con *" por recargo por mora"* agregado al
  final solo si `recargo_mora` de la cuota fresca es `> 0` — pedido
  explícito aparte: la cuota puede quedar con saldo sin que haya mora
  todavía (una `PENDIENTE` recién cruzó a `PAGO_PARCIAL` porque el pago
  no alcanzó), y ahí no hay que inventarle una razón que no es. `$X` es
  `orden.monto` (lo que la familia pagó de verdad en Mercado Pago, no
  lo que "debería" haber sido) y `$Y` el `saldo_pendiente` fresco. La
  cuota vuelve a aparecer en la lista de pendientes sola (ya sale así
  de `cuentaCorriente`), con botón "Pagar" normal — no "Retomar pago":
  no se guarda ninguna orden pendiente nueva para ese resto, el
  `cuotaId` del hook ya se limpió al resolver. El comprobante se sigue
  mostrando en los dos casos (el pago parcial también generó un pago y
  un comprobante reales).
- **Verificado contra el backend real** simulando una acreditación
  parcial con el mismo mecanismo de la Tarea O (mockear solo
  `MercadoPagoAdapter.obtener_orden` para que el "monto aprobado" sea
  menor al saldo real de la cuota en ese momento — mismo efecto que si
  la mora hubiera subido el total entre crear la orden y acreditar, sin
  tocar la base a mano). Dos casos a propósito: una cuota `EN_MORA`
  (`recargo_mora` ya en `1000`) y una `PENDIENTE` (`recargo_mora` en
  `0`) — confirmado que el toast dice "...por recargo por mora" solo en
  la primera. En ambos casos la orden queda `PAGADA`, la cuota
  `PAGO_PARCIAL` con saldo, y el botón vuelve a decir "Pagar". Sin
  errores de consola.
- **`diasHasta(fechaISO)`** (nuevo, en `utils/format.js`): días de
  calendario entre hoy (local, vía `hoyLocalISO()`) y una fecha,
  negativo si ya pasó — mismo patrón anti-UTC que el resto del
  archivo, nada de `.toISOString()` directo.
- **Hoja de confirmación**: si `diasHasta(cuota.fecha_vencimiento)`
  está entre 0 y 3 (inclusive) se agrega *"Si el pago se acredita
  después del vencimiento, se suma el recargo por mora"*. A propósito
  **no** se muestra para cuotas ya vencidas (`EN_MORA`, días negativos)
  — el pedido decía explícitamente "los próximos 3 días", no "vencidas
  o por vencer", y la instrucción fue no inventar reglas más
  específicas. Verificado con Playwright contra dos cuotas reales del
  backend: una vencida en diciembre de 2025 (sin aviso) y una que vence
  en 3 días (con aviso).

## Tarea P — Pago online de vestuario + generalizar usePagoOnline

**Spec**: mismo botón "Pagar" que cuotas (Tarea O), ahora para cada cuota
de vestuario, reusando el mecanismo entero (hoja, polling de 5s/2min,
estados) en vez de duplicarlo. Solo front — el backend (`feat/pago-
vestuario-portal`) ya estaba mergeado a `main` de `crear-backend` cuando
arrancó esta tarea (confirmado con el openapi.json real antes de tocar
nada: `POST /portal/hijas/{id}/vestuario/{cargo_id}/orden-pago` ya
existía, igual que el `GET /ordenes-pago/{id}` genérico de la Tarea O —
no hizo falta tocar una rama aparte del backend).

- **Paso 0**: `CuotaVestuarioDeLaFamilia.id` **es** el `cargo_id` de la
  URL (confirmado leyendo `schemas/portal.py`, con un comentario del
  propio backend que lo dice explícito). `ConceptoVestuario` (
  `conceptos_cobro.py`) no exige pagar las cuotas del traje en orden —
  mismo criterio que mostrador — y cada orden es por el saldo completo
  de UN cargo, nunca junta varios. Error 409 real: `ERR_CARGO_PAGADO`
  (`"Esta cuota de vestuario ya está pagada."`); 404 real:
  `ERR_NO_ENCONTRADO` (genérico, no específico de vestuario) — por eso
  el texto que ve la familia ("No pudimos encontrar esta cuota") lo pone
  el front, no viene del backend como en 502/503.
- **`usePagoOnline.js` generalizado**: ahora recibe `(alumnoId, tipo,
  crearOrden, onPagado)` en vez de tener `crearOrdenPagoCuota` fijo
  adentro. La clave de localStorage pasó de
  `crear_orden_pendiente:<alumnoId>` (una sola por alumna, para
  cualquier cuota) a `crear_orden_pendiente:<alumnoId>:<tipo>:<conceptoId>`
  — **un slot por concepto**, no uno solo por alumna. Esto en los
  hechos también mejora cuotas (antes, abrir el pago de una segunda
  cuota antes de terminar la primera le hacía perder el rastro a la
  primera — limitación que quedó documentada como aceptada en la Tarea
  O); ahora cada cuota, de cualquiera de los dos tipos, tiene su propio
  slot independiente y ninguna pisa a la otra.
  - **Solo puede haber UNA hoja activa a la vez** (un `fase`/`orden`
    por instancia del hook — es lo único que el usuario puede estar
    mirando), aunque haya varias órdenes pendientes en simultáneo: las
    demás viven en un nuevo `pendientes` (`Set` de conceptoId) que
    controla el label de cada botón ("Pagar" vs "Retomar pago") sin
    pollearlas en segundo plano. `abrirPago` frena cualquier polling
    activo antes de arrancar uno nuevo (no pueden correr dos
    `setInterval` del mismo hook pisándose el `fase` uno al otro).
  - **Al montar**: escanea TODAS las claves `crear_orden_pendiente:
    <alumnoId>:<tipo>:*` (no una sola fija), llena `pendientes` de
    una (síncrono, antes de cualquier request — los botones ya
    arrancan bien sin esperar red) y después consulta cada una una
    vez. La primera que siga `CREADA` pasa a ser el flujo activo y
    arranca su espera; las que ya se resolvieron (`PAGADA`/
    `CONFLICTO`) se limpian y disparan `onPagado` igual, aunque nadie
    las esté mirando.
  - `conceptoId` (antes `cuotaId`) ya no controla el label del botón
    (eso lo hace `pendientes` ahora) — se puede setear apenas se llama
    `abrirPago`, incluso antes de saber si el POST sale bien, porque ya
    no hay riesgo de que un fallo deje "Retomar pago" pegado en un
    botón que no tiene ninguna orden real atrás.
- **`api/client.js`**: `crearOrdenPagoVestuario(alumnoId, cargoId)`
  (POST). `getOrdenPago` no cambió — ya era genérico (la URL solo
  necesita el id de la orden).
- **`components/PagoOnlineHoja.jsx`** (nuevo): la hoja de confirmación,
  la espera y el mapeo de errores "no silenciosos" (422 con link a
  Perfil, 502/503 con el mensaje tal cual del backend, fallback
  genérico) quedaron acá, compartidos por `Pagos.jsx` y `Vestuario.jsx`.
  Los errores silenciosos (409/404 en vestuario, 409 en cuotas) **no**
  llegan a este componente: cada página los intercepta antes con su
  propio `useEffect` (toast + recarga + `cerrarHoja()`) y nunca deja
  que `abierta` sea `true` para esos casos — el componente no sabe nada
  de 409 ni 404 a propósito. Dos textos quedaron parametrizados porque
  diferían entre pantallas sin ser errores: `concepto` (el label de la
  primera fila del desglose — `"Importe de la cuota"` en Pagos.jsx, el
  `cuota.concepto` real del backend en Vestuario.jsx, ej. *"Tutú
  romántico y malla · Apertura - cuota 3/3"*) y `nombrePantalla` (el
  texto de "sin_confirmar" decía literal "Pagos", hacía falta poder
  decir "Vestuario" ahí). El resto del texto (incluida la aclaración
  "Se paga el saldo completo de la cuota en un solo pago.") se dejó
  idéntico a propósito, sin volverlo genérico, porque el pedido exigía
  que `Pagos.jsx` quedara sin cambios visibles.
- **`Pagos.jsx`**: reescrito para usar la hoja y el hook genéricos, sin
  ningún cambio de texto ni de comportamiento visible (verificado
  comparando contra la versión de la Tarea O). De paso quedó expuesto
  (no introducido acá) un bug previo a toda esta serie de tareas:
  `pendienteTotal === 0` nunca daba `true` porque
  `cuenta_corriente.total_exigible` llega del backend como **string**
  (`"0"`, no `0` — Decimal serializado por Pydantic), así que el
  `EmptyState` "¡Estás al día!" jamás se mostraba con una familia sin
  deuda; en su lugar se veía un hueco vacío entre el resumen y el
  historial. Confirmado con `git show` que ya estaba así desde antes
  del primer commit de esta serie de tareas (nada que ver con el PR de
  pago online). Se corrigió la condición a `cuotasPendientes.length ===
  0` (un array, inmune al problema de tipo) por ser un cambio de una
  línea, obviamente correcto, en un archivo que esta tarea ya estaba
  tocando — no se tocó nada más fuera de este archivo por el mismo
  motivo.
- **`hooks/useVestuario.js`**: ahora expone `recargar()` igual que
  `useCargos` (devuelve los datos frescos, no solo actualiza el
  estado — el flujo de pago necesita leer la cuenta recién acreditada
  en el mismo tick en que se resuelve).
- **`Vestuario.jsx`**: un botón por cuota con `saldo_pendiente > 0` y
  `estado !== 'PAGADO'` (las ya pagadas no tienen botón, como pedía el
  spec). `onPagado` recarga vestuario, busca la cuenta que contiene el
  cargo pagado y decide el toast en este orden: si la cuenta quedó
  `listo_para_entrega`, el mensaje de "completo y listo para entrega"
  (gana porque implica que la cuota también quedó en saldo 0, los dos
  casos nunca se solapan en la práctica); si no, y la cuota todavía
  tiene saldo, el de "Quedó un saldo de $Y" **sin mencionar mora en
  ningún caso** (vestuario no tiene recargo por mora — por eso tampoco
  hay ningún `aviso` en su `<PagoOnlineHoja>`, a diferencia de
  Pagos.jsx); si no, el éxito simple de siempre. El comprobante se
  arma buscando el pago más nuevo entre **todos** los `.pagos` de
  **todas** las cuentas (`cuentasFrescas.flatMap(c => c.pagos)`, no
  hay un endpoint de pagos aparte como en cuotas). **A propósito no se
  tocó** la lista de "Pagos" existente (solo botón de descarga, sin
  abrir comprobante al tocar la fila): no estaba pedido y ya hacía algo
  — se había agregado sin querer en un primer borrador y se revirtió
  antes de probar nada.
- **Verificado contra el backend real** (branch `main` de
  `crear-backend`, ya con ambos merges, Docker local, contraseña demo
  vigente dada por el usuario — no generada por mí, no se corrió
  `demo cargar`/`demo borrar` en esta tarea) con Playwright headless
  (`npx playwright`, `chromium-cli` sigue sin estar instalado acá):
  - Crear la orden de un cargo de vestuario, reutilización con un POST
    repetido por `curl` (mismo `id` de orden), desglose de la hoja
    mostrando el `concepto` real del cargo, clic en "Ir a Mercado
    Pago" abriendo una pestaña nueva de verdad con la URL real
    (evento `popup` de Playwright) sin bloquear la navegación,
    "esperando" con su botón, y reanudación tras recargar la página a
    mitad de espera (confirmado con `waitForSelector` explícito — un
    primer intento con un `waitForTimeout` fijo de 2s dio un falso
    negativo por timing, no era un bug real).
  - **Dos órdenes pendientes a la vez sin pisarse**: se crearon por
    `curl` órdenes reales para dos cargos distintos de la misma alumna
    (cuota 2/3 y 3/3 de vestuario) y se inyectaron ambas claves de
    localStorage; la pantalla mostró los dos botones "Retomar pago" a
    la vez, cada uno reusando su propia orden al tocarlo (confirmado
    por el `order_id` del `href` de cada uno), y las dos claves de
    localStorage sobrevivieron intactas. **No se pudo probar esta
    combinación específica con una cuota regular + una de vestuario**
    (ver limitación de abajo) — se probó en cambio con dos cuotas de
    vestuario distintas, que ejercita exactamente la misma lógica de
    namespacing por `conceptoId` (el `tipo` es un segmento más de la
    misma clave, no hay ninguna rama de código que trate "cuota" y
    "vestuario" distinto en este punto).
  - 409 y 404 contra el backend real por `curl` (sin simular nada):
    `ERR_CARGO_PAGADO` y `ERR_NO_ENCONTRADO` confirmados tal cual se
    documentan arriba.
  - Logout: se inyectaron claves `crear_orden_pendiente:` de ambos
    tipos (`cuota` y `vestuario`, con alumnoId falso) más
    `crear_notifs_leidas`, se cerró sesión desde Perfil, y las 8+
    claves `crear_*` quedaron en cero.
  - **Regresión de cuotas: validada por código compartido, NO por un
    ciclo completo en vivo.** Las 3 hijas de la única familia de login
    de prueba (`familia@demo`) ya tenían todas sus cuotas pagas de
    tareas anteriores. La vía para reabrir una (anular un pago) está
    reservada al rol `directora`, y esa cuenta
    (`direccion@creardanza.com.ar`) no es una de las que arma `demo
    cargar` — no es descartable ni tengo su contraseña. Se le avisó al
    usuario (dos idas y vueltas: primero se intentó anular como
    secretaria y lo bloqueó el clasificador de auto-modo como "Modify
    Shared Resources"; reintentado con permiso explícito, lo bloqueó
    el backend mismo por rol) y decidió seguir sin ese ciclo en vivo
    en vez de tocar la cuenta de dirección. Lo que sí queda probado:
    `usePagoOnline` es el mismo código para los dos tipos (no hay
    ninguna rama `if (tipo === 'cuota')` en todo el hook), así que
    todo lo verificado en vivo para vestuario (creación, reuso,
    reanudación, no-colisión, polling, apertura de Mercado Pago) corre
    igual para cuotas; lo que es específico de `Pagos.jsx` (el mensaje
    de saldo con mora, el aviso de vencimiento) no se tocó en esta
    tarea y se probó en la Tarea O.1. `npm run lint` y `npm run build`
    limpios.
- **Decisión pendiente (nueva)**: si en algún momento hace falta probar
  algo que requiera rol `directora` (anular pagos, generar cuotas
  masivas) contra el entorno de desarrollo local, la cuenta real
  (`direccion@creardanza.com.ar`) no tiene contraseña de prueba
  conocida ni la regenera `demo cargar` — conseguir una vía de prueba
  para ese rol (o aceptar que esas pruebas quedan fuera de alcance) es
  una conversación aparte con el compañero de backend.

## Tarea Q — Mis entradas con QR (reemplaza el mock) + página pública /entrada/:codigo

**Spec**: primera fase real del módulo de entradas — reemplazar el mock
de `MisEntradas.jsx` por datos reales (`GET /portal/entradas`, backend en
`feat/entradas-portal-lectura`, ya mergeado en el momento de esta tarea)
y agregar la página pública que abre el QR de cada entrada
(`GET /entradas/publica/{codigo}`, sin sesión). Elegir y cambiar
butacas, pago online y devoluciones quedan para fases siguientes — nada
de eso se tocó.

- **Paso 0**: `MapaButacas.jsx`, `ResumenCompra.jsx`, `VestuarioEvento.jsx`,
  `EventoButacas.jsx`, `useEvento.js`, `useMisEntradas.js` y
  `Shell.jsx` **no se tocaron** — siguen sirviendo al flujo mock viejo
  (`misEntradasApi` vía `useOutletContext()`), que esta tarea no
  reemplaza todavía. La nueva `MisEntradas.jsx` usa su propio
  `useEntradas()`, sin pasar por ese contexto.
  - `fetchConToken` (api/client.js) renueva sesión y redirige a `/login`
    en un 401 — la página pública no puede pasar por ahí (nadie que
    escanea un QR en la puerta tiene sesión): `getEntradaPublica()` usa
    `fetch` directo, sin `Authorization`, y trata un 404 como resultado
    válido (`return null`), no como error.
  - **`EntradaDeLaCompra` (lo que devuelve `/portal/entradas`) NO trae
    los "seis números"** (`codigo_corto`) — ese campo solo está en
    `EntradaPublica` (lo que devuelve `/entradas/publica/{codigo}`,
    confirmado leyendo los dos schemas). Por eso `codigo_corto` se
    muestra en la página pública (`EntradaPublica.jsx`) pero no en
    `MisEntradas.jsx` ni en el PNG descargado: ahí no hay forma de
    tenerlo sin recalcularlo a mano (`sha256(codigo) % 1_000_000`,
    lógica del backend que no correspondía duplicar en el front).
  - `entradas` viene **vacío** mientras la compra no esté `PAGADA` (lo
    arma así el propio backend, `compras_de_familias` en
    `compras_entradas_service.py`) — aunque `cantidad` sea mayor a
    cero. `ANULADA` queda filtrada antes de llegar al portal (nunca se
    ve desde acá) — se dejó el label igual por si el filtro cambia.
- **QR: se eligió `uqr`** (instalado con `--save-exact`, queda
  `"uqr": "0.1.3"` pelado en `package.json`, sin rango). Motivos:
  cero dependencias de runtime, sin `postinstall`/`preinstall` ni
  `gypfile` (nada de binarios — el pedido lo marcaba explícito, hubo un
  problema antes con un paquete así), MIT, 79 KB sin comprimir / 8
  archivos, publicado hace ~6 meses por `antfu`/`pi0` (unjs). Se
  descartaron: `qrcode` (depende de `pngjs`/`yargs`/`dijkstrajs`, viola
  "sin dependencias de runtime"), `qr-code-styling` (depende de
  `qrcode-generator` + build con webpack, pensado para estilizar, de
  más para esto), `qrcode-svg` (cero deps también, pero sin
  publicaciones desde 2022). `qrcode-generator` (el clásico de
  kazuhikoarase) era la otra opción razonable — se prefirió `uqr` por
  más chico y con `encode()` devolviendo directo una matriz 2D de
  booleanos, que es lo que hacía falta para dibujar a mano en un
  canvas (ver abajo) sin pasar por SVG.
- **`utils/qr.js`** (nuevo): `dibujarQR(ctx, texto, x, y, tamano)`
  dibuja la matriz de `uqr.encode()` módulo por módulo directo en un
  `<canvas>` — nunca `currentColor`, nunca SVG con CSS: así el QR queda
  negro sobre blanco con margen blanco (4 módulos, el mínimo del
  estándar ISO/IEC 18004) pase lo que pase con el tema, tal como pedía
  el spec. Una sola implementación, la usan tanto `<QRCode/>` en
  pantalla como la descarga en PNG. `urlEntrada(codigo)` arma el texto
  del QR: `${VITE_PUBLIC_URL || window.location.origin}/entrada/${codigo}`
  — documentada en `.env.example` y en el README (sin definir, al
  escanear desde el celular de otra persona en producción abriría
  `localhost` si el build no la fija).
- **`components/QRCode.jsx`**: no guarda nada — dibuja de nuevo en el
  `<canvas>` cada vez que se monta o cambia el texto, nada de caché ni
  de archivo intermedio (coherente con no guardar datos de entradas en
  ningún lado, ítem 8 del pedido).
- **`utils/descargarEntrada.js`**: compone evento + función + sala +
  butaca + el QR grande en un `<canvas>` nuevo (medido en dos pasadas:
  una para saber cuántas líneas ocupa el título del evento sin dibujar
  nada todavía, porque cambiar `canvas.width`/`height` resetea el
  contexto incluida la fuente; después, ya con el alto final, se dibuja
  todo de una) y lo baja como PNG (`canvas.toBlob` + `<a download>` +
  `URL.revokeObjectURL`). Nombre de archivo: `slug()` saca tildes con
  `normalize('NFD')` + regex (no un mapa de reemplazos a mano) y pasa
  todo a minúsculas, ej. `entrada-festival-de-fin-de-ano-2026-fila-c-butaca-7.png`.
- **`MisEntradas.jsx`** (reescrita por completo — el mock queda en el
  historial de git, no en el repo): agrupa por `funcion?.fecha ??
  evento.fecha` contra `hoyLocalISO()` en Próximas/Pasadas. Por cada
  cuota de `entradas`, en este orden: `usada` → "ya ingresó", sin QR;
  `compra.estado === 'ANULADA'` → sin QR (caso muerto hoy, ver Paso 0);
  sin `codigo`/`butaca` → sin QR, con `motivo_bloqueo` si vino, o un
  texto genérico ("Todavía no se eligieron las butacas.") si vino
  `null` (pasa cuando `puede_elegir_butacas` es `true` pero todavía no
  se eligió nada — el backend no manda un motivo para ese caso, no hay
  nada que explicar todavía); si no, QR + "Fila X · Butaca N" +
  "Descargar entrada". Los cargos se listan siempre (número,
  vencimiento, estado, importe) con "El pago se registra en la
  academia." abajo — sin botón de pagar, a propósito. `entradas` vacío
  (compra no `PAGADA` todavía) no renderiza la sección, se ve solo la
  de cargos. Fechas e importes: `formatFecha`/`formatMoneda`/
  `formatHora` (nueva en `utils/format.js`, recorte de string sobre
  `'HH:MM:SS'`, no `Date` — una hora sola no tiene zona horaria que
  corregir) existentes; nada de `.toISOString()` (bloqueado por el
  lint de todos modos).
- **`EntradaPublica.jsx`** (nueva): ruta `/entrada/:codigo`, agregada
  en `App.jsx` **fuera** de `RequireRole` y fuera del `<Route
  element={<AlumnoActivoProvider>...}>` — sin pedir token, sin Shell
  (sin Header/BottomNav), con su propio layout standalone. Muestra
  evento, función, sala, dirección (link a Google Maps con
  `rel="noopener noreferrer"` y `target="_blank"` — el código viaja en
  la URL del QR, no en la de Maps, así que no hay nada ahí para
  filtrar, pero el `rel` va igual por buena práctica con cualquier link
  externo), butaca(s), "para", programa e información general, más el
  `codigo_corto` al pie (las "seis números" para la puerta). 404 o
  error de red: mismo mensaje, "Esta entrada no existe o fue devuelta."
  No muestra ningún QR — sería el QR de la página a la que el QR ya te
  trajo, no tiene sentido.
- **`Eventos.jsx`**: tarjeta "Mis entradas" agregada antes de la de
  Vestuario, mismo componente/estilo (ícono + título + bajada +
  chevron). Vestuario también pasó a vivir dentro del mismo `<div
  className="space-y-3">` (antes solo tenía margen propio) para que las
  dos tarjetas queden con el mismo espaciado entre sí y con la
  cartelera de abajo.
- **Logout**: no se tocó `AuthContext.jsx` — ningún dato de entradas se
  guarda en ningún lado (ni localStorage ni nada), así que no hay nada
  que limpiar. Confirmado con Playwright: después de navegar Mis
  entradas y la página pública, las claves `crear_*` de localStorage
  son las mismas que ya ponía el login (ninguna nueva).
- **De paso**: `.env.example` tenía un `;` colgado al final de
  `VITE_API_URL` (`http://localhost:8000;`) sin salto de línea — un
  typo preexistente, no introducido acá, pero se corrigió al agregar
  `VITE_PUBLIC_URL` en el mismo archivo para no dejarlo al lado de un
  ejemplo roto.
- **Verificado contra el backend real** (`crear-backend` en
  `feat/entradas-portal-lectura`, contraseña demo vigente dada por el
  usuario — no generada por mí, no se corrió `demo cargar`/`demo
  borrar`) con Playwright headless:
  - `GET /portal/entradas` con `familia@demo`: una compra real
    (Festival de fin de año 2026, `PAGADA`, función real, 1 cargo
    `PAGADO`, 2 entradas sin butaca todavía con `motivo_bloqueo: null`)
    — se ve en "Próximas" con el texto genérico de "sin butaca", tal
    cual lo devuelve el backend, sin simular nada.
  - Página pública con un código real **con butaca** (de otra familia
    del mismo evento, encontrado por el panel de admin, nunca se tocó
    ni se mutó nada): evento, función, sala, dirección con el link a
    Maps (`rel="noopener noreferrer"`, `target="_blank"` confirmados),
    butaca, programa, información y `codigo_corto` — todo tal cual
    responde el backend. 404 real con un código inventado:
    "Esta entrada no existe o fue devuelta."
  - Sin sesión: confirmado `localStorage.getItem('crear_access') ===
    null` en el contexto de browser que abrió la página pública (nunca
    hizo login).
  - `npm run lint` y `npm run build` limpios. Bundle: 274.30 kB → 294.64
    kB (+20.34 kB sin comprimir; gzip 83.00 kB → 89.64 kB, +6.64 kB) —
    la differencia es `uqr` + las páginas/componentes nuevos.
  - **Simulado (interceptando la respuesta de `/portal/entradas` con
    `page.route`, aclarado acá porque la vez pasada no había quedado
    claro qué era real y qué no)**: la familia de prueba real no tiene
    ninguna entrada con butaca asignada todavía (para no asignarle una
    de verdad — eso es `EventoButacas.jsx`, fase que esta tarea no
    toca), así que el caso "con código" (QR + Fila/Butaca + descarga)
    se probó con una respuesta fabricada con esa forma exacta. Se
    confirmó ahí: el botón "Descargar entrada" baja un PNG real (34 KB,
    nombre de archivo correcto, sin tildes), con el QR, evento, función
    y butaca dibujados. También por este camino (nada de esto existe
    hoy en los datos reales de la familia de prueba): una entrada
    `usada` ("ya ingresó", sin botón de descarga para ella), una compra
    `PENDIENTE` sin función todavía (mensaje correspondiente, sin
    entradas listadas, cargos con estado `PENDIENTE`), y el
    agrupamiento en "Pasadas" con una función de fecha anterior a hoy.
    Lista vacía y error de red (500 forzado) también se probaron así:
    los dos textos exactos que pedía el spec.
  - **No verificado con una herramienta de decodificación de QR real**
    (no hay `pyzbar`/`opencv`/similar disponible en este entorno, y no
    se instaló nada nuevo para esto) — se confirmó visualmente que el
    QR dibujado tiene los tres patrones de localización en las
    esquinas y el margen blanco correctos, y se confía en que
    `uqr.encode()` arma la matriz bien (librería madura, no es código
    propio). Si hace falta una garantía más fuerte, escanearlo con el
    celular es la prueba que falta.

## Tarea R — Elegir y cambiar butacas (reemplaza el flujo mock de compra)

**Spec**: segunda fase del módulo de entradas — elegir butacas de una
compra ya paga (`PUT /portal/entradas/{id}/butacas`) y cambiarlas una vez
(`POST /portal/entradas/{id}/cambio-butacas`), con el plano real de la
sala (`GET /portal/entradas/{id}/plano`). Backend en `main`, ya mergeado.
Pago online de entradas y devoluciones quedan para después.

- **Paso 0, backend (solo lectura)**: `ButacaDelPlano.fila_orden` es "de
  adelante hacia atrás, como se definió la sala" (docstring propio del
  backend) — confirmado con la sala real de la demo (Teatro la Brújula,
  190 butacas): fila A es `fila_orden 0` con el mayor ancho (20 asientos),
  achicándose hacia atrás hasta `SR` (silla de ruedas) en el fondo,
  `fila_orden 11`. `col` va de -11 a 11, con -8/0/8 siempre vacíos
  (pasillos) — esa orientación (escenario arriba, `fila_orden`
  creciendo hacia abajo) tiene sentido con esos datos reales, no hizo
  falta avisar nada raro. `ocupadas`/`propias` son arrays de UUID de
  butaca (`ButacaDelPlano.id`), no de fila+número.
  - `PUT /butacas` devuelve la compra ya actualizada, mismo shape que un
    ítem de `GET /portal/entradas` (`CompraEntradasDeLaFamilia`).
    `POST /cambio-butacas` devuelve lo mismo más `aviso: str` (el texto
    del backend sobre que el QR no cambia) — no se usó ese `aviso`
    directo en ningún lado: los textos que pedía el spec para la hoja ya
    estaban escritos a mano, y coinciden en el fondo.
  - Códigos de error reales (confirmados leyendo
    `compras_entradas_service.py` y los tests, no asumidos):
    `ERR_COMPRA_SIN_PAGAR`, `ERR_YA_TIENE_BUTACAS`,
    `ERR_FAMILIA_CON_DEUDA`, `ERR_BUTACA_OCUPADA`,
    `ERR_SIN_BUTACAS` (cambiar sin haber elegido antes),
    `ERR_ENTRADA_USADA`, `ERR_EVENTO_PASADO`,
    `ERR_CAMBIO_BUTACAS_AGOTADO` — todos **409** (el default de `_error()`
    en ese archivo). `ERR_BUTACA_REPETIDA`, `ERR_CANTIDAD_BUTACAS`,
    `ERR_BUTACA_AJENA`, `ERR_SIN_FUNCION` son **422** (los únicos que
    pisan el default).
  - **Pedir cambiar a las mismas butacas que ya tiene SÍ gasta el
    cambio** — confirmado leyendo `cambiar_butacas`/
    `cambiar_butacas_portal`: no hay ningún chequeo de "¿es igual a lo
    que ya tenía?" en ningún lado del backend, `cambios_butacas_portal`
    se incrementa siempre que la llamada no tire error. Por eso el botón
    "Confirmar" se deshabilita del lado del front cuando la selección es
    idéntica a la actual en modo cambiar (item 4 del pedido) — es la
    única protección que existe contra desperdiciar el único cambio.
- **`api/client.js`**: `getPlano(compraId)` con `cache: 'no-store'` a
  propósito — sin reserva temporal del lado del backend, un plano
  cacheado mostraría libre una butaca que otra familia ya confirmó.
  Confirmado que nada más cachea esto: `vite.config.js` no tiene
  `runtimeCaching` (el service worker solo precachea el app shell,
  `navigateFallbackDenylist` ya excluía `/api/`). `elegirButacas` y
  `cambiarButacas` mandan `{butaca_ids: [...]}`.
- **`hooks/usePlano.js`**: mismo patrón que los demás hooks de este
  repo (`cargando`/`error`/`recargar`), más un `visibilitychange` que
  vuelve a pedir el plano al volver a la pestaña — es la única defensa
  real contra elegir algo que se vendió mientras la familia miraba otra
  cosa (no hay reserva temporal).
- **`components/MapaButacas.jsx` reescrito por completo** (ver Tarea R.1
  más abajo por qué no se podía dejar el de antes funcionando para los
  dos flujos a la vez). Grilla CSS con `fila_orden`→fila,
  `col - colMin`→columna (los huecos de `col` quedan como huecos reales
  en el grid, son los pasillos). Barra "Escenario" en la fila 1, antes
  de `fila_orden 0`. Etiqueta de fila y el texto de "Escenario" van
  `position: sticky; left` adentro del contenedor con scroll horizontal
  — **bug encontrado y corregido durante la prueba manual**: centrar el
  texto "Escenario" en todo el ancho del grid (190 butacas, bastante
  más ancho que la pantalla) lo dejaba centrado fuera de la parte
  visible la mayor parte del tiempo; se cambió a sticky pegado a la
  izquierda, visible todo el tiempo sin importar el scroll.
  - Botón de 32px (`TAMANO_BUTACA`), sin tocar el viewport del `<meta>`
    (seguía sin `maximum-scale`, confirmado antes de tocar nada — no
    hacía falta cambiarlo). Estados por texto/ícono, nunca solo color:
    ocupada (`X`, deshabilitada), elegida (`Check`), tuya (borde azul
    distinto, sin ícono propio — la diferencia con "elegida" ya es
    clara por el texto del `aria-label` y la leyenda), silla de ruedas
    (ícono `Accessibility` adentro del botón + "Lugar para silla de
    ruedas" en el `aria-label` y en la leyenda). `aria-pressed` solo en
    "elegida" (no en "tuya": no es parte de la selección nueva todavía,
    hay que tocarla para que cuente). El tope de `cantidad` se
    chequea acá adentro (no en quien usa el componente): tocar una
    libre de más no llama a `onToggle`, solo muestra el aviso.
- **`pages/ElegirButacas.jsx`** (nueva, `/mis-entradas/:compraId/butacas`,
  dentro de Shell/RequireRole — agregada a `Shell.jsx` con
  `pathname.startsWith('/mis-entradas/')`, mismo criterio que
  `/eventos`, porque la ruta lleva un parámetro y no entra en la lista
  de rutas exactas). La compra sale de `useEntradas()` buscando por
  `id` (no hay un `GET` de una sola compra) — si no está en la lista,
  "No encontramos esta compra" cubre los dos casos (no existe, o es de
  otra familia) sin distinguir cuál, a propósito. `modo` sale de
  `puede_elegir_butacas`/`puede_cambiar_butacas` tal cual vienen del
  backend, nunca se recalcula del lado del front.
  - Selección empieza vacía en los dos modos (ni en "cambiar" arranca
    con las butacas actuales pre-marcadas) — se leyó el pedido como
    "se pueden volver a elegir", no "ya están elegidas": arrancar vacío
    evita que el botón "Confirmar" quede deshabilitado de entrada en
    modo cambiar sin que la familia haya tocado nada.
  - Mapeo de errores: `ERR_BUTACA_OCUPADA` recarga el plano, saca de la
    selección las que ahora aparecen en `ocupadas`, conserva el resto,
    cierra la hoja y avisa — se queda en la pantalla. `ERR_YA_TIENE_BUTACAS`
    recarga `useEntradas()` y vuelve. `ERR_FAMILIA_CON_DEUDA`,
    `ERR_COMPRA_SIN_PAGAR`, `ERR_ENTRADA_USADA`, `ERR_EVENTO_PASADO`,
    `ERR_CAMBIO_BUTACAS_AGOTADO` muestran el `mensaje` tal cual del
    backend y vuelven. 422 (cualquiera de los cuatro códigos de
    validación) recarga el plano con un mensaje genérico, sin volver.
    Sin `.status` en el error (falla de red real, no HTTP) no se toca
    nada: la hoja queda abierta, la selección intacta, botón
    "Reintentar". El botón de la hoja queda deshabilitado mientras la
    petición está en vuelo (`enVuelo`) en los dos modos.
  - "Nunca marcar nada como hecho sin una respuesta 200": el único
    lugar que navega a Mis entradas o cierra la hoja como éxito es el
    `try` que sigue al `await elegirButacas/cambiarButacas` — cualquier
    excepción (que `fetchConToken` tira siempre que `!res.ok`) cae al
    `catch` antes de llegar ahí.
- **`motivoButacas(compra)`** (nuevo, en `utils/format.js`, compartido
  por `MisEntradas.jsx` y `ElegirButacas.jsx`): **bug encontrado y
  corregido durante la prueba manual real** (no simulada — pasó con la
  compra real de la familia de prueba después de agotar su cambio de
  verdad). La primera versión mostraba `motivo_bloqueo || motivo_cambio`
  siempre, así que con butacas ya puestas y el cambio agotado se veía
  "Ya tiene sus butacas asignadas" (cierto, pero inútil) en vez de
  "Ya usaste tu cambio de butacas para esta compra" (lo que de verdad
  importa en ese momento). La regla quedó: con butacas puestas,
  `motivo_cambio` primero; sin butacas, `motivo_bloqueo` primero —
  apareció en dos archivos con el mismo bug, así que se sacó a una
  función compartida en vez de arreglarlo dos veces por separado.
- **`MisEntradas.jsx`**: `AccionButacas` — botón "Elegir butacas" (si
  `puede_elegir_butacas`), "Cambiar butacas" + "Te queda N cambio de
  butacas" (si `puede_cambiar_butacas`, `cambios_restantes` real del
  backend, nunca hardcodeado en 1), o el motivo en texto plano si
  ninguno. Nada de esto depende de `compra.estado`: los flags ya vienen
  calculados bien para cualquier estado desde el backend.
- **`utils/descargarEntrada.js`**: dos líneas nuevas al pie de la
  imagen, "Descargada el dd/mm/aaaa" (armado con `hoyLocalISO().split
  ('-')` reordenado, nada de `Date`/`toISOString` de nuevo) y "La
  butaca vigente figura al escanear el QR" — la butaca que se dibuja en
  la imagen es la de cuando se descarga, pero si después se cambia, el
  PNG viejo queda desactualizado (el QR no cambia, solo la butaca
  asociada) y esto lo deja dicho en la propia imagen.
- **Verificado contra el backend real** (`main` de `crear-backend`,
  contraseña demo vigente dada por el usuario, nada generado por mí,
  no se corrió `demo cargar`/`demo borrar`) con Playwright headless,
  **de punta a punta y con la compra real de la familia de prueba**
  (no una simulada): plano cargado (190 butacas reales, grilla
  correcta), elegir 2 butacas, tope de cantidad avisando sin
  reemplazar, hoja de confirmación con el resumen agrupado por fila,
  confirmar → el QR aparece en Mis entradas con la butaca elegida de
  verdad, botón pasa a "Cambiar butacas" con "Te queda 1 cambio de
  butacas", modo cambiar mostrando las butacas actuales como "tuya",
  botón deshabilitado al re-elegir exactamente las mismas, cambiar a
  butacas distintas de verdad, y después del cambio: ya no ofrece
  cambiar de nuevo (ni el botón en Mis entradas ni entrando directo a
  la URL), con el motivo correcto. Descarga de la entrada real con el
  pie nuevo (fecha de hoy real, PNG real). `npm run lint` y
  `npm run build` limpios en cada paso.
  - **Simulado** (interceptando las respuestas de `PUT /butacas`, ya
    que forzar estos casos en vivo requeriría dos familias
    compitiendo por la misma butaca en paralelo o un evento ya pasado
    de verdad): `ERR_BUTACA_OCUPADA` (confirmado que saca solo la
    butaca afectada de la selección, conserva el resto, se queda en la
    pantalla), sin conexión (`route.abort`, confirmado que la hoja
    sigue abierta con la selección intacta y botón "Reintentar"), 422
    genérico, y uno de los códigos que vuelven a Mis entradas
    (`ERR_EVENTO_PASADO`) y `ERR_YA_TIENE_BUTACAS`. Un primer intento
    de simular `ERR_BUTACA_OCUPADA` dio un falso negativo por un bug
    en el propio script de prueba (un `page.route` registrado después
    del montaje inicial contaba mal cuál era "la primera llamada") —
    no era un bug de la app, corregido en el script y vuelto a correr.
  - **No verificado**: decodificar el QR con un lector real (mismo
    límite que la Tarea Q, no hay herramienta de decodificación en
    este entorno).
- **Bundle**: 294.64 kB → 301.76 kB con las butacas (+7.12 kB) → 297.11
  kB después de la limpieza de la Tarea R.1 (+2.47 kB neto sobre el
  inicio de esta tarea, gzip 89.64 kB → 90.76 kB).

### Tarea R.1 — Limpieza del flujo mock de compra (commit aparte)

Borrado, confirmado antes con `git grep` que nada más los importaba:
`EventoButacas.jsx`, `ResumenCompra.jsx`, `VestuarioEvento.jsx`,
`hooks/useEvento.js` (singular — no confundir con `useEventos.js`,
plural, que sigue en pie y es real), sus 3 rutas en `App.jsx`
(`eventos/:id/butacas`, `eventos/:id/resumen`, `eventos/:id/vestuario`)
y `butacasOcupadasDemo` de `mock/fixtures.js` (era el único fixture que
quedaba sin ningún importador después de borrar `useEvento.js`).

**Lo que NO se tocó, a propósito, y por qué**: `hooks/useMisEntradas.js`
y `hooks/useVestuarioEvento.js` no estaban en la lista del pedido, y
`git grep` los sigue encontrando importados — `useMisEntradas.js` por
`Shell.jsx` (lo instancia y lo pasa por `Outlet context` como
`misEntradasApi`) y `useVestuarioEvento.js` por `VestuarioEvento.jsx`...
que ya no existe. Ahí está la trampa: **después de este borrado, ningún
componente alcanzable desde una ruta real consume `misEntradasApi`**
(`ResumenCompra.jsx`, que ya no existe, era el único que lo leía vía
`useOutletContext()`) — pero como `Shell.jsx` sigue llamando a
`useMisEntradas()` y pasándolo igual, un `git grep` literal todavía
"encuentra" el hook en uso. Mismo caso con `eventosDemo` y
`misEntradasDemo` de `fixtures.js` (las sigue importando
`useMisEntradas.js`) y `vestuarioPorEventoDemo` (la sigue importando
`useVestuarioEvento.js`): no se borraron porque borrarlas rompería
esos dos hooks, que técnicamente siguen "en uso" aunque nada los llame
en los hechos. Es exactamente el caso que el pedido anticipaba
("si algo todavía los usa, no lo toques y avisame") — queda avisado
acá: **`useMisEntradas.js`, `useVestuarioEvento.js`, la instancia de
`useMisEntradas()` en `Shell.jsx` y tres fixtures de `mock/fixtures.js`
(`eventosDemo`, `misEntradasDemo`, `vestuarioPorEventoDemo`) quedaron
huérfanos de verdad** (nada alcanzable desde una ruta los necesita),
pero sacarlos es una decisión aparte — tocan `Shell.jsx`, que está
fuera del alcance de esta tarea.

## Tarea S — QR ampliable, wake lock, y mensajes de error del login

**Spec**: ajustes de uso real en el celular sobre lo de la Tarea R —
tocar el QR de Mis entradas lo abre a pantalla completa con la
pantalla sin apagarse mientras se muestra, más un bug viejo del login
que mezclaba cualquier error con "credenciales incorrectas".

- **Bug real encontrado arreglando el canvas (ítem 2 del pedido)**:
  `dibujarQR()` (`utils/qr.js`) recibía `tamano` pero dibujaba el QR
  real (`lado`) desde `(x, y)` sin más — y `lado` casi nunca coincide
  con `tamano` (la escala se redondea hacia abajo a módulos enteros:
  para `tamano=160` el QR real salía de ~123px). El `<canvas>` quedaba
  con el tamaño pedido, pero el QR ocupaba solo una esquina, dejando un
  margen grande y asimétrico abajo a la derecha — nunca estuvo
  realmente centrado. Se agregó un `offset` que centra el `lado`×`lado`
  real dentro de la caja de `tamano`×`tamano`, con fondo blanco de toda
  la caja (no solo del QR). Arregla el QR de la lista, el ampliado, **y**
  de paso la descarga en PNG (`descargarEntrada.js` usa la misma
  función) — no hizo falta tocar ese archivo.
- **`QRCode.jsx`**: tamaño mínimo en la lista pasó de 160 a 180px
  (ítem 1). Sigue sin guardar nada, se redibuja cada vez.
- **`components/QRAmpliado.jsx`** (nuevo): vista a pantalla completa.
  Tamaño = `max(260, min(ancho de ventana − 64, 400))` — el piso de
  260px y el "ancho disponible menos márgenes" los pedía el spec; el
  techo de 400px es una decisión propia (nada lo pedía, pero sin un
  límite un monitor de escritorio dejaría el QR ocupando media
  pantalla) y queda recalculado en `resize`/`orientationchange`.
  - **Tres caminos de cierre que convergen en uno solo**: abrir hace
    `history.pushState`; el botón "Cerrar", Escape y el gesto/botón
    atrás del navegador llaman los tres a `history.back()`, y es el
    handler de `popstate` el único que de verdad desmonta el
    componente. Así el botón atrás del celular cierra la vista en vez
    de sacar a la familia de Mis entradas, sin tres implementaciones
    de "cerrar" que se puedan desincronizar.
  - **Bug real encontrado en la prueba manual**: un primer intento
    centraba el contenido con un `-mt-12` a mano para compensar la
    altura del header con el botón "Cerrar" — el margen negativo hacía
    que el bloque del QR se superpusiera visualmente sobre el header y
    **tapara los clics al botón "Cerrar"** (confirmado con Playwright:
    el intento de click reintentó solo durante el timeout completo,
    "element intercepts pointer events"). Se sacó el `-mt-12`: con
    `flex-1 items-center justify-center` alcanza, el contenido queda
    centrado de verdad en el espacio debajo del header sin invadirlo.
    Confirmado después con las posiciones reales
    (`getBoundingClientRect`): el QR queda centrado al píxel dentro de
    esa caja.
  - **Wake lock**: `if (!('wakeLock' in navigator)) return` antes que
    nada — en HTTP esa propiedad ni existe, así que no se intenta nada
    (nunca "falla"). El pedido se libera al desmontar y también al
    ocultarse la pestaña (`visibilitychange`), con una bandera `vigente`
    para la carrera típica de StrictMode en desarrollo (monta, desmonta
    al toque, vuelve a montar — si la promesa de `request()` resuelve
    después de que ya se desmontó el primer montaje, no hay que
    guardar ese sentinel, hay que soltarlo directo).
- **Login**: `apiLogin()` (`api/client.js`) lanzaba un `Error` fijo
  ("Email o contraseña incorrectos") para **cualquier** respuesta no
  exitosa, perdiendo el `status` real — por eso `Login.jsx` no tenía
  cómo distinguir nada y mostraba siempre el mismo mensaje. Se cambió a
  `erroDeRespuesta()` (la misma función que ya usa `fetchConToken` para
  todo lo demás), y `Login.jsx` suma `mensajeErrorLogin(err)`: sin
  `status` (falló el `fetch` mismo — sin conexión) o `>= 500` → mensaje
  de conexión; `401` → "Email o contraseña incorrectos."; `429` → el
  `mensaje` real del backend (trae los minutos exactos de espera,
  mejor que cualquier texto fijo de acá —
  `AuthService._exigir_no_bloqueado`, confirmado en el backend).
  **No se tocó** `manejarCodigo`/`apiLogin2FA` (el paso de 2FA): el
  pedido hablaba del login con credenciales, que es el único que tenía
  el bug descripto (el 2FA ya tiene su propio mensaje acotado al
  código, no a credenciales).
- **Verificado contra el backend real** (`familia@demo`, contraseña
  dada por el usuario, nada generado ni reseteado por mí): un intento
  de login con contraseña incorrecta de verdad → "Email o contraseña
  incorrectos." (un solo intento, a propósito, para no sumar a los 5
  fallidos que bloquean la cuenta con un 429 real). El resto de Mis
  entradas con los datos reales de la familia (2 entradas con butaca
  de la Tarea R): QR de 180px en la lista, centrado sin margen
  asimétrico; tocar cualquiera abre la vista ampliada a 326px (390px
  de viewport − 64 de margen) con "Fila A · Butaca 16" debajo; cierre
  confirmado por los tres caminos (Escape; botón "Cerrar", recién
  después de sacar el `-mt-12` de arriba, antes quedaba bloqueado; y
  `page.goBack()` real de Playwright, confirmando que la URL se queda
  en `/mis-entradas` en vez de navegar a otro lado). Viewport de 390px
  y zoom de texto al 200% (`font-size: 200%` en `<html>`, simulando el
  ajuste de accesibilidad del sistema): todo sigue legible y el botón
  "Cerrar" sigue siendo clickeable y funcional. `npm run lint` y
  `npm run build` limpios. Bundle: 297.11 kB → 300.16 kB (+3.05 kB sin
  comprimir, gzip 90.76 kB → 91.63 kB, +0.87 kB).
  - **Simulado**: 500 y "sin conexión" (`route.abort`) del login →
    confirmado el mismo mensaje de conexión en los dos casos; 429 con
    un cuerpo fabricado con el mensaje real que manda
    `_exigir_no_bloqueado` → confirmado que se muestra tal cual, no un
    texto genérico propio.
  - **Wake lock: no se pudo confirmar la adquisición exitosa de
    punta a punta en este entorno.** `navigator.wakeLock.request()`
    devuelve `NotAllowedError: Wake Lock permission request denied` en
    Chromium headless vía Playwright (confirmado con una llamada
    directa fuera de la app, mismo resultado) — limitación del entorno
    sin pantalla real, no de la app. Sí se confirmó: `'wakeLock' in
    navigator` da `true` en `http://localhost` (Chromium trata
    localhost como contexto seguro aunque sea HTTP, a diferencia de un
    HTTP real en producción — por eso ahí la propiedad directamente no
    existiría y el `if` de arriba corta antes de intentar nada), que
    el pedido se intenta (interceptado con un wrapper antes de que
    cargara la app), y que el rechazo se traga sin ningún error de
    consola ni romper la vista ampliada — el comportamiento exigido
    ("no debe fallar") quedó confirmado aunque la adquisición en sí no
    se haya podido ver completarse. Falta probarlo en un celular real
    con pantalla, donde sí debería resolver.

## Flujo de trabajo

La planificación se define en una conversación aparte con Claude en
claude.ai — las tareas llegan ya especificadas. Si algo del spec no cierra
con el código real del repo (un componente que no existe, una convención
distinta a la documentada acá), avisar y frenar en vez de asumir — esto ya
costó tiempo real una vez en el proyecto anterior.