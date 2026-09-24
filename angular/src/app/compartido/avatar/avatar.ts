import { Component, computed, input } from '@angular/core';
import { iniciales } from '../../core/fechas';

/** Paleta sobria para los avatares sin foto; cada nombre recibe siempre el mismo color. */
const COLORES_AVATAR = ['#3730a3', '#1d6f6a', '#b3512a', '#5f6b1c', '#7c2d5a', '#0f4c81', '#8a5a00', '#4a4a6a'];

/** Avatar de una persona: su foto si la tiene y, si no, sus iniciales sobre un color plano. */
@Component({
  selector: 'app-avatar',
  template: `
    @if (url(); as url) {
      <img [src]="url" [alt]="nombre()" [style.width.px]="tamano()" [style.height.px]="tamano()" loading="lazy" />
    } @else {
      <span
        class="iniciales"
        [style.background]="color()"
        [style.width.px]="tamano()"
        [style.height.px]="tamano()"
        [style.font-size.px]="tamano() * 0.38"
      >
        {{ iniciales() }}
      </span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
      border-radius: 50%;
      box-shadow: var(--relieve-s);
      background: var(--superficie);
      padding: 2px;
    }

    img,
    .iniciales {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      object-fit: cover;
    }

    .iniciales {
      color: #fff;
      font-family: var(--fuente-titulos);
      font-weight: 600;
      letter-spacing: 0.02em;
    }
  `,
})
export class Avatar {
  readonly nombre = input('');
  readonly url = input<string | null | undefined>(null);
  /** Diámetro en píxeles. */
  readonly tamano = input(36);

  protected readonly iniciales = computed(() => iniciales(this.nombre() || 'P+'));

  protected readonly color = computed(() => {
    const nombre = this.nombre();
    if (!nombre) return 'var(--tinta)'; // "Plan de la comunidad"
    let suma = 0;
    for (const c of nombre) suma = (suma * 31 + c.charCodeAt(0)) >>> 0;
    return COLORES_AVATAR[suma % COLORES_AVATAR.length];
  });
}
