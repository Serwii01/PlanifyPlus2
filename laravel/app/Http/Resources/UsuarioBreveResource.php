<?php

namespace App\Http\Resources;

use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Ficha resumida de una persona en los listados sociales (seguidores, seguidos, sugerencias).
 * Espera la consulta hecha con `Usuario::conEstadoDe` para los contadores y los flags.
 */
class UsuarioBreveResource extends JsonResource
{
    /** Vuelve a leer al usuario de la base de datos con su estado respecto a quien mira. */
    public static function desde(Usuario $usuario, ?Usuario $quienMira): static
    {
        return new static(Usuario::conEstadoDe($quienMira)->findOrFail($usuario->id));
    }

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'ciudad' => $this->ciudad,
            'bio' => $this->bio,
            'avatar_url' => $this->avatar_url,
            'seguidores' => $this->seguidores_count ?? 0,
            'seguidos' => $this->seguidos_count ?? 0,
            'lo_sigo' => (bool) ($this->lo_sigo ?? false),
            'me_sigue' => (bool) ($this->me_sigue ?? false),
            // Solo en las sugerencias: cuántos planes comparte con quien mira.
            'planes_en_comun' => $this->when(isset($this->planes_en_comun), fn () => (int) $this->planes_en_comun),
        ];
    }
}
