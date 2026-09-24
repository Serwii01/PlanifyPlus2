<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PerfilRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['required', 'email', 'max:255', Rule::unique('usuarios', 'email')->ignore($this->user())],
            'contrasena' => ['nullable', 'string', 'min:6', 'max:72'],
            'ciudad' => ['required', Rule::in(array_keys(config('ciudades')))],
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
            'nombre.required' => 'Nombre, correo y ciudad son obligatorios.',
            'nombre.min' => 'El nombre debe tener al menos 2 caracteres.',
            'email.required' => 'Nombre, correo y ciudad son obligatorios.',
            'email.email' => 'Introduce un correo electrónico válido (ej: usuario@dominio.com).',
            'email.unique' => 'Ese correo electrónico ya está registrado por otro usuario.',
            'contrasena.min' => 'La contraseña debe tener al menos 6 caracteres.',
            'contrasena.max' => 'La contraseña es demasiado larga.',
            'nombre.max' => 'El nombre no puede superar los 100 caracteres.',
            'ciudad.required' => 'Nombre, correo y ciudad son obligatorios.',
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
