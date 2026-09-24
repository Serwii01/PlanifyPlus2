# PlanifyPlus · Frontend (Angular 21)

Frontend de PlanifyPlus. Consume la API Laravel de `../laravel` autenticándose con JWT.

## Puesta en marcha

Requisitos: Node 20+ y la API en marcha en `http://localhost:8000` (ver `../laravel/README.md`).

```bash
npm install
npm start          # http://localhost:4200
```

Si la API está en otra dirección, cámbiala en `src/environments/environment.ts`.

## Pantallas

| Ruta | Componente | Qué hace |
|---|---|---|
| `/` | `paginas/inicio` | Actividades próximas con búsqueda, filtro por tipo y por distancia (desde la dirección exacta del usuario o el centro de su ciudad, con la distancia en cada tarjeta); panel lateral con las mías (o las denunciadas si soy admin) |
| `/login`, `/registro` | `paginas/login`, `paginas/registro` | Acceso con validación inline; el registro (con ciudad y dirección exacta opcionales) inicia sesión directamente |
| `/actividades/nueva`, `/actividades/:id/editar` | `paginas/crear-actividad` | Formulario con foto de portada del banco (o subida propia), buscador de ubicación (Nominatim) y mapa |
| `/actividades/:id` | `paginas/detalle-actividad` | Portada, organizador (enlace a su perfil), quién va, mapa, plazas, inscripción/cancelación, denuncia y gestión del creador |
| `/usuarios/:id` | `paginas/perfil-publico` | Perfil público: avatar, presentación, cifras y planes que organiza o a los que va |
| `/perfil` | `paginas/perfil` | Resumen, actividades apuntadas y calendario que filtra por día |
| `/perfil/editar` | `paginas/conf-perfil` | Foto de perfil, presentación, datos personales, ciudad y dirección exacta; la contraseña solo cambia si se escribe una |

## Sesión y JWT

`core/sesion.ts` guarda el token en `localStorage` y expone el usuario como signal. `core/auth-interceptor.ts` añade `Authorization: Bearer` a las peticiones a la API y, si una responde 401, pide un token nuevo a `POST /api/refresh` (una sola renovación aunque haya varias peticiones a la vez) y repite la petición; si la renovación falla, la sesión se cierra.

## Estructura

```
src/app/
  core/
    sesion.ts              Sesión JWT: login, registro, renovación, logout, perfil
    auth-interceptor.ts    Token en cabeceras y reintento tras renovar
    actividades-api.ts     Llamadas a /api/actividades e inscripciones
    fotos-api.ts           Banco de fotos: buscar y subir
    usuarios-api.ts        Perfil público
    buscador-ubicacion.ts  Búsqueda en Nominatim limitada a España
    avisos.ts              Toasts, diálogo de confirmación y lectura de errores de la API
    fechas.ts              Cuenta atrás ("Hoy", "Mañana", "En 5 días") e iniciales
    geo.ts                 Distancia Haversine, ubicación del usuario y formato de distancias
    guards.ts              sesionGuard y usuarioGuard (no admin)
    modelos.ts             Tipos Usuario, Actividad…
  compartido/
    cabecera/              Barra superior común con buscador opcional y menú de usuario
    tarjeta-actividad/     Tarjeta de los listados (botones según creador / admin / resto)
    acceso/                Maqueta a dos columnas de login y registro
    avisos/                Pinta los toasts y la confirmación activos
    icono/                 Iconos SVG en línea
    selector-ubicacion/    Buscador de ubicación exacta (Nominatim) con mapa; lo usan actividades, registro y perfil
    selector-foto/         Banco de fotos (buscar por tema, subir al banco o como avatar)
    avatar/                Foto de perfil o iniciales
  paginas/                 Una carpeta por pantalla
```

La aplicación es standalone, sin zone.js y basada en signals. Tipografía: Plus Jakarta Sans (Google Fonts).

## Estilo

Diseño neumórfico suave a partir del proyecto de Stitch "Planify Plus Social Events": una sola superficie gris-azulada (`--superficie`) sobre la que los paneles sobresalen (`--relieve`) y los campos se hunden (`--hundido`), con la marca en índigo (`--marca`). Los tokens están en `src/styles.css`.
