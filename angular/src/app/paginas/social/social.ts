import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Avatar } from '../../compartido/avatar/avatar';
import { Cabecera } from '../../compartido/cabecera/cabecera';
import { Icono } from '../../compartido/icono/icono';
import { TarjetaActividad } from '../../compartido/tarjeta-actividad/tarjeta-actividad';
import { TarjetaPersona } from '../../compartido/tarjeta-persona/tarjeta-persona';
import { ActividadesApi } from '../../core/actividades-api';
import { Avisos } from '../../core/avisos';
import { Actividad, UsuarioBreve } from '../../core/modelos';
import { Sesion } from '../../core/sesion';
import { UsuariosApi } from '../../core/usuarios-api';

type Pestana = 'descubrir' | 'siguiendo' | 'seguidores';

/** Apartado social: a quién sigues, quién te sigue, gente que descubrir y los planes de tu gente. */
@Component({
  selector: 'app-social',
  imports: [RouterLink, Cabecera, Icono, Avatar, TarjetaPersona, TarjetaActividad],
  templateUrl: './social.html',
  styleUrl: './social.css',
})
export class Social {
  protected readonly sesion = inject(Sesion);
  private readonly usuarios = inject(UsuariosApi);
  private readonly actividades = inject(ActividadesApi);
  private readonly avisos = inject(Avisos);
  private readonly router = inject(Router);

  protected readonly pestana = signal<Pestana>('descubrir');
  protected readonly sugerencias = signal<UsuarioBreve[]>([]);
  protected readonly siguiendo = signal<UsuarioBreve[]>([]);
  protected readonly seguidores = signal<UsuarioBreve[]>([]);
  protected readonly planes = signal<Actividad[]>([]);
  protected readonly cargando = signal(true);
  protected readonly busqueda = signal('');

  /** Personas de la pestaña activa, filtradas por el buscador. */
  protected readonly personas = computed(() => {
    const lista = { descubrir: this.sugerencias(), siguiendo: this.siguiendo(), seguidores: this.seguidores() }[this.pestana()];
    const texto = this.busqueda().trim().toLowerCase();
    return texto ? lista.filter((p) => p.nombre.toLowerCase().includes(texto) || p.ciudad?.toLowerCase().includes(texto)) : lista;
  });

  constructor() {
    this.cargar();
  }

  protected abrir(actividad: Actividad): void {
    this.router.navigate(['/actividades', actividad.id]);
  }

  /**
   * Tras seguir o dejar de seguir a alguien: la persona pasa de "Descubrir" a "Siguiendo"
   * (o al revés) y se recargan los planes de tu gente.
   */
  protected actualizarPersona(ficha: UsuarioBreve): void {
    const sinElla = (lista: UsuarioBreve[]) => lista.filter((p) => p.id !== ficha.id);
    if (ficha.lo_sigo) {
      this.sugerencias.update(sinElla);
      this.siguiendo.update((lista) => [...sinElla(lista), ficha].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    } else {
      this.siguiendo.update(sinElla);
      this.sugerencias.update((lista) => [ficha, ...sinElla(lista)]);
    }
    this.seguidores.update((lista) => lista.map((p) => (p.id === ficha.id ? { ...p, ...ficha } : p)));
    this.cargarPlanes();
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
      await this.cargarPlanes();
    } catch (error) {
      this.avisos.errorDeApi(error, 'No se pudo actualizar la inscripción.');
    }
  }

  private async cargar(): Promise<void> {
    const yo = this.sesion.usuario();
    if (!yo) return;
    try {
      const [sugerencias, siguiendo, seguidores] = await Promise.all([
        this.usuarios.sugerencias(),
        this.usuarios.seguidos(yo.id),
        this.usuarios.seguidores(yo.id),
      ]);
      this.sugerencias.set(sugerencias);
      this.siguiendo.set(siguiendo);
      this.seguidores.set(seguidores);
      // Si ya sigues a gente, lo interesante es verla; si no, descubrir a quién seguir.
      if (siguiendo.length) this.pestana.set('siguiendo');
    } catch (error) {
      this.avisos.errorDeApi(error, 'No se pudo cargar tu red.');
    } finally {
      this.cargando.set(false);
    }
    await this.cargarPlanes();
  }

  private async cargarPlanes(): Promise<void> {
    try {
      this.planes.set(await this.usuarios.planesDeSeguidos());
    } catch (error) {
      this.avisos.errorDeApi(error, 'No se pudieron cargar los planes de tu gente.');
    }
  }
}
