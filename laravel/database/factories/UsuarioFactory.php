<?php

namespace Database\Factories;

use App\Models\Usuario;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Usuario>
 */
class UsuarioFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nombre' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'contrasena' => 'secreto123',
            'ciudad' => 'Sevilla',
        ];
    }

    public function admin(): static
    {
        return $this->state(['es_admin' => true]);
    }
}
