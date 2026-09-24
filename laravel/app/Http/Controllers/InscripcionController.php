<?php

namespace App\Http\Controllers;

use App\Http\Resources\ActividadResource;
use App\Models\Actividad;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class InscripcionController
{
    /** Actividades en las que está inscrito el usuario, ordenadas por fecha. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $actividades = $request->user()->inscripciones()
            ->conEstadoDe($request->user())
            ->orderBy('fecha_hora_inicio')
            ->get();

        return ActividadResource::collection($actividades);
    }

    public function store(Request $request, Actividad $actividad): JsonResponse|ActividadResource
    {
        $usuario = $request->user();
        abort_if($usuario->es_admin, Response::HTTP_FORBIDDEN, 'Los administradores no pueden inscribirse.');
        abort_if($actividad->haComenzado(), Response::HTTP_CONFLICT, 'La actividad ya ha comenzado.');

        // Bloqueo de la actividad para que dos inscripciones a la vez no superen el aforo.
        $completa = DB::transaction(function () use ($usuario, $actividad) {
            $actividad = Actividad::lockForUpdate()->findOrFail($actividad->id);
            $yaInscrito = $actividad->inscritos()->where('usuarios.id', $usuario->id)->exists();

            if (! $yaInscrito && $actividad->estaCompleta()) {
                return true;
            }

            $actividad->inscritos()->syncWithoutDetaching([$usuario->id]);

            return false;
        });

        if ($completa) {
            return response()->json(['message' => 'La actividad está completa.'], Response::HTTP_CONFLICT);
        }

        return ActividadResource::desde($actividad, $usuario);
    }

    public function destroy(Request $request, Actividad $actividad): ActividadResource
    {
        $actividad->inscritos()->detach($request->user()->id);

        return ActividadResource::desde($actividad, $request->user());
    }
}
