# PlanifyPlus

Aplicación web de actividades comunitarias. Monorepo con dos proyectos independientes:

- `laravel/` — API REST (Laravel 12, PHP 8.2+, JWT con `php-open-source-saver/jwt-auth`, PostgreSQL). Ver `laravel/README.md` para endpoints y estructura.
- `angular/` — Frontend (Angular 21 standalone, signals, sin zone.js, Leaflet para mapas). Ver `angular/README.md`.

Todo el código, comentarios, nombres y textos de interfaz están en **español**. Mantén esa convención.

## Comandos

```bash
# Backend
cd laravel && php artisan serve          # http://localhost:8000
cd laravel && php artisan test           # tests de feature con SQLite en memoria
cd laravel && php artisan db:seed        # regenera admin y actividades predeterminadas
cd laravel && php artisan fotos:importar # rellena el banco de fotos desde Openverse (temas en config/fotos.php)

# Frontend
cd angular && npm start                  # http://localhost:4200 (apunta a la API en :8000)
cd angular && npx ng build               # comprobar que compila sin avisos
```

## Reglas de negocio que no cambian

- El administrador (`es_admin`) no crea actividades ni se inscribe ni denuncia; solo elimina. Se crea con el seeder (`admin@planifyplus.com` / `admin123`).
- Al crear una actividad, el creador queda inscrito automáticamente. Solo el creador la edita; la eliminan el creador o el admin.
- Inscripción: no en actividades completas ni ya comenzadas. Denuncia: una por usuario y actividad.
- Las coordenadas del usuario son las de su dirección exacta (opcional, elegida en el buscador) o, si no la tiene, las del centro de su ciudad (`config/ciudades.php`); el filtro por distancia (Haversine) se calcula en el frontend.
- Las actividades `predeterminada = true` son de ejemplo, sin creador, y el seeder las regenera con fechas futuras (con portada del banco de fotos si hay alguna del tema).
- Banco de fotos (`fotos`): las públicas (importadas de Openverse con `fotos:importar` o subidas por usuarios con etiquetas) sirven de portada para cualquiera y se muestran con autor y licencia; las privadas (`publica = false`) son avatares y no salen en las búsquedas. Se guardan en `public/fotos/` (ignorado por git).
- Los perfiles son públicos (`GET /api/usuarios/{id}`): nombre, ciudad, bio, avatar, planes próximos e historial (planes ya celebrados, organizados o asistidos); nunca el correo ni la dirección exacta. El admin no tiene perfil público. Los asistentes de cada actividad son visibles para todos.
- Red social (`seguimientos`): cualquier usuario sigue a otros (no a sí mismo); el admin ni sigue ni puede ser seguido. Seguidores y seguidos son públicos. `/social` sugiere gente con planes en común o de la misma ciudad y lista los planes de la gente a la que sigues.
- Chat por actividad (`mensajes`): solo lo leen y escriben las personas inscritas; el admin lo lee y borra mensajes pero no escribe. Cada mensaje lo borra su autor o el admin. Sin websockets: el frontend sondea `?desde={id}` cada 5 s mientras la pestaña está visible.

## Convenciones

- Backend: FormRequests con mensajes en español, Resources para el JSON, `ActividadPolicy` para permisos, scope `Actividad::conEstadoDe($usuario)` para contadores y flags `inscrito`/`denunciada`.
- Frontend: servicios en `core/` (`Sesion`, `ActividadesApi`, `UsuariosApi`, `MensajesApi`, `Avisos`), componentes compartidos en `compartido/` (`Cabecera`, `TarjetaActividad`, `Icono`, `Avisos`, `Acceso`, `SelectorUbicacion`, `SelectorFoto`, `Avatar`, `BotonSeguir`, `TarjetaPersona`, `ChatActividad`), una carpeta por pantalla en `paginas/`. Formularios con `ngModel` y errores inline; toasts para resultados; diálogo de confirmación solo para acciones destructivas. Iconos como SVG en `compartido/icono/icono.ts` (añade ahí los nuevos).
- Estilos: neumorfismo suave sobre papel cálido, con titulares en serif (Fraunces) y cuerpo en Plus Jakarta Sans; tokens en `src/styles.css` (`--marca` índigo solo para acciones, `--tinta`, `--relieve`/`--hundido` para paneles y campos, tipos de actividad en tonos tierra `--deportiva`/`--cultural`/`--taller`). Nada de degradados ni brillos: las portadas son fotos reales o no hay portada; sin foto, la tarjeta muestra el bloque de fecha. Los paneles usan `.panel`, los bloques secundarios `.panel-hundido`, las pestañas `.pestanas`/`.segmentos` y los títulos pequeños de sección `.titulo-seccion`. No usar emojis como iconos. Todo debe verse bien desde 360 px: revisa cada pantalla en móvil.
- Errores: la API responde siempre JSON con `message` en español listo para mostrar (401 sesión caducada, 403 sin permiso, 404 "Esa actividad ya no existe", 422 con `errors`, 429 con `retry_after`, 500 genérico sin detalles). En Angular, `mensajeDeApi()` elige el texto (incluye red caída y 5xx), `GestorErrores` es el `ErrorHandler` global, el interceptor lleva a `/login` si no se puede renovar el token, las rutas inexistentes muestran `NoEncontrada` y las listas principales ofrecen "Reintentar". Los límites de los formularios (títulos, aforo ≤ 500, fecha < 1 año, textos) se validan igual en cliente y servidor.
