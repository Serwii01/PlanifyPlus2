<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UsuarioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'email' => $this->email,
            'ciudad' => $this->ciudad,
            'direccion' => $this->direccion,
            'latitud' => $this->latitud,
            'longitud' => $this->longitud,
            'es_admin' => $this->es_admin,
            'bio' => $this->bio,
            'foto_id' => $this->foto_id,
            'avatar_url' => $this->avatar_url,
        ];
    }
}
