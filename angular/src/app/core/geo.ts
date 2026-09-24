import { Actividad, Usuario } from './modelos';

const RADIO_TIERRA_KM = 6371;

/** Distancia aproximada en kilómetros entre dos puntos (fórmula de Haversine). */
export function distanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const aRadianes = (grados: number) => (grados * Math.PI) / 180;
  const dLat = aRadianes(lat2 - lat1);
  const dLon = aRadianes(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(lat1)) * Math.cos(aRadianes(lat2)) * Math.sin(dLon / 2) ** 2;

  return RADIO_TIERRA_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** El usuario tiene un punto desde el que medir distancias: su dirección exacta o el centro de su ciudad. */
export function tieneUbicacion(usuario: Usuario | null | undefined): usuario is Usuario {
  return !!usuario && (usuario.direccion !== null || usuario.ciudad !== null);
}

/** Distancia entre el usuario y una actividad, o null si a alguno le faltan coordenadas. */
export function distanciaAActividad(usuario: Usuario | null | undefined, actividad: Actividad): number | null {
  if (!tieneUbicacion(usuario) || actividad.latitud === null || actividad.longitud === null) return null;
  return distanciaKm(usuario.latitud, usuario.longitud, actividad.latitud, actividad.longitud);
}

/** "350 m", "2,3 km" o "15 km". */
export function formatearDistancia(km: number): string {
  if (km < 1) return `${Math.max(50, Math.round(km * 1000 / 50) * 50)} m`;
  return `${km.toLocaleString('es', { maximumFractionDigits: km < 10 ? 1 : 0 })} km`;
}
