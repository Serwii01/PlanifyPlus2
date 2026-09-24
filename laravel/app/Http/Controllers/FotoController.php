<?php

namespace App\Http\Controllers;

use App\Http\Requests\FotoRequest;
use App\Http\Resources\FotoResource;
use App\Models\Foto;
use App\Services\AlmacenFotos;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class FotoController
{
    /**
     * Busca en el banco de fotos por texto (`q`). Sin texto devuelve las más recientes.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $fotos = Foto::buscar($request->query('q'))
            ->latest('id')
            ->limit(40)
            ->get();

        return FotoResource::collection($fotos);
    }

    /**
     * Sube una foto. Si es pública pasa al banco con sus etiquetas para que cualquiera la reutilice.
     */
    public function store(FotoRequest $request, AlmacenFotos $almacen): JsonResponse
    {
        $publica = $request->boolean('publica', true);

        $foto = Foto::create([
            'ruta' => $almacen->guardar($request->file('archivo')->get(), $publica ? 'subidas' : 'avatares'),
            'titulo' => $request->input('titulo'),
            'etiquetas' => Foto::normalizarEtiquetas($request->input('etiquetas', '')),
            'autor' => $request->user()->nombre,
            'licencia' => 'propia',
            'publica' => $publica,
            'subida_por_id' => $request->user()->id,
        ]);

        return (new FotoResource($foto))->response()->setStatusCode(Response::HTTP_CREATED);
    }
}
