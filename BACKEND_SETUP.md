Levantar crear-backend en local

Esta app necesita el backend compartido corriendo: no hay modo de prueba sin él. El backend vive en su propio repo, crear-backend.

Los comandos son iguales en todos los sistemas salvo donde hay dos bloques: uno powershell (Windows) y otro bash (Linux/Mac). Si usás Git Bash en Windows, los bloques bash funcionan, salvo la activación del entorno virtual (source .venv/Scripts/activate).

Requisitos previos
Git.
Docker Desktop, abierto y con el motor en marcha antes de correr cualquier comando docker. En Windows, el instalador propone activar WSL 2: aceptalo. En Linux alcanza con Docker Engine más el plugin de Compose.
Terminal: en Windows, PowerShell (no cmd).
Python 3.12, solo si vas a usar la alternativa sin Docker de más abajo (el contenedor usa 3.12). En Windows, instalalo desde python.org marcando "Add python.exe to PATH".
Opción recomendada: Docker Compose

crear-backend incluye docker-compose.dev.yml: un solo comando levanta Postgres y la API.

1. Clonar y entrar a la carpeta

git clone <URL de crear-backend>
cd crear-backend

2. Crear el archivo de configuración

Windows (PowerShell):

powershell
Copy-Item backend\.env.example backend\.env

(En Windows también podés correr setup.cmd desde la raíz del repo: crea backend\.env si no existe.)

Linux/Mac:

bash
cp backend/.env.example backend/.env

No hace falta editarlo para este camino: el compose le pasa al contenedor la conexión a su propia base.

3. Levantar

docker compose -f docker-compose.dev.yml up -d

La primera vez construye la imagen y tarda unos minutos. Las migraciones se aplican solas al arrancar. Si querés correrlas a mano:

docker compose -f docker-compose.dev.yml exec backend alembic upgrade head

4. Comprobar que responde

Windows (PowerShell):

powershell
curl.exe http://localhost:8000/health

(Sin el .exe, curl en Windows PowerShell 5.1 es un alias de otro comando y muestra un objeto en vez de la respuesta. Otra opción: Invoke-RestMethod http://localhost:8000/health.)

Linux/Mac:

bash
curl http://localhost:8000/health

Tiene que devolver {"status":"ok"}.

5. Cargar datos de prueba

docker compose -f docker-compose.dev.yml exec backend python -m app.cli demo cargar

Carga docentes, comisiones, alumnas, cuotas, asistencia y tres usuarios (secretaría, profesora y familia). Guardá la contraseña que muestra: aparece una sola vez y cambia cada vez que se corre. Otros comandos útiles:

docker compose -f docker-compose.dev.yml exec backend python -m app.cli demo estado
docker compose -f docker-compose.dev.yml exec backend python -m app.cli demo borrar
docker compose -f docker-compose.dev.yml exec backend python -m app.cli listar

Parar y volver a empezar

docker compose -f docker-compose.dev.yml stop        # frena, conserva los datos
docker compose -f docker-compose.dev.yml down        # borra los contenedores, conserva los datos
docker compose -f docker-compose.dev.yml down -v     # borra TODO, incluida la base de prueba
Documentación interactiva de la API
http://localhost:8000/docs                    Swagger UI (la forma más cómoda de probar endpoints)
http://localhost:8000/api/v1/openapi.json     el esquema completo (no está en la raíz)

Cómo usar Swagger sin pelearse con él:

Autenticarse: POST /auth/login → copiá el access_token → botón Authorize → pegalo. El token dura 15 minutos: cuando venza, repetí el login.
Cambiar de usuario: primero Authorize → Logout, y recién después pegá el token nuevo. Si no, sigue valiendo el anterior aunque parezca que cargaste el otro (síntoma típico: 403 con un usuario que debería poder).
Cuerpos de ejemplo: Swagger rellena todos los campos con valores falsos ("string", el UUID 3fa85f64-..., "gala"). Borrá el cuadro y mandá solo los campos necesarios, o vas a obtener errores raros o crear datos basura.
Un solo clic por acción: apretar Execute dos veces repite el POST (dio un 409 de "inscripción duplicada" más de una vez).
Alternativa: backend suelto con .venv (sin Docker)

Hace falta para correr pytest directo. Para la consola app.cli conviene usar el contenedor: con el entorno virtual, app.cli usa el DATABASE_URL del .env, que por defecto apunta a otra base y falla con InvalidPasswordError.

Crear el entorno e instalar dependencias

Windows (PowerShell):

powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

Si la activación falla con "la ejecución de scripts está deshabilitada":

powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

Reabrí la terminal y repetí la activación.

Linux/Mac:

bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

Base de datos. Levantá solo Postgres con Docker (desde la raíz del repo) y apuntá el .env a esa base:

docker compose -f docker-compose.dev.yml up -d db
docker compose -f docker-compose.dev.yml stop backend

En backend/.env:

DATABASE_URL="postgresql+asyncpg://crear:crear@localhost:5434/crear_db"

El stop backend evita que el contenedor y tu uvicorn se pisen en el puerto 8000. Después, con el entorno activado y parada en backend/:

alembic upgrade head
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
Correr los tests

La variable DATABASE_URL se pasa distinto según la terminal. Con el entorno virtual activado y parada en backend/:

Windows (PowerShell):

powershell
$env:DATABASE_URL = "postgresql+asyncpg://crear:crear@localhost:5434/crear_db"
pytest tests/test_portal_familias.py tests/test_permisos.py

(La variable queda definida mientras la terminal esté abierta. Para borrarla: Remove-Item Env:DATABASE_URL. En cmd sería set DATABASE_URL=... sin comillas.)

Linux/Mac:

bash
DATABASE_URL="postgresql+asyncpg://crear:crear@localhost:5434/crear_db" .venv/bin/pytest tests/test_portal_familias.py tests/test_permisos.py

Notas:

La suite completa tarda varios minutos: casi siempre alcanza con los archivos del módulo que tocaste.
Corré los tests desde el entorno virtual, no dentro del contenedor: ahí fallan algunos por razones de entorno (el contenedor no trae git y hereda variables del .env).
test_respaldo necesita las herramientas cliente de PostgreSQL (pg_restore). Si no las tenés, o son de una versión anterior a la del servidor, falla por eso y no por el código.
Mirar los datos sin pasar por la API

DBeaver (gratis) conectado a:

Host: localhost
Puerto: 5434
Base: crear_db
Usuario / contraseña: crear / crear

Sirve para confirmar IDs o forzar un dato puntual y probar un caso límite (por ejemplo, una cuota vencida). Hacelo siempre sobre la base de desarrollo, nunca en producción.

Problemas frecuentes
Solo Windows
error during connect ... docker_engine / "Cannot connect to the Docker daemon". Docker Desktop no está abierto. Abrilo y esperá a que diga que el motor está en marcha.
Docker Desktop se queja de WSL 2 o de virtualización. Abrí PowerShell como administrador, corré wsl --install y reiniciá. Si sigue, la virtualización puede estar desactivada en la BIOS.
permission denied con Docker usando otro usuario de Windows. El instalador agrega al grupo docker-users solo al usuario que instala. Agregá el otro desde "Administración de equipos → Usuarios y grupos locales → Grupos → docker-users" y cerrá sesión.
ports are not available: ... forbidden by its access permissions. Windows reserva rangos de puertos. Revisalos con netsh interface ipv4 show excludedportrange protocol=tcp y, si el 8000 o el 5434 caen adentro, cambiá el puerto publicado en docker-compose.dev.yml.
Puerto ocupado (8000, 5434 o 5173).
powershell
  netstat -ano | findstr :8000
  tasklist /FI "PID eq <numero-de-la-ultima-columna>"
Editaste código del backend y el contenedor no recarga. A veces los cambios de archivos no llegan al contenedor desde una carpeta de Windows. Reinicialo con docker compose -f docker-compose.dev.yml restart backend después de editar.
&& no funciona. Windows PowerShell 5.1 no lo soporta: un comando por línea.
Solo Linux
permission denied while trying to connect to the docker API. Tu usuario no está en el grupo docker: sudo usermod -aG docker $USER, y después cerrá sesión completa y volvé a entrar (una terminal nueva no alcanza).
No uses sudo docker ... como atajo permanente: lo que el contenedor escribe en carpetas montadas queda con dueño root. Si ya pasó: sudo chown -R $USER:$USER . en la carpeta del repo.
Cualquier sistema
InvalidPasswordError: password authentication failed for user "crear". Postgres solo toma usuario y contraseña la primera vez que inicializa una base vacía; probablemente quedó un volumen viejo. Esto borra los datos de prueba (se recargan con demo cargar):
  docker compose -f docker-compose.dev.yml down -v
  docker compose -f docker-compose.dev.yml up -d
Puerto de Postgres ocupado. El compose publica Postgres en el 5434 (el 5432 suele estar tomado por otro Postgres). Si el 5434 también choca, cambiá el número en docker-compose.dev.yml y en el DATABASE_URL.
ModuleNotFoundError después de un git pull. Se agregó una dependencia y la imagen quedó vieja. Reconstruila:
  docker compose -f docker-compose.dev.yml build backend
  docker compose -f docker-compose.dev.yml up -d
Multiple head revisions are present o Can't locate revision al migrar. Dos migraciones quedaron con el mismo padre, o se renumeraron. Mirá alembic heads; en desarrollo, con datos de prueba, lo más simple es recrear la base (down -v, up -d). Si pasa en main, avisá: hay que unir las cabezas con una migración de merge.
El front de la PWA falla con "blocked by CORS policy" en una ruta puntual. Si las demás andan, casi seguro esa ruta devolvió un 500: el navegador lo muestra como CORS porque la respuesta de error sale sin las cabeceras. Mirá el log real: docker compose -f docker-compose.dev.yml logs backend --since 5m.
Todo da 403 salvo /auth/me. La cuenta tiene la clave provisoria: hay que cambiarla primero con POST /auth/cambiar-clave.
/portal/* da 403. Esas rutas son solo para el rol tutor. El personal (secretaría, dirección) recibe 403 a propósito.
"Usuario o contraseña incorrectos" o error 429. Tras 5 intentos fallidos el login se bloquea unos minutos, y mientras dura ni la clave correcta entra. Esperá en vez de seguir probando.
Crear un usuario con app.cli crear falla con "no es un correo válido". No uses dominios .test ni .local: la validación consulta el DNS y esos dominios no existen. Usá @example.com.
Reglas de contraseña: mínimo 10 caracteres, sin la parte del correo antes de la @, ni triviales, y distinta de la actual.


- **Mercado Pago en el sandbox: `FIRMA_INVALIDA` con pagos reales.** Con una cuenta de prueba el token es `APP_USR-...` (no `TEST-...`). Las simulaciones del panel validan, pero los avisos de pagos reales pueden fallar si la clave del webhook no es la que firma esas notificaciones. Se ve en `webhook_eventos` (`resultado`, `firma_valida`). No es un error de código: depende de la clave que firma cada aviso. Sin firma válida el backend no acredita nada, a propósito.