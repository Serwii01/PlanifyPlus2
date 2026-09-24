<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FotoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'url' => $this->url,
            'titulo' => $this->titulo,
            'etiquetas' => $this->lista_etiquetas,
            'autor' => $this->autor,
            'licencia' => $this->licencia,
            'fuente_url' => $this->fuente_url,
            'publica' => $this->publica,
        ];
    }
}
