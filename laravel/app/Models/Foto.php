<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Foto del banco de imágenes. Las públicas se ofrecen como portada al crear actividades;
 * las privadas (avatares) solo las usa quien las subió.
 */
class Foto extends Model
{
    use HasFactory;

    protected $table = 'fotos';

    protected $fillable = ['ruta', 'titulo', 'etiquetas', 'autor', 'licencia', 'fuente_url', 'publica', 'subida_por_id'];

    protected function casts(): array
    {
        return ['publica' => 'boolean'];
    }

    protected static function booted(): void
    {
        // Al borrar la fila se borra también el archivo.
        static::deleted(fn (Foto $foto) => Storage::disk('fotos')->delete($foto->ruta));
    }

    public function subidaPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'subida_por_id');
    }

    public function getUrlAttribute(): string
    {
        return Storage::disk('fotos')->url($this->ruta);
    }

    /** Etiquetas como lista ("padel, deporte" → ['padel', 'deporte']). */
    public function getListaEtiquetasAttribute(): array
    {
        return array_values(array_filter(array_map('trim', explode(',', $this->etiquetas))));
    }

    /**
     * Normaliza etiquetas escritas por personas: minúsculas, sin acentos ni duplicados.
     * Acepta un texto separado por comas o una lista.
     */
    public static function normalizarEtiquetas(string|array $etiquetas): string
    {
        $lista = is_array($etiquetas) ? $etiquetas : explode(',', $etiquetas);
        $limpias = array_unique(array_filter(
            array_map(fn (string $e) => trim(preg_replace('/\s+/', ' ', Str::lower(Str::ascii($e)))), $lista),
            fn (string $e) => $e !== '' && mb_strlen($e) <= 30,
        ));

        return Str::limit(implode(', ', $limpias), 250, '');
    }

    /** Palabras que no aportan nada a la búsqueda ("Pádel de tarde" → "padel", "tarde"). */
    private const PALABRAS_VACIAS = ['de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'con', 'sin', 'por', 'para', 'en', 'al', 'y', 'o', 'a', 'the', 'of', 'and'];

    /**
     * Fotos del banco cuyo título o etiquetas contienen alguna de las palabras del texto
     * (sin distinguir acentos ni mayúsculas), las que más palabras cumplen primero.
     */
    public function scopeBuscar(Builder $query, ?string $texto): Builder
    {
        $palabras = array_values(array_filter(
            preg_split('/[^a-z0-9]+/', Str::lower(Str::ascii($texto ?? ''))),
            fn (string $p) => mb_strlen($p) >= 2 && ! in_array($p, self::PALABRAS_VACIAS, true),
        ));

        $query->where('publica', true);
        if ($palabras === []) {
            return $query;
        }

        $coincide = "(etiquetas LIKE ? OR LOWER(COALESCE(titulo, '')) LIKE ?)";
        $parametros = [];
        foreach ($palabras as $palabra) {
            array_push($parametros, "%{$palabra}%", "%{$palabra}%");
        }

        $query->where(function (Builder $q) use ($palabras, $coincide) {
            foreach ($palabras as $palabra) {
                $q->orWhereRaw($coincide, ["%{$palabra}%", "%{$palabra}%"]);
            }
        });

        // Relevancia: cuántas de las palabras coinciden en cada foto.
        $relevancia = implode(' + ', array_fill(0, count($palabras), "(CASE WHEN {$coincide} THEN 1 ELSE 0 END)"));

        return $query->orderByRaw("{$relevancia} DESC", $parametros);
    }
}
