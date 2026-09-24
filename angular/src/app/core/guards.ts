import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Sesion } from './sesion';

/** Solo con sesión iniciada. */
export const sesionGuard: CanActivateFn = () =>
  inject(Sesion).haySesion() || inject(Router).createUrlTree(['/login']);

/** Solo usuarios normales: el administrador no crea actividades ni tiene perfil. */
export const usuarioGuard: CanActivateFn = () => {
  const sesion = inject(Sesion);
  if (!sesion.haySesion()) return inject(Router).createUrlTree(['/login']);
  return !sesion.esAdmin() || inject(Router).createUrlTree(['/']);
};
