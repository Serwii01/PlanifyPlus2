import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Avatar } from '../../compartido/avatar/avatar';
import { Cabecera } from '../../compartido/cabecera/cabecera';
import { Icono } from '../../compartido/icono/icono';
import { TarjetaActividad } from '../../compartido/tarjeta-actividad/tarjeta-actividad';
import { ActividadesApi } from '../../core/actividades-api';
import { Avisos } from '../../core/avisos';
import { proximidad } from '../../core/fechas';
import { Actividad } from '../../core/modelos';
import { UsuariosApi } from '../../core/usuarios-api';
import { Sesion } from '../../core/sesion';

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

type Vista = 'proximas' | 'historial';
type FiltroHistorial = 'todas' | 'organizadas' | 'asistidas';

/** Perfil del usuario: resumen, red social, próximas actividades, historial y calendario mensual que filtra por día. */
@Component({
  selector: 'app-perfil',
  imports: [DatePipe, TitleCasePipe, RouterLink, Cabecera, Icono, Avatar, TarjetaActividad],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil {
  protected readonly sesion = inject(Sesion);
  private readonly api = inject(ActividadesApi);
  private readonly usuarios = inject(UsuariosApi);
  private readonly avisos = inject(Avisos);
  private readonly router = inject(Router);

  protected readonly diasSemana = DIAS_SEMANA;
  protected readonly inscritas = signal<Actividad[]>([]);
  protected readonly cargando = signal(true);
  /** Primer día del mes mostrado en el calendario. */
  protected readonly mes = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  /** Día (AAAA-MM-DD) elegido en el calendario para filtrar la lista; null muestra todas. */
  protected readonly diaSeleccionado = signal<string | null>(null);
  /** Pestaña activa del listado. */
  protected readonly vista = signal<Vista>('proximas');
  protected readonly filtroHistorial = signal<FiltroHistorial>('todas');
  /** Cifras sociales (vienen del perfil público propio). */
  protected readonly red = signal({ seguidores: 0, seguidos: 0 });

  protected readonly hoy = fechaCorta(new Date());

  protected readonly proximas = computed(() => this.inscritas().filter((a) => !proximidad(a.fecha_hora_inicio).finalizada));
  protected readonly pasadas = computed(() => this.inscritas().filter((a) => proximidad(a.fecha_hora_inicio).finalizada).reverse());
  protected readonly creadas = computed(() => this.inscritas().filter((a) => a.creador_id === this.sesion.usuario()?.id).length);

  /** Historial (organizadas y asistidas) según el filtro elegido. */
  protected readonly historial = computed(() => {
    const yo = this.sesion.usuario()?.id;
    switch (this.filtroHistorial()) {
      case 'organizadas':
        return this.pasadas().filter((a) => a.creador_id === yo);
      case 'asistidas':
        return this.pasadas().filter((a) => a.creador_id !== yo);
      default:
        return this.pasadas();
    }
  });
  protected readonly historialOrganizadas = computed(() => this.pasadas().filter((a) => a.creador_id === this.sesion.usuario()?.id).length);

  /** Actividades que se listan: las del día elegido, o las de la pestaña activa. */
  protected readonly listado = computed(() => {
    const dia = this.diaSeleccionado();
    if (dia) return this.inscritas().filter((a) => a.fecha_hora_inicio.startsWith(dia));
    return this.vista() === 'historial' ? this.historial() : this.proximas();
  });

  /** Celdas del calendario: null para los huecos previos al día 1. */
  protected readonly celdas = computed<(string | null)[]>(() => {
    const mes = this.mes();
    const huecos = (mes.getDay() + 6) % 7; // la semana empieza en lunes
    const diasDelMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
    return [
      ...Array<null>(huecos).fill(null),
      ...Array.from({ length: diasDelMes }, (_, i) => fechaCorta(new Date(mes.getFullYear(), mes.getMonth(), i + 1))),
    ];
  });

  /** Número de actividades por día (AAAA-MM-DD) del mes mostrado. */
  protected readonly actividadesPorDia = computed(() => {
    const cuenta = new Map<string, number>();
    for (const a of this.inscritas()) {
      const dia = a.fecha_hora_inicio.slice(0, 10);
      cuenta.set(dia, (cuenta.get(dia) ?? 0) + 1);
    }
    return cuenta;
  });

  constructor() {
    this.cargar();
  }

  protected cambiarMes(desplazamiento: number): void {
    const actual = this.mes();
    this.mes.set(new Date(actual.getFullYear(), actual.getMonth() + desplazamiento, 1));
  }

  protected seleccionarDia(dia: string): void {
    if (!this.actividadesPorDia().has(dia)) return;
    this.diaSeleccionado.set(this.diaSeleccionado() === dia ? null : dia);
  }

  protected abrir(actividad: Actividad): void {
    this.router.navigate(['/actividades', actividad.id]);
  }

  protected async alternarInscripcion(actividad: Actividad): Promise<void> {
    const seguro = await this.avisos.confirmar('Cancelar inscripción', `¿Quieres liberar tu plaza en "${actividad.titulo}"?`, {
      textoAceptar: 'Liberar plaza',
      peligrosa: true,
    });
    if (!seguro) return;

    try {
      await this.api.cancelarInscripcion(actividad.id);
      this.avisos.info('Has liberado tu plaza.');
      await this.cargar();
    } catch (error) {
      this.avisos.errorDeApi(error, 'No se pudo cancelar la inscripción.');
    }
  }

  private async cargar(): Promise<void> {
    try {
      this.inscritas.set(await this.api.misInscripciones());
    } catch (error) {
      this.avisos.errorDeApi(error, 'No se pudieron cargar tus inscripciones.');
    } finally {
      this.cargando.set(false);
    }
    this.cargarRed();
  }

  /** Las cifras de seguidores/seguidos salen del perfil público propio. */
  private async cargarRed(): Promise<void> {
    const id = this.sesion.usuario()?.id;
    if (!id) return;
    try {
      const { seguidores, seguidos } = await this.usuarios.perfilPublico(id);
      this.red.set({ seguidores, seguidos });
    } catch {
      // Las cifras sociales son secundarias: si fallan se quedan a cero sin molestar.
    }
  }
}

/** Fecha local en formato AAAA-MM-DD. */
function fechaCorta(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}
