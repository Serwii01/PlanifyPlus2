import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Avisos } from '../../core/avisos';
import { UsuarioBreve } from '../../core/modelos';
import { Sesion } from '../../core/sesion';
import { UsuariosApi } from '../../core/usuarios-api';
import { Icono } from '../icono/icono';

/**
 * Botón "Seguir / Siguiendo" de una persona. Llama a la API y emite la ficha actualizada
 * para que quien lo use refresque contadores. No se muestra para uno mismo, sin sesión ni al admin.
 */
@Component({
  selector: 'app-boton-seguir',
  imports: [Icono],
  template: `
    @if (visible()) {
      <button
        type="button"
        class="btn btn-pequeno"
        [class.btn-primario]="!loSigo()"
        [class.btn-secundario]="loSigo()"
        [class.siguiendo]="loSigo()"
        [disabled]="trabajando()"
        (click)="alternar($event)"
        [title]="loSigo() ? 'Dejar de seguir' : 'Seguir'"
      >
        <app-icono [nombre]="loSigo() ? 'usuario-check' : 'usuario-mas'" [tamano]="14" />
        <span>{{ loSigo() ? 'Siguiendo' : 'Seguir' }}</span>
      </button>
    }
  `,
  styles: `
    .siguiendo:hover span {
      display: none;
    }

    .siguiendo:hover::after {
      content: 'Dejar de seguir';
    }
  `,
})
export class BotonSeguir {
  private readonly sesion = inject(Sesion);
  private readonly api = inject(UsuariosApi);
  private readonly avisos = inject(Avisos);

  readonly usuarioId = input.required<number>();
  readonly loSigo = input.required<boolean>();
  /** Ficha actualizada tras seguir o dejar de seguir. */
  readonly cambio = output<UsuarioBreve>();

  protected readonly trabajando = signal(false);
  protected readonly visible = computed(
    () => this.sesion.haySesion() && !this.sesion.esAdmin() && this.sesion.usuario()?.id !== this.usuarioId(),
  );

  protected async alternar(evento: Event): Promise<void> {
    evento.stopPropagation();
    this.trabajando.set(true);
    try {
      const ficha = this.loSigo() ? await this.api.dejarDeSeguir(this.usuarioId()) : await this.api.seguir(this.usuarioId());
      this.cambio.emit(ficha);
      if (ficha.lo_sigo) this.avisos.exito(`Ahora sigues a ${ficha.nombre}.`);
    } catch (error) {
      this.avisos.errorDeApi(error, 'No se pudo actualizar el seguimiento.');
    } finally {
      this.trabajando.set(false);
    }
  }
}
