<?php

namespace Database\Factories;

use App\Enums\TipoActividad;
use App\Models\Actividad;
use App\Models\Usuario;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Actividad>
 */
class ActividadFactory extends Factory
{
    public function definition(): array
    {
        return [
            'titulo' => fake()->sentence(3),
            'descripcion' => fake()->paragraph(),
            'fecha_hora_inicio' => now()->addDays(3),
            'tipo' => fake()->randomElement(TipoActividad::cases()),
            'ubicacion' => fake()->streetAddress(),
            'ciudad' => 'Sevilla',
            'latitud' => 37.3891,
            'longitud' => -5.9845,
            'aforo' => 10,
        ];
    }

    public function predeterminada(): static
    {
        return $this->state(['predeterminada' => true]);
    }

    public function creadaPor(Usuario $usuario): static
    {
        return $this->state(['creado_por_id' => $usuario->id]);
    }
}
