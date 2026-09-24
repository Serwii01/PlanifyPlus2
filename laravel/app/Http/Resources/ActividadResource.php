<?php

namespace App\Http\Resources;

use App\Models\Actividad;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Representación de una actividad. Espera que la consulta se haya hecho con
 * el scope `conEstadoDe`, que aporta los contadores y los flags del usuario.
 */
class ActividadResource extends JsonResource
{
    /**
     * Vuelve a leer la actividad de la base de datos con su estado para el usuario indicado.
     */
    public static function desde(Actividad $actividad, ?Usuario $usuario): static
    {
        return new static(Actividad::conEstadoDe($usuario)->findOrFail($actividad->id));
    }

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'descripcion' => $this->descripcion,
            'fecha_hora_inicio' => $this->fecha_hora_inicio->format('Y-m-d\TH:i:s'),
            'tipo' => $this->tipo,
            'ubicacion' => $this->ubicacion,
            'ciudad' => $this->ciudad,
            'latitud' => $this->latitud,
            'longitud' => $this->longitud,
            'aforo' => $this->aforo,
            'predeterminada' => $this->predeterminada,
            'creador_id' => $this->creado_por_id,
            'creador' => $this->creador?->nombre,
            'creador_avatar_url' => $this->creador?->avatar_url,
            'foto' => $this->foto ? new FotoResource($this->foto) : null,
            // Primeros asistentes (para los avatares apilados); `inscritos` trae el total.
            'asistentes' => $this->inscritos->take(8)->map(fn (Usuario $u) => [
                'id' => $u->id,
                'nombre' => $u->nombre,
                'avatar_url' => $u->avatar_url,
            ])->values(),
            // Solo en el apartado social: personas a las que sigue el usuario y que van a este plan.
            'seguidos_que_van' => $this->when(isset($this->seguidos_que_van), fn () => $this->seguidos_que_van->map(fn (Usuario $u) => [
                'id' => $u->id,
                'nombre' => $u->nombre,
                'avatar_url' => $u->avatar_url,
            ])->values()),
            'inscritos' => $this->inscritos_count,
            'denuncias' => $this->denuncias_count,
            'inscrito' => (bool) ($this->inscrito ?? false),
            'denunciada' => (bool) ($this->denunciada ?? false),
        ];
    }
}
