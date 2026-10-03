# Levantar `crear-backend` en local

Este frontend necesita el backend compartido corriendo para hacer cualquier cosa (no hay modo mock de login). El backend vive en su propio repo: `crear-backend`.

## Opción recomendada: Docker Compose

El repo de `crear-backend` ya incluye un `docker-compose.dev.yml` pensado para esto — un solo comando levanta Postgres + la API con recarga automática.

```bash
git clone <URL de crear-backend>
cd crear-backend
cp backend/.env.example backend/.env
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml exec backend alembic upgrade head
```

Confirmá que levantó bien:

```bash
curl http://localhost:8000/health
```

### Cargar datos de prueba

La forma más rápida — un comando que carga docentes, comisiones, alumnas, cuotas, asistencia y tres usuarios de prueba (secretaria/profesora/familia) de una sola vez:

```bash
docker compose -f docker-compose.dev.yml exec backend python -m app.cli demo cargar
```

**Guardá la contraseña que te muestra — aparece una sola vez.** Para volver a dejar la base limpia: `python -m app.cli demo borrar` (mismo comando, cambiando `cargar` por `borrar`).

### Documentación interactiva de la API

```
http://localhost:8000/api/v1/openapi.json   (el esquema completo, no en la raíz)
http://localhost:8000/docs                   (Swagger UI — recomendado para probar endpoints a mano)
```

Swagger es mucho más cómodo que armar `curl` a mano: tenés un botón **"Authorize"** arriba a la derecha — logueate desde `POST /auth/login`, copiá el `access_token`, pegalo ahí, y de ahí en más todos los endpoints que pruebes en esa pestaña ya van autenticados.

## Alternativa: backend suelto con `.venv` (sin Docker)

Hace falta para correr `pytest` directo, o si Docker da problemas:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Linux/Mac
# .\.venv\Scripts\Activate.ps1   # Windows PowerShell
pip install -r requirements.txt
```

Editá `backend/.env` → `DATABASE_URL` apuntando al Postgres del compose (ver más abajo qué puerto usa) o a un Postgres propio.

```bash
alembic upgrade head
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Problemas reales que ya aparecieron (y cómo se resolvieron)

**`permission denied` al correr cualquier comando `docker`**
Tu usuario de Linux no está en el grupo `docker`. Arreglo definitivo:
```bash
sudo usermod -aG docker $USER
```
No alcanza con abrir una terminal nueva — hay que **cerrar sesión del sistema completo y volver a entrar** (o reiniciar) para que el cambio de grupo se aplique.

**Nunca uses `sudo docker ...` como solución rápida** — si el contenedor escribe algo de vuelta a una carpeta montada por volumen, queda con dueño `root`, y tu usuario normal no puede tocarlo después. Si ya pasó: `sudo chown -R $USER:$USER .` en la carpeta del repo.

**`InvalidPasswordError: password authentication failed for user "crear"`**
Casi siempre es un volumen de Postgres viejo con otra contraseña ya grabada adentro (Postgres solo aplica usuario/contraseña la primera vez que inicializa una base vacía). Arreglo:
```bash
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml exec backend alembic upgrade head
```
Esto borra los datos de prueba — recargalos con `python -m app.cli demo cargar`.

**Puerto de Postgres ocupado al hacer `up`**
Puede haber otro Postgres corriendo en tu máquina (del sistema operativo, o de otro proyecto). El `docker-compose.dev.yml` de este proyecto publica Postgres en el **5434** — si por algún motivo ese también choca, cambiá el mapeo de puerto en el archivo (`"5434:5432"` → otro número) y ajustá `DATABASE_URL` igual.

**`ModuleNotFoundError` después de traer cambios nuevos (`git pull`)**
El contenedor de Docker quedó con una imagen vieja, construida antes de que se agregara una dependencia nueva a `requirements.txt`. Reconstruí la imagen:
```bash
docker compose -f docker-compose.dev.yml build backend
docker compose -f docker-compose.dev.yml up -d
```

**`Can't locate revision identified by '...'` al correr `alembic upgrade head`**
Pasa si alguien reordenó/renumeró migraciones en el repo compartido mientras tu base local ya tenía aplicada la versión vieja. En desarrollo, con datos solo de prueba, lo más simple es recrear la base desde cero (ver el arreglo de `InvalidPasswordError` arriba).

**Login da 403 en todo salvo `/auth/me`**
Es esperado: toda cuenta nueva arranca con clave provisoria y `debe_cambiar_clave=true`. Primer paso obligatorio: `POST /auth/cambiar-clave`.

**Crear un usuario de prueba con `app.cli crear` falla con "no es un correo válido"**
No uses dominios como `.test` o `.local` — la validación de email hace una consulta DNS real, y esos dominios están reservados para nunca resolver. Usá `@example.com` (es un dominio real reservado para documentación, nunca entrega mail, pero sí pasa la validación).

**El `access_token` deja de funcionar a los pocos minutos**
Dura 15 minutos a propósito (seguridad). Si estás probando a mano con `curl`, regenerá el token justo antes de cada tanda de comandos en vez de reusar uno viejo. En Swagger, simplemente repetís el login y volvés a tocar "Authorize".

**Crear una cuenta nueva pide contraseña y la rechaza**
Reglas reales: mínimo 10 caracteres, no puede contener la parte del email antes de la `@`, no puede ser trivial, tiene que ser distinta de la actual.

## Para mirar los datos directo (sin pasar por la API)

[DBeaver](https://dbeaver.io/) (gratis) conectado a:
- Host: `localhost`
- Puerto: `5434`
- Base: `crear_db`
- Usuario / contraseña: `crear` / `crear`

Útil para confirmar IDs, revisar qué hay cargado, o forzar un dato puntual para probar un caso límite (ej. una cuota vencida) — siempre sobre la base de desarrollo, nunca en producción.