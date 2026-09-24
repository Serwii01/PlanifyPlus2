# PlanifyPlus

Plataforma web para crear, descubrir e inscribirse en actividades de la comunidad (deportivas, culturales y talleres), con foto de portada de un banco de imágenes libres, perfiles públicos con avatar, lista de asistentes, ubicación en mapa, filtro por distancia, aforo, calendario personal, denuncias y panel de moderación para el administrador.

Proyecto académico de la asignatura **Desarrollo de Interfaces** (DAM). Nació como aplicación de escritorio JavaFX y se ha migrado a una aplicación web.

| Carpeta | Contenido |
|---|---|
| [`laravel/`](laravel/README.md) | API REST · Laravel 12, JWT, PostgreSQL |
| [`angular/`](angular/README.md) | Frontend · Angular 21 (standalone, signals, sin zone.js), Leaflet |

## Puesta en marcha

Requisitos: PHP 8.2+ (con las extensiones `pdo_pgsql` y `sodium`), Composer, PostgreSQL (base de datos `planifyplus`) y Node 20+.

```bash
# API en http://localhost:8000
cd laravel
composer install
cp .env.example .env            # en Windows: copy .env.example .env
php artisan key:generate
php artisan jwt:secret
php artisan migrate
php artisan fotos:importar      # banco de fotos libres (Openverse); tarda unos minutos
php artisan db:seed             # admin@planifyplus.com / admin123 + actividades de ejemplo con portada
php artisan serve
```

```bash
# Frontend en http://localhost:4200
cd angular
npm install
npm start
```

Tests del backend: `cd laravel && php artisan test` (SQLite en memoria, no toca PostgreSQL).

## Autores

Sergio Fernández Morales, Iván Pastor López y Juan Carlos Moreno Moray.
