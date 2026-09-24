<?php

namespace App\Models;

use App\Enums\TipoActividad;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Actividad extends Model
{
    use HasFactory;

    protected $table = 'actividades';

    protected $fillable = [
        'titulo', 'descripcion', 'fecha_hora_inicio', 'tipo',
        'ubicacion', 'ciudad', 'latitud', 'longitud', 'aforo', 'foto_id',
    ];

    protected function casts(): array
    {
        return [
            'fecha_hora_inicio' => 'datetime',
            'tipo' => TipoActividad::class,
            'latitud' => 'float',
            'longitud' => 'float',
            'predeterminada' => 'boolean',
        ];
    }

    /** Usuario que creó la actividad (null en las predeterminadas). */
    public function creador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'creado_por_id');
    }

    /** Foto de portada elegida del banco (o subida por el creador). */
    public function foto(): BelongsTo
    {
        return $this->belongsTo(Foto::class);
    }

    public function inscritos(): BelongsToMany
    {
        return $this->belongsToMany(Usuario::class, 'inscripciones', 'actividad_id', 'usuario_id')
            ->withTimestamps();
    }

    /** Chat entre las personas inscritas. */
    public function mensajes(): HasMany
    {
        return $this->hasMany(Mensaje::class);
    }

    public function denunciantes(): BelongsToMany
    {
        return $this->belongsToMany(Usuario::class, 'denuncias_actividades', 'actividad_id', 'usuario_id')
            ->withTimestamps();
    }

    /**
     * Añade a la consulta el creador, la portada, los asistentes (con su avatar), los contadores
     * de inscritos/denuncias y, si hay usuario, si está inscrito o ya ha denunciado la actividad.
     */
    public function scopeConEstadoDe(Builder $query, ?Usuario $usuario): Builder
    {
        return $query
            ->with(['creador:id,nombre,foto_id', 'creador.foto', 'foto', 'inscritos:id,nombre,foto_id', 'inscritos.foto'])
            ->withCount(['inscritos', 'denunciantes as denuncias_count'])
            ->when($usuario, fn (Builder $q) => $q->withExists([
                'inscritos as inscrito' => fn (Builder $r) => $r->where('usuarios.id', $usuario->id),
                'denunciantes as denunciada' => fn (Builder $r) => $r->where('usuarios.id', $usuario->id),
            ]));
    }

    public function haComenzado(): bool
    {
        return $this->fecha_hora_inicio->isPast();
    }

    public function estaCompleta(): bool
    {
        return $this->inscritos()->count() >= $this->aforo;
    }
}
