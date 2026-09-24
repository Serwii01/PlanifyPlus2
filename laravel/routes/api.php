<?php

use App\Http\Controllers\ActividadController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DenunciaController;
use App\Http\Controllers\FotoController;
use App\Http\Controllers\InscripcionController;
use App\Http\Controllers\MensajeController;
use App\Http\Controllers\PerfilController;
use App\Http\Controllers\SeguimientoController;
use App\Http\Controllers\SocialController;
use App\Http\Controllers\UsuarioController;
use Illuminate\Support\Facades\Route;

// Rutas públicas
Route::post('registro', [AuthController::class, 'registro'])->middleware('throttle:5,1');
Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('refresh', [AuthController::class, 'refresh']);
Route::get('ciudades', fn () => array_keys(config('ciudades')));
Route::get('actividades', [ActividadController::class, 'index']);
Route::get('actividades/{actividad}', [ActividadController::class, 'show']);
Route::get('usuarios/{usuario}', [UsuarioController::class, 'mostrar']);
Route::get('usuarios/{usuario}/seguidores', [SeguimientoController::class, 'seguidores']);
Route::get('usuarios/{usuario}/seguidos', [SeguimientoController::class, 'seguidos']);

// Rutas con sesión iniciada
Route::middleware('auth:api')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);

    Route::get('perfil', [PerfilController::class, 'mostrar']);
    Route::put('perfil', [PerfilController::class, 'actualizar']);

    Route::post('actividades', [ActividadController::class, 'store']);
    Route::put('actividades/{actividad}', [ActividadController::class, 'update']);
    Route::delete('actividades/{actividad}', [ActividadController::class, 'destroy']);

    Route::get('inscripciones', [InscripcionController::class, 'index']);
    Route::post('actividades/{actividad}/inscripcion', [InscripcionController::class, 'store']);
    Route::delete('actividades/{actividad}/inscripcion', [InscripcionController::class, 'destroy']);

    Route::post('actividades/{actividad}/denuncia', [DenunciaController::class, 'store']);

    // Chat de la actividad (solo personas inscritas; el admin lee y modera)
    Route::get('actividades/{actividad}/mensajes', [MensajeController::class, 'index']);
    Route::post('actividades/{actividad}/mensajes', [MensajeController::class, 'store'])->middleware('throttle:30,1');
    Route::delete('mensajes/{mensaje}', [MensajeController::class, 'destroy']);

    // Red social
    Route::post('usuarios/{usuario}/seguir', [SeguimientoController::class, 'store']);
    Route::delete('usuarios/{usuario}/seguir', [SeguimientoController::class, 'destroy']);
    Route::get('social/sugerencias', [SocialController::class, 'sugerencias']);
    Route::get('social/planes', [SocialController::class, 'planes']);

    Route::get('fotos', [FotoController::class, 'index']);
    Route::post('fotos', [FotoController::class, 'store']);
});
