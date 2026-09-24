import { HttpClient, HttpContext, HttpContextToken } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { DatosPerfil, DatosRegistro, Usuario } from './modelos';

const CLAVE_TOKEN = 'planifyplus.jwt';

/** Peticiones que no deben intentar renovar el token si reciben 401 (login, refresh, logout). */
export const SIN_RENOVACION = new HttpContextToken(() => false);

interface RespuestaSesion {
  usuario: Usuario;
  token: string;
  expira_en: number;
}

/**
 * Sesión del usuario con JWT: el token vive en localStorage y el usuario actual es un signal.
 * Cuando la API responde 401 el interceptor pide aquí una renovación del token.
 */
@Injectable({ providedIn: 'root' })
export class Sesion {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;
  /** Renovación en curso, compartida para que varias peticiones 401 simultáneas no la repitan. */
  private renovacion: Promise<string | null> | null = null;

  readonly usuario = signal<Usuario | null>(null);
  readonly haySesion = computed(() => this.usuario() !== null);
  readonly esAdmin = computed(() => this.usuario()?.es_admin ?? false);

  get token(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  /** Recupera el usuario si hay un token guardado de una visita anterior. */
  async restaurar(): Promise<void> {
    if (!this.token) return;
    try {
      this.usuario.set(await firstValueFrom(this.http.get<Usuario>(`${this.api}/perfil`)));
    } catch {
      this.limpiar();
    }
  }

  login(email: string, contrasena: string): Promise<Usuario> {
    return this.abrirSesion('login', { email, contrasena });
  }

  /** El registro inicia sesión directamente. */
  registro(datos: DatosRegistro): Promise<Usuario> {
    return this.abrirSesion('registro', datos);
  }

  /** Pide un token nuevo con el actual (válido aunque haya caducado). Devuelve null si ya no es posible. */
  renovar(): Promise<string | null> {
    this.renovacion ??= firstValueFrom(
      this.http.post<{ token: string }>(`${this.api}/refresh`, {}, { context: this.sinRenovacion() }),
    )
      .then(({ token }) => {
        localStorage.setItem(CLAVE_TOKEN, token);
        return token;
      })
      .catch(() => {
        this.limpiar();
        return null;
      })
      .finally(() => (this.renovacion = null));

    return this.renovacion;
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.api}/logout`, {}, { context: this.sinRenovacion() }));
    } catch {
      // El token ya no era válido: la sesión local se cierra igualmente.
    } finally {
      this.limpiar();
    }
  }

  async actualizarPerfil(datos: DatosPerfil): Promise<Usuario> {
    const usuario = await firstValueFrom(this.http.put<Usuario>(`${this.api}/perfil`, datos));
    this.usuario.set(usuario);
    return usuario;
  }

  ciudades(): Promise<string[]> {
    return firstValueFrom(this.http.get<string[]>(`${this.api}/ciudades`));
  }

  private async abrirSesion(ruta: string, datos: object): Promise<Usuario> {
    const respuesta = await firstValueFrom(
      this.http.post<RespuestaSesion>(`${this.api}/${ruta}`, datos, { context: this.sinRenovacion() }),
    );
    localStorage.setItem(CLAVE_TOKEN, respuesta.token);
    this.usuario.set(respuesta.usuario);
    return respuesta.usuario;
  }

  private limpiar(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    this.usuario.set(null);
  }

  private sinRenovacion(): HttpContext {
    return new HttpContext().set(SIN_RENOVACION, true);
  }
}
