<?php

namespace App\Console\Commands;

use App\Models\Foto;
use App\Services\AlmacenFotos;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Rellena el banco de fotos con imágenes libres (CC0 y CC BY) de Openverse,
 * según los temas de `config/fotos.php`. Se puede repetir: no duplica fotos.
 */
class ImportarFotos extends Command
{
    protected $signature = 'fotos:importar
        {--tema=* : Solo estos temas (por defecto, todos los de config/fotos.php)}
        {--por-tema=6 : Fotos que se intentan guardar por tema}';

    protected $description = 'Importa fotos con licencia libre de Openverse al banco de fotos';

    private const API = 'https://api.openverse.org/v1/images/';

    public function handle(AlmacenFotos $almacen): int
    {
        $temas = config('fotos.temas');
        if ($filtro = $this->option('tema')) {
            $temas = array_intersect_key($temas, array_flip($filtro));
        }
        $porTema = max(1, (int) $this->option('por-tema'));
        $total = 0;

        foreach ($temas as $tema => $consultas) {
            $guardadas = 0;

            foreach ($consultas as $consulta) {
                if ($guardadas >= $porTema) {
                    break;
                }

                foreach ($this->buscar($consulta) as $resultado) {
                    if ($guardadas >= $porTema) {
                        break;
                    }
                    if (Foto::where('fuente_url', $resultado['foreign_landing_url'])->exists()) {
                        continue;
                    }
                    if ($this->guardar($almacen, $tema, $resultado)) {
                        $guardadas++;
                    }
                }
            }

            $this->line(sprintf('  %-16s %d fotos nuevas', $tema, $guardadas));
            $total += $guardadas;
        }

        $this->info("Importadas {$total} fotos. Banco: ".Foto::where('publica', true)->count().' fotos públicas.');

        return self::SUCCESS;
    }

    /**
     * Resultados apaisados y con tamaño suficiente para servir de portada.
     * Se filtra en local: los filtros de Openverse (formato, tamaño) dejan muy pocos resultados.
     */
    private function buscar(string $consulta): array
    {
        try {
            $respuesta = Http::acceptJson()->timeout(20)->get(self::API, [
                'q' => $consulta,
                'license' => 'cc0,by',
                'mature' => 'false',
                'page_size' => 20,
            ]);
        } catch (Throwable $e) {
            $this->warn("  Openverse no respondió para «{$consulta}»: {$e->getMessage()}");

            return [];
        }

        if (! $respuesta->ok()) {
            $this->warn("  Openverse devolvió {$respuesta->status()} para «{$consulta}»");

            return [];
        }

        return array_filter(
            $respuesta->json('results', []),
            fn (array $r) => ($r['width'] ?? 0) >= 640 && ($r['width'] ?? 0) >= ($r['height'] ?? 1),
        );
    }

    private function guardar(AlmacenFotos $almacen, string $tema, array $r): bool
    {
        try {
            $imagen = Http::timeout(30)->get($r['url']);
            if (! $imagen->ok() || ! str_starts_with($imagen->header('Content-Type') ?? '', 'image/')) {
                return false;
            }

            Foto::create([
                'ruta' => $almacen->guardar($imagen->body(), 'banco'),
                'titulo' => mb_substr($r['title'] ?? '', 0, 150) ?: null,
                'etiquetas' => Foto::normalizarEtiquetas(array_merge(
                    [$tema],
                    array_slice(array_column($r['tags'] ?? [], 'name'), 0, 8),
                )),
                'autor' => mb_substr($r['creator'] ?? '', 0, 150) ?: null,
                'licencia' => $r['license'],
                'fuente_url' => $r['foreign_landing_url'],
                'publica' => true,
            ]);

            return true;
        } catch (Throwable $e) {
            $this->warn("  No se pudo guardar «{$r['title']}»: {$e->getMessage()}");

            return false;
        }
    }
}
