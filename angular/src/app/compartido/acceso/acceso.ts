import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from '../icono/icono';

/** Maqueta a dos columnas de las pantallas de acceso (login y registro). */
@Component({
  selector: 'app-acceso',
  imports: [RouterLink, Icono],
  templateUrl: './acceso.html',
  styleUrl: './acceso.css',
})
export class Acceso {
  readonly titulo = input.required<string>();
  readonly subtitulo = input.required<string>();
}
