<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegistroRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['required', 'email', 'max:255', 'unique:usuarios,email'],
            'contrasena' => ['required', 'string', 'min:6', 'max:72'],
            'ciudad' => ['nullable', Rule::in(array_keys(config('ciudades')))],
            // Ubicación exacta opcional: si se envía, hacen falta sus coordenadas.
            'direccion' => ['nullable', 'string', 'max:255'],
            'latitud' => ['nullable', 'required_with:direccion', 'numeric', 'between:-90,90'],
            'longitud' => ['nullable', 'required_with:direccion', 'numeric', 'between:-180,180'],
            'bio' => ['nullable', 'string', 'max:300'],
            'foto_id' => ['nullable', 'integer', Rule::exists('fotos', 'id')],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre es obligatorio.',
            'nombre.min' => 'El nombre debe tener al menos 2 caracteres.',
            'nombre.max' => 'El nombre no puede superar los 100 caracteres.',
            'email.required' => 'Introduce el correo electrónico.',
            'email.email' => 'Introduce un correo electrónico válido.',
            'email.unique' => 'Ese correo ya está registrado.',
            'contrasena.required' => 'Introduce la contraseña.',
            'contrasena.min' => 'La contraseña debe tener al menos 6 caracteres.',
            'contrasena.max' => 'La contraseña es demasiado larga.',
            'ciudad.in' => 'La ciudad seleccionada no está disponible.',
            'direccion.max' => 'La dirección es demasiado larga.',
            'latitud.required_with' => 'Selecciona la dirección en el buscador para obtener sus coordenadas.',
            'longitud.required_with' => 'Selecciona la dirección en el buscador para obtener sus coordenadas.',
            'latitud.between' => 'Las coordenadas de la dirección no son válidas.',
            'longitud.between' => 'Las coordenadas de la dirección no son válidas.',
            'bio.max' => 'La presentación no puede superar los 300 caracteres.',
            'foto_id.exists' => 'La foto de perfil ya no existe.',
        ];
    }
}
