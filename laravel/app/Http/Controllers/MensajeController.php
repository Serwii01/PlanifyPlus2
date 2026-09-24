<?php

namespace App\Http\Controllers;

use App\Http\Requests\MensajeRequest;
use App\Http\Resources\MensajeResource;
use App\Models\Actividad;
use App\Models\Mensaje;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

/** Chat de cada actividad entre las personas inscritas (el admin puede leer y moderar). */
class MensajeController
{
    /** Máximo de mensajes que se devuelven en la carga inicial. */
    private const ULTIMOS = 100;

    /**
     * Mensajes del chat en orden cronológico. Con `?desde={id}` solo devuelve los posteriores
     * a ese id (para que el cliente sondee novedades); sin él, los últimos 100.
     */
    public function index(Request $request, Actividad $actividad): AnonymousResourceCollection
    {
        Gate::authorize('verChat', $actividad);

        $consulta = $actividad->mensajes()->with('usuario.foto');
        $desde = (int) $request->query('desde', 0);

        $mensajes = $desde > 0
            ? $consulta->where('id', '>', $desde)->orderBy('id')->get()
            : $consulta->orderByDesc('id')->limit(self::ULTIMOS)->get()->reverse()->values();

        return MensajeResource::collection($mensajes);
    }

    public function store(MensajeRequest $request, Actividad $actividad): JsonResponse
    {
        Gate::authorize('chatear', $actividad);

        $mensaje = $actividad->mensajes()->make($request->validated());
        $mensaje->usuario()->associate($request->user());
        $mensaje->save();

        return (new MensajeResource($mensaje->load('usuario.foto')))->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function destroy(Mensaje $mensaje): Response
    {
        Gate::authorize('delete', $mensaje);

        $mensaje->delete();

        return response()->noContent();
    }
}
