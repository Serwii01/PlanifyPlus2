<?php

namespace App\Http\Controllers;

use App\Http\Requests\PerfilRequest;
use App\Http\Resources\UsuarioResource;
use Illuminate\Http\Request;

class PerfilController
{
    public function mostrar(Request $request): UsuarioResource
    {
        return new UsuarioResource($request->user());
    }

    /**
     * Actualiza nombre, correo, ciudad, dirección, presentación y avatar; la contraseña solo si se envía una nueva.
     */
    public function actualizar(PerfilRequest $request): UsuarioResource
    {
        $usuario = $request->user();
        $usuario->fill($request->safe()->except('contrasena'));

        if ($request->filled('contrasena')) {
            $usuario->contrasena = $request->input('contrasena');
        }

        $usuario->save();
        $usuario->load('foto');

        return new UsuarioResource($usuario);
    }
}
