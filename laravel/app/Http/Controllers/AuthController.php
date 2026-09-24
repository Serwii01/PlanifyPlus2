<?php

namespace App\Http\Controllers;

use App\Http\Requests\RegistroRequest;
use App\Http\Resources\UsuarioResource;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;

class AuthController
{
    public function registro(RegistroRequest $request): JsonResponse
    {
        $usuario = Usuario::create($request->validated());

        return $this->respuestaConToken($usuario)->setStatusCode(Response::HTTP_CREATED);
    }

    public function login(Request $request): JsonResponse
    {
        $credenciales = $request->validate([
            'email' => ['required', 'email'],
            'contrasena' => ['required', 'string'],
        ], [
            'email.required' => 'Introduce el correo electrónico.',
            'email.email' => 'Introduce un correo electrónico válido.',
            'contrasena.required' => 'Introduce la contraseña.',
        ]);

        $usuario = Usuario::whereRaw('LOWER(email) = ?', [mb_strtolower($credenciales['email'])])->first();

        if (! $usuario) {
            return response()->json(['message' => 'No existe ninguna cuenta con ese correo.'], Response::HTTP_NOT_FOUND);
        }

        if (! Hash::check($credenciales['contrasena'], $usuario->contrasena)) {
            return response()->json(['message' => 'La contraseña que has introducido no es correcta.'], Response::HTTP_UNAUTHORIZED);
        }

        return $this->respuestaConToken($usuario);
    }

    /**
     * Emite un token nuevo a partir del actual, aunque ya haya caducado
     * (mientras esté dentro de `jwt.refresh_ttl`). El antiguo queda invalidado.
     */
    public function refresh(): JsonResponse
    {
        try {
            $token = auth()->refresh();
        } catch (JWTException) {
            return response()->json(['message' => 'La sesión ha caducado.'], Response::HTTP_UNAUTHORIZED);
        }

        return response()->json(['token' => $token, 'expira_en' => $this->segundosDeValidez()]);
    }

    public function logout(): Response
    {
        auth()->logout();

        return response()->noContent();
    }

    private function respuestaConToken(Usuario $usuario): JsonResponse
    {
        return response()->json([
            'usuario' => new UsuarioResource($usuario),
            'token' => auth()->login($usuario),
            'expira_en' => $this->segundosDeValidez(),
        ]);
    }

    private function segundosDeValidez(): int
    {
        return auth()->factory()->getTTL() * 60;
    }
}
