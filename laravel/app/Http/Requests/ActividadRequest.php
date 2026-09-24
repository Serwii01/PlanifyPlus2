<?php

namespace App\Http\Requests;

use App\Enums\TipoActividad;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ActividadRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'min:3', 'max:150'],
            'descripcion' => ['required', 'string', 'min:10', 'max:2000'],
            'fecha_hora_inicio' => ['required', 'date', 'after:now', 'before:+1 year'],
            'tipo' => ['required', Rule::in(array_column(TipoActividad::cases(), 'value'))],
            'ubicacion' => ['required', 'string', 'max:255'],
            'ciudad' => ['required', 'string', 'max:100'],
            'latitud' => ['nullable', 'numeric', 'between:-90,90'],
            'longitud' => ['nullable', 'numeric', 'between:-180,180'],
            'aforo' => ['required', 'integer', 'min:1', 'max:500'],
            'foto_id' => ['nullable', 'integer', Rule::exists('fotos', 'id')],
        ];
    }

    public function messages(): array
    {
        return [
            'titulo.required' => 'El título es obligatorio.',
            'titulo.min' => 'El título debe tener al menos 3 caracteres.',
            'titulo.max' => 'El título no puede superar los 150 caracteres.',
            'descripcion.required' => 'La descripción es obligatoria.',
            'descripcion.min' => 'Cuenta un poco más: al menos 10 caracteres.',
            'descripcion.max' => 'La descripción no puede superar los 2000 caracteres.',
            'fecha_hora_inicio.required' => 'La fecha es obligatoria.',
            'fecha_hora_inicio.date' => 'Formato de fecha u hora inválido.',
            'fecha_hora_inicio.after' => 'La actividad debe tener una fecha y hora futura.',
            'fecha_hora_inicio.before' => 'Solo se pueden publicar actividades con menos de un año de antelación.',
            'tipo.required' => 'Debes seleccionar un tipo de actividad.',
            'tipo.in' => 'El tipo de actividad no es válido.',
            'ubicacion.required' => 'Debes seleccionar una ubicación del buscador.',
            'ciudad.required' => 'La ciudad es obligatoria.',
            'aforo.required' => 'El aforo es obligatorio.',
            'aforo.integer' => 'Formato de aforo inválido.',
            'aforo.min' => 'El aforo debe ser mayor que 0.',
            'aforo.max' => 'El aforo máximo es de 500 plazas.',
            'ubicacion.max' => 'La ubicación es demasiado larga.',
            'ciudad.max' => 'El nombre de la ciudad es demasiado largo.',
            'foto_id.exists' => 'La foto elegida ya no existe.',
        ];
    }
}
