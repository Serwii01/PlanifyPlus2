import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UsuarioBreve } from '../../core/modelos';
import { Sesion } from '../../core/sesion';
import { Avatar } from '../avatar/avatar';
import { BotonSeguir } from '../boton-seguir/boton-seguir';
import { Icono } from '../icono/icono';

/** Ficha de una persona en los listados sociales: avatar, ciudad, relación contigo y botón de seguir. */
@Component({
  selector: 'app-tarjeta-persona',
  imports: [RouterLink, Avatar, Icono, BotonSeguir],
  templateUrl: './tarjeta-persona.html',
  styleUrl: './tarjeta-persona.css',
})
export class TarjetaPersona {
  protected readonly sesion = inject(Sesion);

  readonly persona = input.required<UsuarioBreve>();
  /** Ficha actualizada tras seguir o dejar de seguir. */
  readonly cambio = output<UsuarioBreve>();
}
