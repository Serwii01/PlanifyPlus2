<?php

namespace Database\Seeders;

use App\Enums\TipoActividad;
use App\Models\Actividad;
use App\Models\Foto;
use App\Models\Usuario;
use Illuminate\Database\Seeder;

/**
 * Crea el usuario administrador y regenera las actividades predeterminadas
 * con fechas futuras (equivale al arranque de la aplicación original).
 * Cada predeterminada lleva un tema con el que se le busca portada en el banco de fotos.
 */
class DatabaseSeeder extends Seeder
{
    private const PREDETERMINADAS = [
        ['Partido de fútbol', 'Liga amistosa en campo grande. ¡Forma tu equipo!', TipoActividad::DEPORTIVA, 'Polideportivo San Isidro', 'Sevilla', 37.3886, -5.9823, 22, 'futbol'],
        ['Clase de yoga', 'Sesión de yoga relajante al atardecer', TipoActividad::DEPORTIVA, 'Parque de María Luisa', 'Sevilla', 37.3687, -5.9877, 25, 'yoga'],
        ['Taller de cerámica', 'Aprende a moldear y pintar cerámica', TipoActividad::TALLER, 'Centro Cultural Triana', 'Sevilla', 37.3826, -6.0039, 15, 'ceramica'],
        ['Cine fórum', 'Proyección y debate de película independiente', TipoActividad::CULTURAL, 'Sala Avenida', 'Sevilla', 37.3891, -5.9845, 40, 'cine'],
        ['Ruta senderismo', 'Excursión por la Sierra Norte', TipoActividad::DEPORTIVA, 'Inicio en Estación de tren', 'Constantina', 37.8687, -5.6191, 18, 'senderismo'],
        ['Curso de cocina italiana', 'Elabora pasta y pizza desde cero', TipoActividad::TALLER, 'Aula Gastronómica', 'Camas', 37.4107, -6.0338, 12, 'cocina'],
        ['Tarde de juegos de mesa', 'Juegos clásicos y actuales', TipoActividad::CULTURAL, 'Biblioteca Pública', 'Dos Hermanas', 37.2828, -5.9205, 20, 'juegos de mesa'],
        ['Clase de Zumba', 'Ven a moverte al ritmo latino', TipoActividad::DEPORTIVA, 'Gimnasio Central', 'Alcalá de Guadaíra', 37.3372, -5.8449, 30, 'zumba'],
        ['Taller de fotografía', 'Descubre los secretos del retrato urbano', TipoActividad::TALLER, 'Casa de la Juventud', 'Sevilla', 37.3925, -5.9840, 15, 'fotografia'],
        ['Recital de poesía', 'Lectura en vivo de poetas locales', TipoActividad::CULTURAL, 'Café Literario', 'Sevilla', 37.3861, -5.9920, 35, 'poesia'],
    ];

    public function run(): void
    {
        if (! Usuario::where('email', 'admin@planifyplus.com')->exists()) {
            Usuario::forceCreate([
                'nombre' => 'Admin',
                'email' => 'admin@planifyplus.com',
                'contrasena' => 'admin123',
                'es_admin' => true,
            ]);
        }

        Actividad::where('predeterminada', true)->delete();

        foreach (self::PREDETERMINADAS as $dias => [$titulo, $descripcion, $tipo, $ubicacion, $ciudad, $latitud, $longitud, $aforo, $tema]) {
            Actividad::forceCreate([
                'titulo' => $titulo,
                'descripcion' => $descripcion,
                'tipo' => $tipo,
                'fecha_hora_inicio' => now()->addDays($dias + 1),
                'ubicacion' => $ubicacion,
                'ciudad' => $ciudad,
                'latitud' => $latitud,
                'longitud' => $longitud,
                'aforo' => $aforo,
                // Portada del banco de fotos si ya se ha importado alguna del tema (`php artisan fotos:importar`).
                'foto_id' => Foto::buscar($tema)->inRandomOrder()->value('id'),
                'predeterminada' => true,
            ]);
        }
    }
}
