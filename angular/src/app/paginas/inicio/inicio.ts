import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Cabecera } from '../../compartido/cabecera/cabecera';
import { Icono } from '../../compartido/icono/icono';
import { TarjetaActividad } from '../../compartido/tarjeta-actividad/tarjeta-actividad';
import { ActividadesApi } from '../../core/actividades-api';
import { Avisos, mensajeDeApi } from '../../core/avisos';
import { proximidad } from '../../core/fechas';
import { distanciaAActividad, tieneUbicacion } from '../../core/geo';
import { Actividad, TIPOS_ACTIVIDAD, TipoActividad } from '../../core/modelos';
import { Sesion } from '../../core/sesion';

const OPCIONES_DISTANCIA = [
  { texto: 'Cualquier distancia', km: null },
  { texto: 'A menos de 2 km', km: 2 },
  { texto: 'A menos de 5 km', km: 5 },
  { texto: 'A menos de 10 km', km: 10 },
  { texto: 'A menos de 20 km', km: 20 },
  { texto: 'A menos de 50 km', km: 50 },
];

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, Cabecera, Icono, TarjetaActividad],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  protected readonly sesion = inject(Sesion);
  private readonly api = inject(ActividadesApi);
  private readonly avisos = inject(Avisos);
  private readonly router = inject(Router);

  protected readonly tipos = TIPOS_ACTIVIDAD;
  protected readonly opcionesDistancia = OPCIONES_DISTANCIA;

  protected readonly todas = signal<Actividad[]>([]);
  protected readonly cargando = signal(true);
  protected readonly busqueda = signal('');
  protected readonly tipo = signal<TipoActividad | null>(null);
  protected readonly distanciaMaxima = signal<number | null>(null);
  protected readonly mostrarLegal = signal(false);
  /** Mensaje si la carga inicial falla (API caída, sin red...). */
  protected readonly errorCarga = signal<string | null>(null);

  /** Punto desde el que se miden las distancias: la dirección exacta del usuario o, si no, su ciudad. */
  protected readonly origenDistancia = computed(() => {
    const yo = this.sesion.usuario();
    return tieneUbicacion(yo) && !yo.es_admin ? (yo.direccion ?? yo.ciudad) : null;
  });

  /**
   * Próximas actividades de otros, filtradas por texto, tipo y distancia al usuario.
   * Con el filtro de distancia activo se ordenan de más cercana a más lejana.
   */
  protected readonly comunidad = computed(() => {
    const yo = this.sesion.usuario();
    const texto = this.busqueda().toLowerCase().trim();
    const tipo = this.tipo();
    const km = this.distanciaMaxima();
    const distancia = (a: Actividad) => distanciaAActividad(yo, a);

    const lista = this.todas().filter(
      (a) =>
        !proximidad(a.fecha_hora_inicio).finalizada &&
        (a.creador_id === null || a.creador_id !== yo?.id) &&
        (tipo === null || a.tipo === tipo) &&
        (!texto || [a.titulo, a.descripcion, a.ciudad, a.ubicacion].some((c) => c?.toLowerCase().includes(texto))) &&
        (km === null || (distancia(a) ?? Infinity) <= km),
    );

    return km === null ? lista : lista.sort((a, b) => (distancia(a) ?? Infinity) - (distancia(b) ?? Infinity));
  });

  /** Panel lateral: mis actividades creadas o, para el admin, las denunciadas. */
  protected readonly lateral = computed(() => {
    const yo = this.sesion.usuario();
    if (!yo) return [];
    if (yo.es_admin) {
      return this.todas()
        .filter((a) => a.denuncias > 0)
        .sort((a, b) => b.denuncias - a.denuncias || a.fecha_hora_inicio.localeCompare(b.fecha_hora_inicio));
    }
    // Solo las que aún no se han celebrado; las pasadas quedan en el historial del perfil.
    return this.todas().filter((a) => a.creador_id === yo.id && !proximidad(a.fecha_hora_inicio).finalizada);
  });

  protected readonly hayFiltros = computed(() => !!this.busqueda().trim() || this.tipo() !== null || this.distanciaMaxima() !== null);

  constructor() {
    // Se recarga al entrar y cada vez que cambia la sesión (los flags "inscrito" dependen del usuario).
    effect(() => {
      this.sesion.usuario();
      this.cargar();
    });
  }

  protected seleccionarDistancia(valor: string): void {
    this.distanciaMaxima.set(valor ? Number(valor) : null);
  }

  protected limpiarFiltros(): void {
    this.busqueda.set('');
    this.tipo.set(null);
    this.distanciaMaxima.set(null);
  }

  protected abrir(actividad: Actividad): void {
    this.router.navigate(['/actividades', actividad.id]);
  }

  protected editar(actividad: Actividad): void {
    this.router.navigate(['/actividades', actividad.id, 'editar']);
  }

  protected async alternarInscripcion(actividad: Actividad): Promise<void> {
    try {
      if (actividad.inscrito) {
        await this.api.cancelarInscripcion(actividad.id);
        this.avisos.info(`Has cancelado tu plaza en "${actividad.titulo}".`);
      } else {
        await this.api.inscribir(actividad.id);
        this.avisos.exito(`Te has apuntado a "${actividad.titulo}".`);
      }
      await this.cargar();
    } catch (error) {
      this.avisos.errorDeApi(error, 'No se pudo actualizar la inscripción.');
    }
  }

  protected async eliminar(actividad: Actividad): Promise<void> {
    const confirmado = await this.avisos.confirmar(
      'Eliminar actividad',
      `Se eliminará "${actividad.titulo}" junto con sus inscripciones. Esta acción no se puede deshacer.`,
      { textoAceptar: 'Eliminar', peligrosa: true },
    );
    if (!confirmado) return;

    try {
      await this.api.eliminar(actividad.id);
      this.avisos.exito(`"${actividad.titulo}" se ha eliminado.`);
      await this.cargar();
    } catch (error) {
      this.avisos.errorDeApi(error, 'No se pudo eliminar la actividad.');
    }
  }

  protected async cargar(): Promise<void> {
    this.cargando.set(true);
    this.errorCarga.set(null);
    try {
      this.todas.set(await this.api.listar());
    } catch (error) {
      // Sin datos no hay nada que mostrar: se explica en la propia lista con opción de reintentar.
      this.errorCarga.set(mensajeDeApi(error, 'No se pudieron cargar las actividades.'));
    } finally {
      this.cargando.set(false);
    }
  }
}
