import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { proximidad } from '../../core/fechas';
import { distanciaAActividad, formatearDistancia } from '../../core/geo';
import { Actividad } from '../../core/modelos';
import { Sesion } from '../../core/sesion';
import { Avatar } from '../avatar/avatar';
import { Icono } from '../icono/icono';

/**
 * Tarjeta de actividad de los listados. Los botones dependen de quién la mira:
 * creador (Editar/Eliminar), admin (Eliminar) o resto (Inscribirse/Inscrito).
 */
@Component({
  selector: 'app-tarjeta-actividad',
  imports: [DatePipe, TitleCasePipe, Icono, Avatar],
  templateUrl: './tarjeta-actividad.html',
  styleUrl: './tarjeta-actividad.css',
})
export class TarjetaActividad {
  protected readonly sesion = inject(Sesion);
  private readonly router = inject(Router);

  readonly actividad = input.required<Actividad>();
  /** En el perfil todas las tarjetas muestran el botón de inscripción, aunque seas el creador. */
  readonly soloInscripcion = input(false);

  readonly abrir = output<Actividad>();
  readonly inscribir = output<Actividad>();
  readonly editar = output<Actividad>();
  readonly eliminar = output<Actividad>();

  protected readonly proximidad = computed(() => proximidad(this.actividad().fecha_hora_inicio));
  protected readonly esCreador = computed(
    () => !this.soloInscripcion() && this.actividad().creador_id === this.sesion.usuario()?.id,
  );
  /** Distancia desde la dirección o ciudad del usuario; null si no se puede calcular. */
  protected readonly distancia = computed(() => {
    const km = distanciaAActividad(this.sesion.usuario(), this.actividad());
    return km === null ? null : formatearDistancia(km);
  });
  protected readonly esAdmin = computed(() => this.sesion.esAdmin() && !this.soloInscripcion());
  protected readonly completa = computed(() => this.actividad().inscritos >= this.actividad().aforo);

  protected irALogin(): void {
    this.router.navigate(['/login']);
  }
}
