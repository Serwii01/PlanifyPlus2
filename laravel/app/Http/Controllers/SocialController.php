<?php

namespace App\Http\Controllers;

use App\Http\Resources\ActividadResource;
use App\Http\Resources\UsuarioBreveResource;
use App\Models\Actividad;
use App\Models\Usuario;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Apartado social del usuario en sesión: a quién seguir y qué planes tiene su gente. */
class SocialController
{
    /**
     * Personas que el usuario aún no sigue, primero con las que comparte planes
     * y después las de su misma ciudad.
     */
    public function sugerencias(Request $request): AnonymousResourceCollection
    {
        $yo = $request->user();
        $misPlanes = $yo->inscripciones()->pluck('actividades.id');
        $excluidos = $yo->seguidos()->pluck('usuarios.id')->push($yo->id);

        $personas = Usuario::conEstadoDe($yo)
            ->where('es_admin', false)
            ->whereNotIn('id', $excluidos)
            ->withCount(['inscripciones as planes_en_comun' => fn (Builder $q) => $q->whereIn('actividades.id', $misPlanes)])
            ->orderByDesc('planes_en_comun')
            ->orderByRaw('CASE WHEN ciudad = ? THEN 0 ELSE 1 END', [$yo->ciudad ?? ''])
            ->orderBy('nombre')
            ->limit(12)
            ->get();

        return UsuarioBreveResource::collection($personas);
    }

    /** Planes próximos a los que va alguien a quien sigue el usuario, con esas personas en `seguidos_que_van`. */
    public function planes(Request $request): AnonymousResourceCollection
    {
        $yo = $request->user();
        $seguidos = $yo->seguidos()->pluck('usuarios.id');

        $actividades = Actividad::conEstadoDe($yo)
            ->where('fecha_hora_inicio', '>=', now())
            ->whereHas('inscritos', fn (Builder $q) => $q->whereIn('usuarios.id', $seguidos))
            ->orderBy('fecha_hora_inicio')
            ->get()
            ->each(fn (Actividad $a) => $a->seguidos_que_van = $a->inscritos->whereIn('id', $seguidos)->values());

        return ActividadResource::collection($actividades);
    }
}
