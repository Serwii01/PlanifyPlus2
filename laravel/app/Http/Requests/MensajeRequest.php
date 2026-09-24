<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MensajeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'texto' => ['required', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'texto.required' => 'Escribe algo antes de enviar.',
            'texto.max' => 'El mensaje no puede superar los 1000 caracteres.',
        ];
    }
}
