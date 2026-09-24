import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Acceso } from '../../compartido/acceso/acceso';
import { Icono } from '../../compartido/icono/icono';
import { SelectorUbicacion } from '../../compartido/selector-ubicacion/selector-ubicacion';
import { Avisos, erroresDeApi, mensajeDeApi } from '../../core/avisos';
import { Ubicacion } from '../../core/buscador-ubicacion';
import { Sesion } from '../../core/sesion';

const EMAIL_VALIDO = /^[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}$/;

@Component({
  selector: 'app-registro',
  imports: [FormsModule, RouterLink, Acceso, Icono, SelectorUbicacion],
  templateUrl: './registro.html',
})
export class Registro {
  private readonly sesion = inject(Sesion);
  private readonly avisos = inject(Avisos);
  private readonly router = inject(Router);

  protected readonly ciudades = signal<string[]>([]);

  protected nombre = '';
  protected email = '';
  protected contrasena = '';
  protected ciudad = '';
  protected readonly direccion = signal<Ubicacion | null>(null);
  protected readonly verContrasena = signal(false);
  protected readonly errores = signal<Record<string, string>>({});
  protected readonly errorGeneral = signal('');
  protected readonly enviando = signal(false);

  constructor() {
    this.sesion.ciudades().then((ciudades) => this.ciudades.set(ciudades));
  }

  protected async registrarse(): Promise<void> {
    const nombre = this.nombre.trim();
    const email = this.email.trim();
    const errores: Record<string, string> = {};
    if (!nombre) errores['nombre'] = 'Dinos cómo te llamas.';
    if (!EMAIL_VALIDO.test(email)) errores['email'] = 'Introduce un correo electrónico válido.';
    if (this.contrasena.length < 6) errores['contrasena'] = 'La contraseña debe tener al menos 6 caracteres.';
    this.errores.set(errores);
    this.errorGeneral.set('');
    if (Object.keys(errores).length) return;

    const direccion = this.direccion();
    this.enviando.set(true);
    try {
      const usuario = await this.sesion.registro({
        nombre,
        email,
        contrasena: this.contrasena,
        ciudad: this.ciudad || null,
        direccion: direccion?.nombre ?? null,
        latitud: direccion?.latitud ?? null,
        longitud: direccion?.longitud ?? null,
      });
      this.avisos.exito(`¡Bienvenido a PlanifyPlus, ${usuario.nombre.split(' ')[0]}!`);
      this.router.navigate(['/']);
    } catch (error) {
      const deApi = erroresDeApi(error);
      this.errores.set(deApi);
      if (!Object.keys(deApi).length) this.errorGeneral.set(mensajeDeApi(error, 'No se pudo crear la cuenta. Inténtalo de nuevo.'));
    } finally {
      this.enviando.set(false);
    }
  }
}
