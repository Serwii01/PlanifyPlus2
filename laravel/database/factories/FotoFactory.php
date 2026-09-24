<?php

namespace Database\Factories;

use App\Models\Foto;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Foto>
 */
class FotoFactory extends Factory
{
    public function definition(): array
    {
        return [
            'ruta' => 'banco/'.fake()->uuid().'.jpg',
            'titulo' => fake()->sentence(3),
            'etiquetas' => 'padel, deporte',
            'autor' => fake()->name(),
            'licencia' => 'cc0',
            'fuente_url' => fake()->unique()->url(),
            'publica' => true,
        ];
    }

    public function privada(): static
    {
        return $this->state(['publica' => false, 'licencia' => 'propia']);
    }
}
