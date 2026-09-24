<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MensajeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'texto' => $this->texto,
            'enviado_en' => $this->created_at->format('Y-m-d\TH:i:s'),
            'usuario' => [
                'id' => $this->usuario->id,
                'nombre' => $this->usuario->nombre,
                'avatar_url' => $this->usuario->avatar_url,
            ],
            'propio' => $this->usuario_id === $request->user()?->id,
        ];
    }
}
