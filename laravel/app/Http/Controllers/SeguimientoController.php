<?php

namespace App\Http\Controllers;

use App\Http\Resources\UsuarioBreveResource;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/** Seguir y dejar de seguir a otras personas, y consultar las redes de cada perfil. */
class SeguimientoController
{
    public function store(Request $request, Usuario $usuario): UsuarioBreveResource
    {
        $yo = $request->user();
        abort_if($yo->es_admin || $usuario->es_admin, Response::HTTP_FORBIDDEN, 'El administrador no participa en la red social.');
        abort_if($yo->id === $usuario->id, Response::HTTP_UNPROCESSABLE_ENTITY, 'No puedes seguirte a ti mismo.');

        $yo->seguidos()->syncWithoutDetaching([$usuario->id]);

        return UsuarioBreveResource::desde($usuario, $yo);
    }

    public function destroy(Request $request, Usuario $usuario): UsuarioBreveResource
    {
        $request->user()->seguidos()->detach($usuario->id);

        return UsuarioBreveResource::desde($usuario, $request->user());
    }

    /** Personas que siguen al usuario. */
    public function seguidores(Request $request, Usuario $usuario): AnonymousResourceCollection
    {
        abort_if($usuario->es_admin, 404);

        return UsuarioBreveResource::collection(
            $usuario->seguidores()->conEstadoDe($request->user())->orderBy('nombre')->get(),
        );
    }

    /** Personas a las que sigue el usuario. */
    public function seguidos(Request $request, Usuario $usuario): AnonymousResourceCollection
    {
        abort_if($usuario->es_admin, 404);

        return UsuarioBreveResource::collection(
            $usuario->seguidos()->conEstadoDe($request->user())->orderBy('nombre')->get(),
        );
    }
}
