const MILISEGUNDOS_DIA = 86_400_000;

export interface Proximidad {
  texto: string;
  clase: 'hoy' | 'pronto' | 'finalizada';
  finalizada: boolean;
}

/** Cuenta atrás legible de una actividad ("Hoy", "Mañana", "En 5 días", "Finalizada"). */
export function proximidad(fechaHora: string): Proximidad {
  const fecha = new Date(fechaHora);
  const ahora = new Date();
  if (fecha <= ahora) return { texto: 'Finalizada', clase: 'finalizada', finalizada: true };

  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const inicioDia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const dias = Math.round((inicioDia.getTime() - inicioHoy.getTime()) / MILISEGUNDOS_DIA);

  if (dias === 0) return { texto: 'Hoy', clase: 'hoy', finalizada: false };
  if (dias === 1) return { texto: 'Mañana', clase: 'pronto', finalizada: false };
  return { texto: `En ${dias} días`, clase: 'pronto', finalizada: false };
}

/** Iniciales para el avatar: "Sergio Fernández" → "SF". */
export function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('');
}
