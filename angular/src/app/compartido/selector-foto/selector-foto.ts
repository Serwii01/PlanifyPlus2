import { Component, effect, inject, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Avisos, erroresDeApi, mensajeDeApi } from '../../core/avisos';
import { FotosApi } from '../../core/fotos-api';
import { Foto } from '../../core/modelos';
import { Icono } from '../icono/icono';

const ETIQUETAS_LICENCIA: Record<string, string> = {
  cc0: 'Dominio público (CC0)',
  by: 'CC BY',
  'by-sa': 'CC BY-SA',
  propia: 'Foto de la comunidad',
};

/**
 * Elige una foto del banco de imágenes o sube una nueva.
 * Modo `banco` (portadas): busca por tema y las subidas se publican con etiquetas para que
 * otras personas las reutilicen. Modo `privado` (avatar): solo subida, sin pasar al banco.
 */
@Component({
  selector: 'app-selector-foto',
  imports: [FormsModule, Icono],
  templateUrl: './selector-foto.html',
  styleUrl: './selector-foto.css',
})
export class SelectorFoto {
  private readonly api = inject(FotosApi);
  private readonly avisos = inject(Avisos);

  /** Foto elegida (two-way: `[(foto)]`). */
  readonly foto = model<Foto | null>(null);
  readonly modo = input<'banco' | 'privado'>('banco');
  /** Texto con el que se busca al abrir el banco (p. ej. el título de la actividad). */
  readonly sugerencia = input('');
  readonly error = input<string | undefined>(undefined);

  protected textoBusqueda = '';
  protected readonly resultados = signal<Foto[] | null>(null);
  protected readonly buscando = signal(false);
  protected readonly abierto = signal(false);
  private temporizador?: ReturnType<typeof setTimeout>;

  // Subida
  protected readonly subiendo = signal(false);
  protected archivo: File | null = null;
  protected etiquetas = '';
  protected readonly errorSubida = signal('');

  constructor() {
    // Al abrir el banco se busca con la sugerencia si aún no se ha escrito nada.
    effect(() => {
      if (this.abierto() && this.modo() === 'banco' && !this.textoBusqueda && this.resultados() === null) {
        this.textoBusqueda = this.sugerencia();
        this.buscarAhora();
      }
    });
  }

  protected licencia(foto: Foto): string {
    return ETIQUETAS_LICENCIA[foto.licencia] ?? foto.licencia.toUpperCase();
  }

  protected abrir(): void {
    this.abierto.set(true);
  }

  protected buscar(): void {
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.buscarAhora(), 500);
  }

  protected elegir(foto: Foto): void {
    this.foto.set(foto);
    this.abierto.set(false);
  }

  protected quitar(): void {
    this.foto.set(null);
    this.abierto.set(this.modo() === 'banco');
  }

  protected seleccionarArchivo(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    this.archivo = entrada.files?.[0] ?? null;
    this.errorSubida.set('');
    // En modo privado (avatar) no hay etiquetas: se sube directamente.
    if (this.archivo && this.modo() === 'privado') this.subir();
  }

  protected async subir(): Promise<void> {
    if (!this.archivo) {
      this.errorSubida.set('Elige una imagen de tu equipo.');
      return;
    }
    const publica = this.modo() === 'banco';
    if (publica && !this.etiquetas.trim()) {
      this.errorSubida.set('Añade alguna etiqueta (por ejemplo "pádel, pista cubierta") para que otras personas la encuentren.');
      return;
    }

    this.subiendo.set(true);
    this.errorSubida.set('');
    try {
      const foto = await this.api.subir(this.archivo, { publica, etiquetas: this.etiquetas.trim() });
      this.foto.set(foto);
      this.abierto.set(false);
      this.archivo = null;
      this.etiquetas = '';
      this.avisos.exito(publica ? 'Foto subida. Ya está en el banco para toda la comunidad.' : 'Foto de perfil actualizada.');
    } catch (error) {
      const deApi = erroresDeApi(error);
      this.errorSubida.set(deApi['archivo'] ?? deApi['etiquetas'] ?? mensajeDeApi(error, 'No se pudo subir la foto.'));
    } finally {
      this.subiendo.set(false);
    }
  }

  private async buscarAhora(): Promise<void> {
    this.buscando.set(true);
    try {
      this.resultados.set(await this.api.buscar(this.textoBusqueda.trim()));
    } catch (error) {
      this.resultados.set([]);
      this.avisos.errorDeApi(error, 'No se pudo consultar el banco de fotos.');
    } finally {
      this.buscando.set(false);
    }
  }
}
