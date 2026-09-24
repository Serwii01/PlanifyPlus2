<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class Usuario extends Authenticatable implements JWTSubject
{
    use HasFactory;

    protected $table = 'usuarios';

    protected $fillable = ['nombre', 'email', 'contrasena', 'ciudad', 'direccion', 'latitud', 'longitud', 'foto_id', 'bio'];

    protected $hidden = ['contrasena'];

    // Mismo valor por defecto que en la base de datos, para que el usuario recién
    // registrado ya se devuelva con `es_admin = false` sin tener que recargarlo.
    protected $attributes = ['es_admin' => false];

    protected function casts(): array
    {
        return [
            'contrasena' => 'hashed',
            'es_admin' => 'boolean',
            'latitud' => 'float',
            'longitud' => 'float',
        ];
    }

    public function getAuthPasswordName(): string
    {
        return 'contrasena';
    }

    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [];
    }

    /**
     * Las coordenadas del usuario son las de su dirección exacta si la ha indicado;
     * si no, las del centro de su ciudad. Se recalculan en cada guardado para que
     * cambiar de ciudad o borrar la dirección las mantenga coherentes.
     */
    protected static function booted(): void
    {
        static::saving(function (Usuario $usuario) {
            if (blank($usuario->direccion)) {
                $usuario->direccion = null;
                [$usuario->latitud, $usuario->longitud] = config('ciudades')[$usuario->ciudad] ?? [0.0, 0.0];
            }
        });
    }

    /** Foto de perfil (avatar). */
    public function foto(): BelongsTo
    {
        return $this->belongsTo(Foto::class);
    }

    public function getAvatarUrlAttribute(): ?string
    {
        return $this->foto?->url;
    }

    public function actividadesCreadas(): HasMany
    {
        return $this->hasMany(Actividad::class, 'creado_por_id');
    }

    public function inscripciones(): BelongsToMany
    {
        return $this->belongsToMany(Actividad::class, 'inscripciones', 'usuario_id', 'actividad_id')
            ->withTimestamps();
    }

    /** Personas a las que sigue este usuario. */
    public function seguidos(): BelongsToMany
    {
        return $this->belongsToMany(Usuario::class, 'seguimientos', 'seguidor_id', 'seguido_id')
            ->withTimestamps();
    }

    /** Personas que siguen a este usuario. */
    public function seguidores(): BelongsToMany
    {
        return $this->belongsToMany(Usuario::class, 'seguimientos', 'seguido_id', 'seguidor_id')
            ->withTimestamps();
    }

    public function mensajes(): HasMany
    {
        return $this->hasMany(Mensaje::class);
    }

    public function estaInscritoEn(Actividad $actividad): bool
    {
        return $this->inscripciones()->where('actividades.id', $actividad->id)->exists();
    }

    /**
     * Añade a la consulta el avatar, los contadores de seguidores/seguidos y, si hay usuario
     * en sesión, si lo sigue (`lo_sigo`) y si le sigue (`me_sigue`). Equivalente a `Actividad::conEstadoDe`.
     */
    public function scopeConEstadoDe(Builder $query, ?Usuario $usuario): Builder
    {
        return $query
            ->with('foto')
            ->withCount(['seguidores', 'seguidos'])
            ->when($usuario, fn (Builder $q) => $q->withExists([
                'seguidores as lo_sigo' => fn (Builder $r) => $r->whereKey($usuario->id),
                'seguidos as me_sigue' => fn (Builder $r) => $r->whereKey($usuario->id),
            ]));
    }
}
