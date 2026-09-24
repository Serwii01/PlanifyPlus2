<?php

namespace App\Policies;

use App\Models\Actividad;
use App\Models\Usuario;

class ActividadPolicy
{
    /** Solo los usuarios normales crean actividades; el admin únicamente modera. */
    public function create(Usuario $usuario): bool
    {
        return ! $usuario->es_admin;
    }

    public function update(Usuario $usuario, Actividad $actividad): bool
    {
        return $actividad->creado_por_id === $usuario->id;
    }

    public function delete(Usuario $usuario, Actividad $actividad): bool
    {
        return $usuario->es_admin || $actividad->creado_por_id === $usuario->id;
    }

    /** El chat lo leen las personas inscritas y el admin (moderación). */
    public function verChat(Usuario $usuario, Actividad $actividad): bool
    {
        return $usuario->es_admin || $usuario->estaInscritoEn($actividad);
    }

    /** Solo escriben en el chat las personas inscritas. */
    public function chatear(Usuario $usuario, Actividad $actividad): bool
    {
        return ! $usuario->es_admin && $usuario->estaInscritoEn($actividad);
    }
}
