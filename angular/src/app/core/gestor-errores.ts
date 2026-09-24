import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, inject, Injectable } from '@angular/core';
import { Avisos } from './avisos';

/** Tiempo mínimo entre dos avisos de error inesperado, para no inundar la pantalla. */
const SILENCIO_ENTRE_AVISOS = 4000;

/**
 * Último recurso para los errores que nadie ha capturado (fallos de programación, promesas
 * rechazadas sin `catch`...). Los registra en consola y muestra un aviso genérico a la persona,
 * sin exponer detalles técnicos. Los errores HTTP ya los gestiona cada pantalla.
 */
@Injectable()
export class GestorErrores implements ErrorHandler {
  private readonly avisos = inject(Avisos);
  private ultimoAviso = 0;

  handleError(error: unknown): void {
    const causa = (error as { rejection?: unknown })?.rejection ?? error;
    console.error('[PlanifyPlus] Error no controlado:', causa);

    // Un 401 tras fallar la renovación ya redirige al acceso; no hace falta otro aviso.
    if (causa instanceof HttpErrorResponse && causa.status === 401) return;

    const ahora = Date.now();
    if (ahora - this.ultimoAviso < SILENCIO_ENTRE_AVISOS) return;
    this.ultimoAviso = ahora;

    if (causa instanceof HttpErrorResponse) {
      this.avisos.errorDeApi(causa, 'No se pudo completar la operación.');
    } else {
      this.avisos.error('Algo ha salido mal. Recarga la página y, si sigue pasando, avísanos.');
    }
  }
}
