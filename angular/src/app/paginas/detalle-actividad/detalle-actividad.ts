import { DatePipe, TitleCasePipe } from '@angular/common';
import { AfterViewInit, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { Avatar } from '../../compartido/avatar/avatar';
import { Cabecera } from '../../compartido/cabecera/cabecera';
import { ChatActividad } from '../../compartido/chat-actividad/chat-actividad';
import { Icono } from '../../compartido/icono/icono';
import { ActividadesApi } from '../../core/actividades-api';
import { Avisos } from '../../core/avisos';
import { proximidad } from '../../core/fechas';
import { Actividad } from '../../core/modelos';
import { Sesion } from '../../core/sesion';

const CENTRO_ESPANA: L.LatLngTuple = [40.4168, -3.7038];

/** Detalle de una actividad: portada, organizador, asistentes, mapa, inscripción, denuncia y gestión del creador. */
@Component({
  selector: 'app-detalle-actividad',
  imports: [DatePipe, TitleCasePipe, RouterLink, Cabecera, Icono, Avatar, ChatActividad],
  templateUrl: './detalle-actividad.html',
  styleUrl: './detalle-actividad.css',
})
export class DetalleActividad implements AfterViewInit {
  protected readonly sesion = inject(Sesion);
  private readonly api = inject(ActividadesApi);
  private readonly avisos = inject(Avisos);
  private readonly router = inject(Router);

  private readonly contenedorMapa = viewChild.required<ElementRef<HTMLDivElement>>('mapa');
  private mapa?: L.Map;
  private marcador?: L.Marker;

  protected readonly actividad = signal<Actividad | null>(null);
  protected readonly trabajando = signal(false);

  protected readonly proximidad = computed(() => {
    const a = this.actividad();
    return a ? proximidad(a.fecha_hora_inicio) : null;
  });
  protected readonly completa = computed(() => {
    const a = this.actividad();
    return a !== null && a.inscritos >= a.aforo;
  });
  protected readonly ocupacion = computed(() => {
    const a = this.actividad();
    return a ? Math.min(100, Math.round((a.inscritos / a.aforo) * 100)) : 0;
  });
  protected readonly esCreador = computed(() => this.actividad()?.creador_id === this.sesion.usuario()?.id);
  /** El chat lo ven las personas inscritas y el admin (solo lectura). */
  protected readonly veChat = computed(() => this.sesion.haySesion() && ((this.actividad()?.inscrito ?? false) || this.sesion.esAdmin()));
  /** Huecos libres que se dibujan junto a los asistentes (como mucho 3). */
  protected readonly plazasLibres = computed(() => {
    const a = this.actividad();
    return a ? Array.from({ length: Math.min(3, Math.max(0, a.aforo - a.inscritos)) }) : [];
  });
  /** Asistentes que no caben en la lista (la API envía como mucho 8). */
  protected readonly asistentesOcultos = computed(() => {
    const a = this.actividad();
    return a ? Math.max(0, a.inscritos - a.asistentes.length) : 0;
  });
  protected readonly enlaceMapa = computed(() => {
    const a = this.actividad();
    return a?.latitud !== null && a?.longitud !== null
      ? `https://www.openstreetmap.org/?mlat=${a?.latitud}&mlon=${a?.longitud}#map=17/${a?.latitud}/${a?.longitud}`
      : null;
  });

  constructor() {
    this.cargar(Number(inject(ActivatedRoute).snapshot.paramMap.get('id')));
  }

  ngAfterViewInit(): void {
    this.mapa = L.map(this.contenedorMapa().nativeElement, { center: CENTRO_ESPANA, zoom: 5, scrollWheelZoom: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(this.mapa);
    this.actualizarMapa();
  }

  protected async alternarInscripcion(): Promise<void> {
    const actividad = this.actividad();
    if (!actividad) return;

    if (actividad.inscrito) {
      const seguro = await this.avisos.confirmar('Cancelar inscripción', `¿Quieres liberar tu plaza en "${actividad.titulo}"?`, {
        textoAceptar: 'Liberar plaza',
        peligrosa: true,
      });
      if (!seguro) return;
    }

    await this.ejecutar(async () => {
      this.actividad.set(actividad.inscrito ? await this.api.cancelarInscripcion(actividad.id) : await this.api.inscribir(actividad.id));
      if (actividad.inscrito) this.avisos.info('Has liberado tu plaza.');
      else this.avisos.exito('¡Plaza reservada! Ya estás apuntado.');
    }, 'No se pudo actualizar la inscripción.');
  }

  protected async denunciar(): Promise<void> {
    const actividad = this.actividad();
    if (!actividad || actividad.denunciada) return;

    const seguro = await this.avisos.confirmar(
      'Denunciar actividad',
      'Si crees que esta actividad incumple las normas, el equipo de moderación la revisará. Solo puedes denunciarla una vez.',
      { textoAceptar: 'Enviar denuncia', peligrosa: true },
    );
    if (!seguro) return;

    await this.ejecutar(async () => {
      this.actividad.set(await this.api.denunciar(actividad.id));
      this.avisos.info('Denuncia enviada. Gracias por avisar.');
    }, 'No se pudo enviar la denuncia.');
  }

  protected async eliminar(): Promise<void> {
    const actividad = this.actividad();
    if (!actividad) return;

    const seguro = await this.avisos.confirmar(
      'Eliminar actividad',
      `Se eliminará "${actividad.titulo}" junto con sus inscripciones. Esta acción no se puede deshacer.`,
      { textoAceptar: 'Eliminar', peligrosa: true },
    );
    if (!seguro) return;

    await this.ejecutar(async () => {
      await this.api.eliminar(actividad.id);
      this.avisos.exito('Actividad eliminada.');
      this.router.navigate(['/']);
    }, 'No se pudo eliminar la actividad.');
  }

  private async ejecutar(accion: () => Promise<void>, mensajeError: string): Promise<void> {
    this.trabajando.set(true);
    try {
      await accion();
    } catch (error) {
      this.avisos.errorDeApi(error, mensajeError);
    } finally {
      this.trabajando.set(false);
    }
  }

  private async cargar(id: number): Promise<void> {
    try {
      this.actividad.set(await this.api.obtener(id));
      this.actualizarMapa();
    } catch (error) {
      this.avisos.errorDeApi(error, 'Esa actividad ya no existe.');
      this.router.navigate(['/']);
    }
  }

  /** Coloca el marcador en la ubicación de la actividad (o en el centro de España si no tiene coordenadas). */
  private actualizarMapa(): void {
    const actividad = this.actividad();
    if (!this.mapa || !actividad) return;

    const tieneCoordenadas = actividad.latitud !== null && actividad.longitud !== null;
    const posicion: L.LatLngTuple = tieneCoordenadas
      ? [actividad.latitud as number, actividad.longitud as number]
      : CENTRO_ESPANA;

    // El texto del popup se inserta como nodo de texto para no interpretar HTML del usuario.
    const etiqueta = document.createElement('b');
    etiqueta.textContent = tieneCoordenadas ? actividad.ubicacion : 'Ubicación no especificada';

    this.marcador?.remove();
    this.marcador = L.marker(posicion, {
      icon: L.divIcon({ className: 'marcador-planify', iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -12] }),
    })
      .addTo(this.mapa)
      .bindPopup(etiqueta, { className: 'popup-planify', closeButton: false })
      .openPopup();

    this.mapa.setView(posicion, tieneCoordenadas ? 16 : 5, { animate: false });
  }
}
