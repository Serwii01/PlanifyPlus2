import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Acceso } from '../../compartido/acceso/acceso';
import { Icono } from '../../compartido/icono/icono';
import { Avisos, mensajeDeApi } from '../../core/avisos';
import { Sesion } from '../../core/sesion';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, Acceso, Icono],
  templateUrl: './login.html',
})
export class Login {
  private readonly sesion = inject(Sesion);
  private readonly avisos = inject(Avisos);
  private readonly router = inject(Router);

  protected email = '';
  protected contrasena = '';
  protected readonly verContrasena = signal(false);
  protected readonly errores = signal<Record<string, string>>({});
  protected readonly errorGeneral = signal('');
  protected readonly enviando = signal(false);

  protected async iniciarSesion(): Promise<void> {
    const email = this.email.trim();
    const errores: Record<string, string> = {};
    if (!email) errores['email'] = 'Introduce tu correo electrónico.';
    if (!this.contrasena) errores['contrasena'] = 'Introduce tu contraseña.';
    this.errores.set(errores);
    this.errorGeneral.set('');
    if (Object.keys(errores).length) return;

    this.enviando.set(true);
    try {
      const usuario = await this.sesion.login(email, this.contrasena);
      this.avisos.exito(`Hola de nuevo, ${usuario.nombre.split(' ')[0]}.`);
      this.router.navigate(['/']);
    } catch (error) {
      this.errorGeneral.set(mensajeDeApi(error, 'No se pudo iniciar sesión. Inténtalo de nuevo.'));
    } finally {
      this.enviando.set(false);
    }
  }
}
