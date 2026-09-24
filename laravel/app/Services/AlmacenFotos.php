<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;

/**
 * Guarda imágenes en el disco `fotos` redimensionadas (GD) a un ancho máximo
 * y convertidas a JPEG, para que el banco ocupe poco y cargue rápido.
 */
class AlmacenFotos
{
    /**
     * @param  string  $contenido  Bytes de la imagen original (jpeg, png, gif o webp).
     * @param  string  $carpeta  Subcarpeta del disco: "banco" o "subidas".
     * @return string Ruta del archivo guardado, relativa al disco.
     */
    public function guardar(string $contenido, string $carpeta): string
    {
        $imagen = @imagecreatefromstring($contenido);
        if ($imagen === false) {
            throw new InvalidArgumentException('El archivo no es una imagen válida.');
        }

        $ancho = imagesx($imagen);
        $alto = imagesy($imagen);
        $anchoMaximo = (int) config('fotos.ancho_maximo', 1600);

        if ($ancho > $anchoMaximo) {
            $nuevoAlto = (int) round($alto * $anchoMaximo / $ancho);
            $redimensionada = imagecreatetruecolor($anchoMaximo, $nuevoAlto);
            // Fondo blanco para las transparencias de PNG/WebP al pasar a JPEG.
            imagefill($redimensionada, 0, 0, imagecolorallocate($redimensionada, 255, 255, 255));
            imagecopyresampled($redimensionada, $imagen, 0, 0, 0, 0, $anchoMaximo, $nuevoAlto, $ancho, $alto);
            imagedestroy($imagen);
            $imagen = $redimensionada;
        }

        ob_start();
        imagejpeg($imagen, null, 84);
        $jpeg = ob_get_clean();
        imagedestroy($imagen);

        $ruta = trim($carpeta, '/').'/'.Str::uuid().'.jpg';
        Storage::disk('fotos')->put($ruta, $jpeg);

        return $ruta;
    }
}
