<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenExpiredException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\PostTooLargeException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Límite global de la API por usuario/IP (los endpoints sensibles tienen el suyo propio).
        $middleware->throttleApi('120,1');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // La API siempre responde en JSON (también los errores 401/403/404/422).
        $exceptions->shouldRenderJsonWhen(fn () => true);

        // Cada error lleva un `message` en español pensado para mostrarse tal cual en la interfaz.
        $error = fn (string $mensaje, int $codigo, array $extra = []) => response()->json(['message' => $mensaje] + $extra, $codigo);

        $exceptions->render(fn (AuthenticationException $e) => $error('Tu sesión ha caducado. Vuelve a iniciar sesión.', 401));
        $exceptions->render(fn (TokenExpiredException $e) => $error('Tu sesión ha caducado. Vuelve a iniciar sesión.', 401));
        $exceptions->render(fn (JWTException $e) => $error('Tu sesión no es válida. Vuelve a iniciar sesión.', 401));

        $exceptions->render(fn (AccessDeniedHttpException $e) => $error(
            $e->getMessage() && $e->getMessage() !== 'This action is unauthorized.' ? $e->getMessage() : 'No tienes permiso para hacer eso.',
            403,
        ));

        // Nombre legible de cada modelo para los 404 de rutas con binding ("Esa actividad ya no existe").
        $nombresModelos = [
            'App\Models\Actividad' => 'Esa actividad',
            'App\Models\Usuario' => 'Ese perfil',
            'App\Models\Mensaje' => 'Ese mensaje',
            'App\Models\Foto' => 'Esa foto',
        ];

        $exceptions->render(function (NotFoundHttpException $e) use ($error, $nombresModelos) {
            $previa = $e->getPrevious();
            $modelo = $previa instanceof ModelNotFoundException ? ($nombresModelos[$previa->getModel()] ?? 'Ese elemento') : null;

            return $error($modelo ? "$modelo ya no existe o se ha eliminado." : 'No encontramos lo que buscas.', 404);
        });

        $exceptions->render(fn (MethodNotAllowedHttpException $e) => $error('Esa operación no está permitida.', 405));
        $exceptions->render(fn (PostTooLargeException $e) => $error('El archivo es demasiado grande.', 413));

        $exceptions->render(fn (ValidationException $e) => $error(
            'Revisa los datos del formulario.',
            422,
            ['errors' => $e->errors()],
        ));

        $exceptions->render(function (ThrottleRequestsException $e) use ($error) {
            $segundos = (int) ($e->getHeaders()['Retry-After'] ?? 60);

            return $error("Demasiadas peticiones seguidas. Espera {$segundos} segundos e inténtalo de nuevo.", 429, ['retry_after' => $segundos])
                ->withHeaders($e->getHeaders());
        });

        // Cualquier otro error HTTP con mensaje propio (abort(409, '...')) se devuelve tal cual.
        $exceptions->render(function (HttpExceptionInterface $e) use ($error) {
            $mensaje = $e->getMessage() ?: 'No se pudo completar la operación.';

            return $error($mensaje, $e->getStatusCode())->withHeaders($e->getHeaders());
        });

        // Errores inesperados: nunca se filtran detalles internos fuera de depuración.
        $exceptions->render(function (Throwable $e, Request $request) use ($error) {
            if (config('app.debug')) {
                return null; // deja que Laravel muestre la traza completa
            }

            report($e);

            return $error('Algo ha fallado en el servidor. Inténtalo de nuevo en unos minutos.', 500);
        });
    })->create();
