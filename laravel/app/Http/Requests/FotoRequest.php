<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FotoRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'archivo' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:'.config('fotos.tamano_maximo_kb')],
            'etiquetas' => ['required_unless:publica,0,false', 'nullable', 'string', 'max:255'],
            'titulo' => ['nullable', 'string', 'max:150'],
            // true: entra en el banco para que otras personas la usen; false: solo para quien la sube (avatar).
            'publica' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'archivo.required' => 'Elige una imagen.',
            'archivo.image' => 'El archivo debe ser una imagen.',
            'archivo.mimes' => 'Formatos admitidos: JPG, PNG, WebP o GIF.',
            'archivo.max' => 'La imagen no puede pesar más de '.round(config('fotos.tamano_maximo_kb') / 1024).' MB.',
            'etiquetas.required_unless' => 'Pon alguna etiqueta (por ejemplo "pádel, deporte") para que otras personas encuentren la foto.',
            'etiquetas.max' => 'Demasiadas etiquetas.',
        ];
    }
}
