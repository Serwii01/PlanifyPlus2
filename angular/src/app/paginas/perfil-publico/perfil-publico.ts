import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Avatar } from '../../compartido/avatar/avatar';
import { BotonSeguir } from '../../compartido/boton-seguir/boton-seguir';
import { Cabecera } from '../../compartido/cabecera/cabecera';
import { Icono } from '../../compartido/icono/icono';
import { TarjetaActividad } from '../../compartido/tarjeta-actividad/tarjeta-actividad';
import { TarjetaPersona } from '../../compartido/tarjeta-persona/tarjeta-persona';
import { ActividadesApi } from '../../core/actividades-api';
import { Avisos } from '../../core/avisos';
import { Actividad, PerfilPublico, UsuarioBreve } from '../../core/modelos';
import { Sesion } from '../../core/sesion';
import { UsuariosApi } from '../../core/usuarios-api';

type ListaRed = 'seguidores' | 'seguidos';
type FiltroHistorial = 'todas' | 'organizadas' | 'asistidas';

/** Perfil público de cualquier usuario: presentación, red social, planes próximos e historial. */
@Component({
  selector: 'app-perfil-publico',
  imports: [DatePipe, RouterLink, Cabecera, Icono, Avatar, TarjetaActividad, TarjetaPersona, BotonSeguir],
  templateUrl: './perfil-publico.html',
  styleUrl: './perfil-publico.css',
})
export class PerfilPublicoPagina {
  protected readonly sesion = inject(Sesion);
  private readonly usuarios = inject(UsuariosApi);
  private readonly actividades = inject(ActividadesApi);
  private readonly avisos = inject(Avisos);
  private readonly router = inject(Router);
  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  protected readonly perfil = signal<PerfilPublico | null>(null);
  protected readonly cargando = signal(true);
  protected readonly esMiPerfil = computed(() => this.sesion.usuario()?.id === this.id);
  protected readonly organiza = computed(() => this.perfil()?.proximas.filter((a) => a.creador_id === this.id) ?? []);
  protected readonly asiste = computed(() => this.perfil()?.proximas.filter((a) => a.creador_id !== this.id) ?? []);

  /** Lista de la red desplegada bajo las cifras (null: ninguna). */
  protected readonly listaRed = signal<ListaRed | null>(null);
  protected readonly personas = signal<UsuarioBreve[]>([]);
  protected readonly cargandoRed = signal(false);

  protected readonly filtroHistorial = signal<FiltroHistorial>('todas');
  protected readonly historial = computed(() => {
    const todas = this.perfil()?.historial ?? [];
    switch (this.filtroHistorial()) {
      case 'organizadas':
        return todas.filter((a) => a.creador_id === this.id);
      case 'asistidas':
        return todas.filter((a) => a.creador_id !== this.id);
      default:
        return todas;
    }
  });
  protected readonly historialOrganizadas = computed(() => this.perfil()?.historial.filter((a) => a.creador_id === this.id).length ?? 0);

  constructor() {
    this.cargar();
  }

  protected abrir(actividad: Actividad): void {
    this.router.navigate(['/actividades', actividad.id]);
  }

  /** Despliega (o pliega) la lista de seguidores o seguidos. */
  protected async alternarRed(lista: ListaRed): Promise<void> {
    if (this.listaRed() === lista) {
      this.listaRed.set(null);
      return;
    }
    this.listaRed.set(lista);
    await this.cargarRed(lista);
  }

  /** Tras seguir o dejar de seguir al dueño del perfil: actualiza cifras y flag. */
  protected actualizarSeguimiento(ficha: UsuarioBreve): void {
    this.perfil.update((p) => (p ? { ...p, lo_sigo: ficha.lo_sigo, seguidores: ficha.seguidores, seguidos: ficha.seguidos } : p));
    // Si la lista de seguidores está abierta, la persona en sesión entra o sale de ella.
    if (this.listaRed() === 'seguidores') this.cargarRed('seguidores');
  }

  /** Tras seguir o dejar de seguir a alguien de la lista desplegada. */
  protected actualizarPersona(ficha: UsuarioBreve): void {
    this.personas.update((lista) => lista.map((p) => (p.id === ficha.id ? { ...p, ...ficha } : p)));
    if (this.esMiPerfil()) this.cargar();
  }

  protected async alternarInscripcion(actividad: Actividad): Promise<void> {
    try {
      if (actividad.inscrito) {
        await this.actividades.cancelarInscripcion(actividad.id);
        this.avisos.info(`Has cancelado tu plaza en "${actividad.titulo}".`);
      } else {
        await this.actividades.inscribir(actividad.id);
        this.avisos.exito(`Te has apuntado a "${actividad.titulo}".`);
      }
      await this.cargar();
    } catch (error) {
      this.avisos.errorDeApi(error, 'No se pudo actualizar la inscripción.');
    }
  }

  private async cargarRed(lista: ListaRed): Promise<void> {
    this.cargandoRed.set(true);
    try {
      this.personas.set(lista === 'seguidores' ? await this.usuarios.seguidores(this.id) : await this.usuarios.seguidos(this.id));
    } catch (error) {
      this.avisos.errorDeApi(error, 'No se pudo cargar la lista.');
      this.listaRed.set(null);
    } finally {
      this.cargandoRed.set(false);
    }
  }

  private async cargar(): Promise<void> {
    try {
      this.perfil.set(await this.usuarios.perfilPublico(this.id));
    } catch (error) {
      this.avisos.errorDeApi(error, 'Ese perfil no existe.');
      this.router.navigate(['/']);
    } finally {
      this.cargando.set(false);
    }
  }
}
