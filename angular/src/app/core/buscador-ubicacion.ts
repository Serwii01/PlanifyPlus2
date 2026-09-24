import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface Ubicacion {
  nombre: string;
  tipo: string;
  latitud: number;
  longitud: number;
}

interface ResultadoNominatim {
  display_name: string;
  type: string;
  lat: string;
  lon: string;
  importance?: number;
}

const LIMITES_ESPANA = { minLat: 36.0, maxLat: 43.8, minLon: -9.3, maxLon: 4.3 };

const ORDEN_TIPOS: Record<string, number> = {
  stadium: 1, sports_centre: 1, park: 2, pitch: 2, leisure: 3, amenity: 4, building: 5, place: 6,
};

const ETIQUETAS_TIPO: Record<string, string> = {
  stadium: '🏟️ Estadio',
  park: '🌳 Parque',
  pitch: '⚽ Campo deportivo',
  sports_centre: '🏋️ Centro deportivo',
  building: '🏢 Edificio',
  place: '📍 Lugar',
  leisure: '🎭 Ocio',
  amenity: '🏛️ Instalación',
  road: '🛣️ Calle',
  house_number: '🏠 Dirección',
};

/** Buscador de ubicaciones en España mediante Nominatim (OpenStreetMap). */
@Injectable({ providedIn: 'root' })
export class BuscadorUbicacion {
  private readonly http = inject(HttpClient);

  async buscar(texto: string, ciudad: string): Promise<Ubicacion[]> {
    const consulta = ciudad
      ? `${texto}, ${ciudad}, España`
      : /españa|spain/i.test(texto) ? texto : `${texto}, España`;

    const resultados = await firstValueFrom(
      this.http.get<ResultadoNominatim[]>('https://nominatim.openstreetmap.org/search', {
        params: {
          format: 'json',
          addressdetails: 1,
          limit: 15,
          countrycodes: 'es',
          bounded: 1,
          viewbox: '-9.3,43.8,4.3,36.0',
          q: consulta,
        },
      }),
    );

    return resultados
      .map((r) => ({
        nombre: r.display_name,
        tipo: ETIQUETAS_TIPO[r.type] ?? '📍 Ubicación',
        latitud: parseFloat(r.lat),
        longitud: parseFloat(r.lon),
        orden: ORDEN_TIPOS[r.type] ?? 10,
        importancia: r.importance ?? 0,
      }))
      .filter((u) => this.estaEnEspana(u.latitud, u.longitud))
      .sort((a, b) => a.orden - b.orden || b.importancia - a.importancia);
  }

  private estaEnEspana(lat: number, lon: number): boolean {
    return (
      lat >= LIMITES_ESPANA.minLat && lat <= LIMITES_ESPANA.maxLat &&
      lon >= LIMITES_ESPANA.minLon && lon <= LIMITES_ESPANA.maxLon
    );
  }
}
