<?php

namespace App\Http\Controllers;

use App\Http\Resources\ActividadResource;
use App\Models\Actividad;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class DenunciaController
{
    /** Registra la denuncia del usuario; una misma actividad solo se denuncia una vez por usuario. */
    public function store(Request $request, Actividad $actividad): ActividadResource
    {
        $usuario = $request->user();
        abort_if($usuario->es_admin, Response::HTTP_FORBIDDEN, 'Los administradores no pueden denunciar.');

        $actividad->denunciantes()->syncWithoutDetaching([$usuario->id]);

        return ActividadResource::desde($actividad, $usuario);
    }
}
