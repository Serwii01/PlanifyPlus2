import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Avisos } from './avisos';
import { Sesion, SIN_RENOVACION } from './sesion';

/**
 * Añade el JWT a las peticiones a la API (no a servicios externos como Nominatim)
 * y, si el token ha caducado, lo renueva una vez y repite la petición. Si tampoco se
 * puede renovar, cierra la sesión local y lleva a la pantalla de acceso con un aviso.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  const sesion = inject(Sesion);
  const router = inject(Router);
  const avisos = inject(Avisos);

  return next(conToken(req, sesion.token)).pipe(
    catchError((error: unknown) => {
      const caducado = error instanceof HttpErrorResponse && error.status === 401;
      if (!caducado || req.context.get(SIN_RENOVACION) || !sesion.token) return throwError(() => error);

      const estabaConectado = sesion.haySesion();

      return from(sesion.renovar()).pipe(
        switchMap((token) => {
          if (token) return next(conToken(req, token));

          // La sesión ya no se puede recuperar: se avisa una sola vez y se vuelve al acceso.
          if (estabaConectado) {
            avisos.info('Tu sesión ha caducado. Vuelve a iniciar sesión para continuar.');
            router.navigate(['/login']);
          }
          return throwError(() => error);
        }),
      );
    }),
  );
};

function conToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return req.clone({ setHeaders: headers });
}
