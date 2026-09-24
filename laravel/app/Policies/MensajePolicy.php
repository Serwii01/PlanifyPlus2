<?php

namespace App\Policies;

use App\Models\Mensaje;
use App\Models\Usuario;

class MensajePolicy
{
    /** Un mensaje lo borra quien lo escribió o el administrador (moderación). */
    public function delete(Usuario $usuario, Mensaje $mensaje): bool
    {
        return $usuario->es_admin || $mensaje->usuario_id === $usuario->id;
    }
}
