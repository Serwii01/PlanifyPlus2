<?php

namespace App\Http\Controllers;

use App\Http\Resources\PerfilPublicoResource;
use App\Models\Usuario;
use Illuminate\Http\Request;

class UsuarioController
{
    /** Perfil público de un usuario. El administrador no tiene perfil público. */
    public function mostrar(Request $request, Usuario $usuario): PerfilPublicoResource
    {
        abort_if($usuario->es_admin, 404);

        return new PerfilPublicoResource(Usuario::conEstadoDe($request->user())->findOrFail($usuario->id));
    }
}
