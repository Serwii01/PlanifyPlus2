import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Cabecera } from '../../compartido/cabecera/cabecera';
import { Icono } from '../../compartido/icono/icono';

/** Página para rutas que no existen: en lugar de redirigir en silencio, se explica y se ofrece salida. */
@Component({
  selector: 'app-no-encontrada',
  imports: [RouterLink, Cabecera, Icono],
  template: `
    <app-cabecera />
    <main class="contenedor pagina">
      <div class="panel vacio">
        <app-icono nombre="brujula" [tamano]="40" />
        <span class="codigo">404</span>
        <h1>Esta página no existe</h1>
        <p>Puede que el enlace esté mal escrito o que la actividad o el perfil ya se hayan eliminado.</p>
        <div class="botones">
          <a routerLink="/" class="btn btn-primario">Ir al inicio</a>
          <a routerLink="/perfil" class="btn btn-secundario">Mi perfil</a>
        </div>
      </div>
    </main>
  `,
  styles: `
    .pagina {
      padding-top: 48px;
      padding-bottom: 60px;
    }

    .vacio {
      max-width: 520px;
      margin: 0 auto;
      padding: 48px 32px;
    }

    .codigo {
      font-family: var(--fuente-titulos);
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.2em;
      color: var(--tinta-3);
    }

    h1 {
      font-size: 28px;
    }

    .botones {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;
      margin-top: 12px;
    }
  `,
})
export class NoEncontrada {}
