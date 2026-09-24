import { AfterViewInit, Component, effect, ElementRef, inject, input, model, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { BuscadorUbicacion, Ubicacion } from '../../core/buscador-ubicacion';
import { Icono } from '../icono/icono';

const VISTA_ESPANA: { centro: L.LatLngTuple; zoom: number } = { centro: [40.4168, -3.7038], zoom: 5 };

/**
 * Buscador de una ubicación exacta (Nominatim) con mapa de previsualización.
 * Se usa para la ubicación de las actividades y para la dirección del usuario.
 */
@Component({
  selector: 'app-selector-ubicacion',
  imports: [FormsModule, Icono],
  templateUrl: './selector-ubicacion.html',
  styleUrl: './selector-ubicacion.css',
})
export class SelectorUbicacion implements AfterViewInit {
  private readonly buscador = inject(BuscadorUbicacion);
  private readonly contenedorMapa = viewChild.required<ElementRef<HTMLDivElement>>('mapa');
  private mapa?: L.Map;
  private marcador?: L.Marker;
  private temporizadorBusqueda?: ReturnType<typeof setTimeout>;

  /** Ubicación seleccionada (two-way: `[(ubicacion)]`). */
  readonly ubicacion = model<Ubicacion | null>(null);
  /** Ciudad con la que se afinan las búsquedas. */
  readonly ciudad = input('');
  readonly id = input('busqueda');
  readonly placeholder = input('Busca una dirección, plaza, parque, polideportivo…');
  readonly error = input<string | undefined>(undefined);
  /** Altura del mapa en píxeles. */
  readonly alturaMapa = input(240);

  protected textoBusqueda = '';
  protected readonly resultados = signal<Ubicacion[] | null>(null);
  protected readonly buscando = signal(false);
  protected readonly errorBusqueda = signal(false);

  constructor() {
    // El texto del campo sigue a la ubicación elegida (también cuando la fija el padre al editar).
    effect(() => {
      const ubicacion = this.ubicacion();
      if (ubicacion) this.textoBusqueda = ubicacion.nombre;
      this.actualizarMapa();
    });
  }

  ngAfterViewInit(): void {
    this.mapa = L.map(this.contenedorMapa().nativeElement, { center: VISTA_ESPANA.centro, zoom: VISTA_ESPANA.zoom, zoomControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(this.mapa);
    this.actualizarMapa();
  }

  protected buscar(): void {
    clearTimeout(this.temporizadorBusqueda);
    const texto = this.textoBusqueda.trim();

    if (texto.length < 3) {
      this.resultados.set(null);
      return;
    }

    this.buscando.set(true);
    this.errorBusqueda.set(false);
    this.temporizadorBusqueda = setTimeout(async () => {
      try {
        this.resultados.set(await this.buscador.buscar(texto, this.ciudad().trim()));
      } catch {
        this.errorBusqueda.set(true);
        this.resultados.set([]);
      } finally {
        this.buscando.set(false);
      }
    }, 700);
  }

  protected seleccionar(ubicacion: Ubicacion): void {
    this.resultados.set(null);
    this.ubicacion.set(ubicacion);
  }

  protected quitar(): void {
    this.textoBusqueda = '';
    this.resultados.set(null);
    this.ubicacion.set(null);
  }

  private actualizarMapa(): void {
    if (!this.mapa) return;
    const ubicacion = this.ubicacion();

    this.marcador?.remove();
    if (!ubicacion) {
      this.mapa.setView(VISTA_ESPANA.centro, VISTA_ESPANA.zoom, { animate: false });
      return;
    }

    const posicion: L.LatLngTuple = [ubicacion.latitud, ubicacion.longitud];
    this.marcador = L.marker(posicion, {
      icon: L.divIcon({ className: 'marcador-planify', iconSize: [18, 18], iconAnchor: [9, 9] }),
    }).addTo(this.mapa);
    this.mapa.setView(posicion, 15, { animate: false });
  }
}
