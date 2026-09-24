export type TipoActividad = 'CULTURAL' | 'DEPORTIVA' | 'TALLER';

export const TIPOS_ACTIVIDAD: TipoActividad[] = ['DEPORTIVA', 'CULTURAL', 'TALLER'];

/** Foto del banco de imágenes (portada de actividad o avatar). */
export interface Foto {
  id: number;
  url: string;
  titulo: string | null;
  etiquetas: string[];
  autor: string | null;
  /** cc0, by, by-sa… o "propia" si la subió un usuario. */
  licencia: string;
  fuente_url: string | null;
  publica: boolean;
}

/** Persona apuntada a una actividad, tal y como se muestra públicamente. */
export interface Asistente {
  id: number;
  nombre: string;
  avatar_url: string | null;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  ciudad: string | null;
  /** Dirección exacta elegida en el buscador; null si solo indicó la ciudad. */
  direccion: string | null;
  /** Coordenadas de la dirección o, en su defecto, del centro de la ciudad. */
  latitud: number;
  longitud: number;
  es_admin: boolean;
  /** Presentación pública (hasta 300 caracteres). */
  bio: string | null;
  foto_id: number | null;
  avatar_url: string | null;
}

/** Lo que cualquiera puede ver de otro usuario. */
export interface PerfilPublico {
  id: number;
  nombre: string;
  ciudad: string | null;
  bio: string | null;
  avatar_url: string | null;
  miembro_desde: string | null;
  organizadas: number;
  realizadas: number;
  seguidores: number;
  seguidos: number;
  /** Si la persona en sesión la sigue. */
  lo_sigo: boolean;
  /** Si sigue a la persona en sesión. */
  me_sigue: boolean;
  proximas: Actividad[];
  /** Planes ya celebrados (organizados o asistidos), del más reciente al más antiguo. */
  historial: Actividad[];
}

export interface Actividad {
  id: number;
  titulo: string;
  descripcion: string;
  /** Fecha local sin zona horaria, p. ej. "2026-04-09T12:35:00". */
  fecha_hora_inicio: string;
  tipo: TipoActividad;
  ubicacion: string;
  ciudad: string;
  latitud: number | null;
  longitud: number | null;
  aforo: number;
  predeterminada: boolean;
  creador_id: number | null;
  /** Nombre del organizador; null en las predeterminadas. */
  creador: string | null;
  creador_avatar_url: string | null;
  foto: Foto | null;
  /** Primeras personas apuntadas (máximo 8); `inscritos` es el total. */
  asistentes: Asistente[];
  /** Solo en el apartado social: personas a las que sigues que van a este plan. */
  seguidos_que_van?: Asistente[];
  inscritos: number;
  denuncias: number;
  inscrito: boolean;
  denunciada: boolean;
}

/** Campos que se envían al crear o editar una actividad. */
export type DatosActividad = Pick<
  Actividad,
  'titulo' | 'descripcion' | 'fecha_hora_inicio' | 'tipo' | 'ubicacion' | 'ciudad' | 'latitud' | 'longitud' | 'aforo'
> & { foto_id: number | null };

/** Dirección exacta opcional del usuario; sin ella la API usa el centro de la ciudad. */
export interface DatosUbicacionUsuario {
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
}

export interface DatosRegistro extends DatosUbicacionUsuario {
  nombre: string;
  email: string;
  contrasena: string;
  ciudad: string | null;
}

export interface DatosPerfil extends DatosUbicacionUsuario {
  nombre: string;
  email: string;
  /** Vacía para mantener la contraseña actual. */
  contrasena: string;
  ciudad: string;
  bio: string | null;
  foto_id: number | null;
}

/** Ficha resumida de una persona en los listados sociales. */
export interface UsuarioBreve {
  id: number;
  nombre: string;
  ciudad: string | null;
  bio: string | null;
  avatar_url: string | null;
  seguidores: number;
  seguidos: number;
  /** Si la persona en sesión la sigue. */
  lo_sigo: boolean;
  /** Si sigue a la persona en sesión. */
  me_sigue: boolean;
  /** Solo en las sugerencias: planes compartidos con la persona en sesión. */
  planes_en_comun?: number;
}

/** Mensaje del chat de una actividad. */
export interface Mensaje {
  id: number;
  texto: string;
  /** Fecha local sin zona horaria. */
  enviado_en: string;
  usuario: Asistente;
  /** Si lo escribió la persona en sesión. */
  propio: boolean;
}
