<?php

namespace App\Http\Resources;

use App\Models\Actividad;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Lo que cualquiera puede ver de un usuario: presentación, ciudad, red social, sus planes
 * próximos y su historial. Nunca expone el correo ni la dirección exacta.
 * Espera la consulta hecha con `Usuario::conEstadoDe` para los datos sociales.
 */
class PerfilPublicoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $planes = fn () => Actividad::conEstadoDe($request->user())
            ->whereHas('inscritos', fn (Builder $q) => $q->where('usuarios.id', $this->id));

        $proximas = $planes()->where('fecha_hora_inicio', '>=', now())->orderBy('fecha_hora_inicio')->get();
        // Historial: todo lo que ya se ha celebrado, de lo más reciente a lo más antiguo.
        $historial = $planes()->where('fecha_hora_inicio', '<', now())->orderByDesc('fecha_hora_inicio')->get();

        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'ciudad' => $this->ciudad,
            'bio' => $this->bio,
            'avatar_url' => $this->avatar_url,
            'miembro_desde' => $this->created_at?->toDateString(),
            'organizadas' => $this->actividadesCreadas()->count(),
            'realizadas' => $historial->count(),
            'seguidores' => $this->seguidores_count ?? 0,
            'seguidos' => $this->seguidos_count ?? 0,
            'lo_sigo' => (bool) ($this->lo_sigo ?? false),
            'me_sigue' => (bool) ($this->me_sigue ?? false),
            'proximas' => ActividadResource::collection($proximas),
            'historial' => ActividadResource::collection($historial),
        ];
    }
}
