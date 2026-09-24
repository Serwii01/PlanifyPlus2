import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  tipo: 'exito' | 'error' | 'info';
  texto: string;
}

export interface Confirmacion {
  titulo: string;
  mensaje: string;
  textoAceptar: string;
  peligrosa: boolean;
  resolver: (aceptado: boolean) => void;
}

const DURACION_TOAST = 4500;

/** Notificaciones (toasts) y diálogo de confirmación de la aplicación. */
@Injectable({ providedIn: 'root' })
export class Avisos {
  readonly toasts = signal<Toast[]>([]);
  readonly confirmacion = signal<Confirmacion | null>(null);
  private contador = 0;

  exito(texto: string): void {
    this.mostrar('exito', texto);
  }

  error(texto: string): void {
    this.mostrar('error', texto);
  }

  info(texto: string): void {
    this.mostrar('info', texto);
  }

  /** Muestra el mensaje que devuelve la API o, si no hay, el indicado. */
  errorDeApi(error: unknown, mensajePorDefecto: string): void {
    this.error(mensajeDeApi(error, mensajePorDefecto));
  }

  cerrarToast(id: number): void {
    this.toasts.update((lista) => lista.filter((t) => t.id !== id));
  }

  /** Abre un diálogo Aceptar/Cancelar y resuelve con la decisión del usuario. */
  confirmar(titulo: string, mensaje: string, opciones: { textoAceptar?: string; peligrosa?: boolean } = {}): Promise<boolean> {
    return new Promise((resolver) =>
      this.confirmacion.set({
        titulo,
        mensaje,
        textoAceptar: opciones.textoAceptar ?? 'Aceptar',
        peligrosa: opciones.peligrosa ?? false,
        resolver,
      }),
    );
  }

  responder(aceptado: boolean): void {
    this.confirmacion()?.resolver(aceptado);
    this.confirmacion.set(null);
  }

  private mostrar(tipo: Toast['tipo'], texto: string): void {
    const id = ++this.contador;
    this.toasts.update((lista) => [...lista, { id, tipo, texto }]);
    setTimeout(() => this.cerrarToast(id), DURACION_TOAST);
  }
}

/** Errores de validación (422) de la API como `campo → primer mensaje`. */
export function erroresDeApi(error: unknown): Record<string, string> {
  if (!(error instanceof HttpErrorResponse) || error.status !== 422) return {};
  const errores = (error.error?.errors ?? {}) as Record<string, string[]>;
  return Object.fromEntries(Object.entries(errores).map(([campo, mensajes]) => [campo, mensajes[0]]));
}

/**
 * Mensaje que se muestra ante un error de la API: el primer error de validación, el `message`
 * en español que envía el servidor o, si la petición ni siquiera llegó, una explicación del fallo.
 */
export function mensajeDeApi(error: unknown, mensajePorDefecto: string): string {
  if (!(error instanceof HttpErrorResponse)) return mensajePorDefecto;

  if (error.status === 0) return 'No hay conexión con el servidor. Comprueba tu red e inténtalo de nuevo.';
  if (error.status >= 500) return 'El servidor no responde correctamente. Inténtalo de nuevo en unos minutos.';

  const primero = Object.values(erroresDeApi(error))[0];
  const delServidor = typeof error.error?.message === 'string' ? error.error.message : null;
  return primero ?? delServidor ?? mensajePorDefecto;
}
