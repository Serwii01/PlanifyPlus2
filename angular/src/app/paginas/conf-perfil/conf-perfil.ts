import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Cabecera } from '../../compartido/cabecera/cabecera';
import { Icono } from '../../compartido/icono/icono';
import { SelectorFoto } from '../../compartido/selector-foto/selector-foto';
import { SelectorUbicacion } from '../../compartido/selector-ubicacion/selector-ubicacion';
import { Avisos, erroresDeApi } from '../../core/avisos';
import { Ubicacion } from '../../core/buscador-ubicacion';
import { Foto } from '../../core/modelos';
import { Sesion } from '../../core/sesion';

const EMAIL_VALIDO = /^[A-Za-z0-9+_.-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})$/;

/** Edición de los datos del usuario en sesión. */
@Component({
  selector: 'app-conf-perfil',
  imports: [FormsModule, RouterLink, Cabecera, Icono, SelectorUbicacion, SelectorFoto],
  templateUrl: './conf-perfil.html',
  styleUrl: './conf-perfil.css',
})
export class ConfPerfil {
  private readonly sesion = inject(Sesion);
  private readonly avisos = inject(Avisos);
  private readonly router = inject(Router);

  protected readonly ciudades = signal<string[]>([]);
  protected readonly errores = signal<Record<string, string>>({});
  protected readonly enviando = signal(false);
  protected readonly verContrasena = signal(false);

  protected nombre = this.sesion.usuario()?.nombre ?? '';
  protected email = this.sesion.usuario()?.email ?? '';
  protected contrasena = '';
  protected ciudad = this.sesion.usuario()?.ciudad ?? '';
  protected readonly direccion = signal<Ubicacion | null>(this.direccionActual());
  protected bio = this.sesion.usuario()?.bio ?? '';
  protected readonly avatar = signal<Foto | null>(this.avatarActual());

  constructor() {
    this.sesion.ciudades().then((ciudades) => this.ciudades.set(ciudades));
  }

  protected async guardar(): Promise<void> {
    const nombre = this.nombre.trim();
    const email = this.email.trim();
    const errores: Record<string, string> = {};
    if (nombre.length < 2) errores['nombre'] = 'El nombre debe tener al menos 2 caracteres.';
    if (!EMAIL_VALIDO.test(email)) errores['email'] = 'Introduce un correo electrónico válido.';
    if (this.contrasena && this.contrasena.length < 6) errores['contrasena'] = 'La contraseña debe tener al menos 6 caracteres.';
    if (!this.ciudad) errores['ciudad'] = 'Elige tu ciudad.';
    this.errores.set(errores);
    if (Object.keys(errores).length) return;

    this.enviando.set(true);
    try {
      const direccion = this.direccion();
      await this.sesion.actualizarPerfil({
        nombre,
        email,
        contrasena: this.contrasena,
        ciudad: this.ciudad,
        direccion: direccion?.nombre ?? null,
        latitud: direccion?.latitud ?? null,
        longitud: direccion?.longitud ?? null,
        bio: this.bio.trim() || null,
        foto_id: this.avatar()?.id ?? null,
      });
      this.avisos.exito('Perfil actualizado.');
      this.router.navigate(['/perfil']);
    } catch (error) {
      const deApi = erroresDeApi(error);
      this.errores.set(deApi);
      if (!Object.keys(deApi).length) this.avisos.errorDeApi(error, 'No se pudieron guardar los cambios.');
    } finally {
      this.enviando.set(false);
    }
  }

  /** Avatar actual como foto del selector (solo se conoce su URL e id). */
  private avatarActual(): Foto | null {
    const usuario = this.sesion.usuario();
    return usuario?.foto_id && usuario.avatar_url
      ? { id: usuario.foto_id, url: usuario.avatar_url, titulo: 'Tu foto de perfil', etiquetas: [], autor: null, licencia: 'propia', fuente_url: null, publica: false }
      : null;
  }

  /** Dirección exacta guardada en el perfil, si la hay, como ubicación del selector. */
  private direccionActual(): Ubicacion | null {
    const usuario = this.sesion.usuario();
    return usuario?.direccion
      ? { nombre: usuario.direccion, tipo: '', latitud: usuario.latitud, longitud: usuario.longitud }
      : null;
  }
}
