<?php

namespace App\Http\Controllers;

use App\Http\Requests\ActividadRequest;
use App\Http\Resources\ActividadResource;
use App\Models\Actividad;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class ActividadController
{
    /**
     * Todas las actividades ordenadas por fecha. En las rutas públicas el token es opcional:
     * si viene, se marca si el usuario ya está inscrito o ha denunciado.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $actividades = Actividad::conEstadoDe($request->user())
            ->orderBy('fecha_hora_inicio')
            ->get();

        return ActividadResource::collection($actividades);
    }

    public function show(Request $request, Actividad $actividad): ActividadResource
    {
        return ActividadResource::desde($actividad, $request->user());
    }

    public function store(ActividadRequest $request): JsonResponse
    {
        Gate::authorize('create', Actividad::class);

        $usuario = $request->user();
        $actividad = $usuario->actividadesCreadas()->create($request->validated());

        // El creador queda inscrito automáticamente en su propia actividad.
        $actividad->inscritos()->attach($usuario->id);

        return ActividadResource::desde($actividad, $usuario)->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(ActividadRequest $request, Actividad $actividad): ActividadResource
    {
        Gate::authorize('update', $actividad);

        $actividad->update($request->validated());

        return ActividadResource::desde($actividad, $request->user());
    }

    public function destroy(Actividad $actividad): Response
    {
        Gate::authorize('delete', $actividad);

        $actividad->delete();

        return response()->noContent();
    }
}
