# PlanifyPlus · API (Laravel 12 + JWT)

API REST de PlanifyPlus. El frontend Angular está en `../angular`.

## Puesta en marcha

Requisitos: PHP 8.2+ (con las extensiones `pdo_pgsql`, `sodium` y `gd`), Composer y PostgreSQL.

```bash
composer install
cp .env.example .env          # en Windows: copy .env.example .env
php artisan key:generate
php artisan jwt:secret         # clave con la que se firman los tokens JWT
```

Crea la base de datos `planifyplus` en PostgreSQL (`CREATE DATABASE planifyplus;`, o ajusta `DB_*` en `.env`) y después:

```bash
php artisan migrate
php artisan fotos:importar    # banco de fotos: descarga fotos CC0/CC BY de Openverse por temas (config/fotos.php)
php artisan db:seed           # admin + 10 actividades predeterminadas con fechas futuras y portada del banco
php artisan serve             # http://localhost:8000
```

`fotos:importar` se puede repetir (no duplica) y admite `--tema=padel --tema=yoga --por-tema=10`. Las fotos se guardan en `public/fotos/` (ignorado por git) con autor y licencia para la atribución.

`php artisan db:seed` se puede repetir: borra las actividades predeterminadas y las vuelve a crear con fechas futuras, igual que hacía la aplicación de escritorio al arrancar.

Usuario administrador creado por el seeder: `admin@planifyplus.com` / `admin123`.

## Servir con Apache (XAMPP)

Alternativa a `php artisan serve`: un VirtualHost en el puerto 8000 con `DocumentRoot` en `laravel/public`
(así el frontend sigue apuntando a `http://localhost:8000/api`). En `C:/xampp/apache/conf/extra/httpd-vhosts.conf`:

```apache
Listen 8000
<VirtualHost *:8000>
    DocumentRoot "C:/ruta/al/proyecto/laravel/public"
    <Directory "C:/ruta/al/proyecto/laravel/public">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

En `php.ini` deben estar activas `extension=pdo_pgsql`, `extension=pgsql` y `extension=sodium`, y en
`httpd-xampp.conf` hace falta `LoadFile "C:/xampp/php/libsodium.dll"` para que Apache cargue sodium.
El `.htaccess` de `public/` redirige todas las peticiones a `index.php`.

## Tests

```bash
php artisan test
```

Los tests usan SQLite en memoria (ver `phpunit.xml`), no tocan PostgreSQL.

## Endpoints

| Método | Ruta | Sesión | Descripción |
|---|---|---|---|
| POST | `/api/registro` | no | Crea el usuario e inicia sesión: devuelve `usuario`, `token` y `expira_en`. Admite `direccion` + `latitud` + `longitud` |
| POST | `/api/login` | no | Devuelve `usuario`, `token` (JWT Bearer) y `expira_en`; máximo 10 intentos por minuto |
| POST | `/api/refresh` | token | Emite un token nuevo a partir del actual, aunque haya caducado (hasta 14 días) |
| POST | `/api/logout` | sí | Invalida el token actual |
| GET | `/api/ciudades` | no | Ciudades disponibles |
| GET | `/api/perfil` | sí | Usuario en sesión |
| PUT | `/api/perfil` | sí | Actualiza nombre, correo, ciudad, dirección exacta (opcional, con `latitud` y `longitud`) y (opcional) contraseña |
| GET | `/api/actividades` | opcional | Todas las actividades con `inscritos`, `denuncias`, `inscrito`, `denunciada` |
| GET | `/api/actividades/{id}` | opcional | Detalle |
| POST | `/api/actividades` | sí (no admin) | Crea la actividad e inscribe al creador |
| PUT | `/api/actividades/{id}` | sí (creador) | Edita |
| DELETE | `/api/actividades/{id}` | sí (creador o admin) | Elimina |
| GET | `/api/inscripciones` | sí | Actividades en las que estoy inscrito |
| POST | `/api/actividades/{id}/inscripcion` | sí (no admin) | Inscribirse (409 si está completa o ya ha comenzado) |
| DELETE | `/api/actividades/{id}/inscripcion` | sí | Cancelar inscripción |
| POST | `/api/actividades/{id}/denuncia` | sí (no admin) | Denunciar (una vez por usuario) |
| GET | `/api/usuarios/{id}` | opcional | Perfil público: nombre, ciudad, bio, avatar, cifras, `seguidores`/`seguidos`, flags `lo_sigo`/`me_sigue`, planes `proximas` e `historial` (el admin no tiene) |
| GET | `/api/usuarios/{id}/seguidores` · `/seguidos` | opcional | Personas que siguen al usuario / a las que sigue, con `lo_sigo` y `me_sigue` |
| POST | `/api/usuarios/{id}/seguir` | sí (no admin) | Seguir a una persona (422 si es uno mismo). Devuelve su ficha actualizada |
| DELETE | `/api/usuarios/{id}/seguir` | sí | Dejar de seguir |
| GET | `/api/social/sugerencias` | sí | Personas que aún no sigo: primero con quien comparto planes (`planes_en_comun`), después las de mi ciudad |
| GET | `/api/social/planes` | sí | Planes próximos a los que va gente a la que sigo, con `seguidos_que_van` |
| GET | `/api/actividades/{id}/mensajes?desde={id}` | sí (inscrito o admin) | Chat de la actividad: los últimos 100 o, con `desde`, solo los posteriores a ese id |
| POST | `/api/actividades/{id}/mensajes` | sí (inscrito, no admin) | Envía un mensaje (`texto`, hasta 1000 caracteres; 30 por minuto) |
| DELETE | `/api/mensajes/{id}` | sí (autor o admin) | Elimina un mensaje |
| GET | `/api/fotos?q=padel` | sí | Banco de fotos: busca por etiquetas o título (sin acentos, cualquier palabra), por relevancia |
| POST | `/api/fotos` | sí | Sube una imagen (`archivo` multipart, hasta 6 MB, se redimensiona a 1600 px). `publica=1` + `etiquetas` la incorpora al banco; `publica=0` la deja como avatar privado |

Las rutas marcadas como *opcional* aceptan el token para devolver el estado del usuario; sin token devuelven `inscrito` y `denunciada` a `false`.

Cada actividad incluye `foto` (portada con `url`, `autor`, `licencia` y `fuente_url`) y `asistentes` (las primeras 8 personas apuntadas con `avatar_url`); `inscritos` es el total.

## Errores

Todas las respuestas de error son JSON con un `message` en español pensado para mostrarse en la interfaz (ver `bootstrap/app.php`):

| Código | Cuándo | Cuerpo |
|---|---|---|
| 401 | Sin token, token caducado o inválido | `{"message": "Tu sesión ha caducado…"}` |
| 403 | Sin permiso (policies, admin donde no toca) | `{"message": "No tienes permiso para hacer eso."}` o el mensaje del `abort()` |
| 404 | Ruta o recurso inexistente | `{"message": "Esa actividad ya no existe o se ha eliminado."}` |
| 409 | Conflicto de negocio (aforo completo, ya comenzada) | `{"message": "La actividad está completa."}` |
| 422 | Validación | `{"message": "Revisa los datos del formulario.", "errors": {campo: [mensajes]}}` |
| 429 | Límite de peticiones (120/min por usuario; login 10/min, registro 5/min, chat 30/min) | `{"message": "Demasiadas peticiones…", "retry_after": segundos}` |
| 500 | Error inesperado | `{"message": "Algo ha fallado en el servidor…"}` (con `APP_DEBUG=true` se muestra la traza) |

## Autenticación

JWT con [php-open-source-saver/jwt-auth](https://github.com/PHP-Open-Source-Saver/jwt-auth). El token se envía en `Authorization: Bearer <token>`, dura `JWT_TTL` minutos (120 por defecto) y puede renovarse con `POST /api/refresh` durante `refresh_ttl` (14 días). Al renovar o cerrar sesión el token anterior entra en la lista negra (usa la caché configurada en `CACHE_STORE`).

## Estructura

```
app/
  Enums/TipoActividad.php          CULTURAL · DEPORTIVA · TALLER
  Models/Usuario.php               JWTSubject; coordenadas de la dirección exacta o, si no hay, del centro de la ciudad
  Models/Actividad.php             scope conEstadoDe(): portada, asistentes, contadores y flags
  Models/Foto.php                  Banco de fotos: etiquetas normalizadas, scope buscar() por relevancia
  Services/AlmacenFotos.php        Redimensiona (GD) y guarda en el disco `fotos` (public/fotos)
  Console/Commands/ImportarFotos.php  `fotos:importar` desde Openverse
  Http/Controllers/                Auth · Perfil · Actividad · Inscripcion · Denuncia · Seguimiento · Social · Mensaje
  Http/Requests/                   Validación con mensajes en español
  Http/Resources/                  JSON que consume Angular
  Policies/ActividadPolicy.php     crear (no admin) · editar (creador) · eliminar (creador o admin) · verChat/chatear (inscritos)
  Policies/MensajePolicy.php       eliminar (autor o admin)
config/ciudades.php                Coordenadas de las ciudades para el filtro por distancia
config/jwt.php                     Duración de los tokens
config/fotos.php                   Temas del banco de fotos y tamaño máximo
database/seeders/DatabaseSeeder.php Admin y actividades predeterminadas
```
