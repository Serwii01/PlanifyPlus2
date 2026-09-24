import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Sesion } from '../../core/sesion';
import { Avatar } from '../avatar/avatar';
import { Icono } from '../icono/icono';

/** Barra superior común: marca, hueco para el buscador y accesos según la sesión. */
@Component({
  selector: 'app-cabecera',
  imports: [RouterLink, Icono, Avatar],
  templateUrl: './cabecera.html',
  styleUrl: './cabecera.css',
})
export class Cabecera {
  protected readonly sesion = inject(Sesion);
  private readonly router = inject(Router);

  protected async cerrarSesion(): Promise<void> {
    await this.sesion.logout();
    this.router.navigate(['/']);
  }
}
