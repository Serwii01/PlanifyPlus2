import { DatePipe } from '@angular/common';
import { afterRenderEffect, Component, computed, DestroyRef, ElementRef, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Avisos } from '../../core/avisos';
import { MensajesApi } from '../../core/mensajes-api';
import { Mensaje } from '../../core/modelos';
import { Sesion } from '../../core/sesion';
import { Avatar } from '../avatar/avatar';
import { Icono } from '../icono/icono';

/** Cada cuántos milisegundos se piden mensajes nuevos. */
const INTERVALO_SONDEO = 5000;
const MAXIMO_TEXTO = 1000;

/**
 * Chat de una actividad entre las personas inscritas. Carga los últimos mensajes y después
 * sondea la API cada pocos segundos (solo mientras la pestaña está visible).
 * El admin lo ve en modo lectura y puede borrar mensajes.
 */
@Component({
  selector: 'app-chat-actividad',
  imports: [DatePipe, RouterLink, Avatar, Icono],
  templateUrl: './chat-actividad.html',
  styleUrl: './chat-actividad.css',
})
export class ChatActividad implements OnInit {
  protected readonly sesion = inject(Sesion);
  private readonly api = inject(MensajesApi);
  private readonly avisos = inject(Avisos);

  readonly actividadId = input.required<number>();
  /** false para el admin: solo lee y modera. */
  readonly puedoEscribir = input(true);

  private readonly lista = viewChild.required<ElementRef<HTMLDivElement>>('lista');

  protected readonly mensajes = signal<Mensaje[]>([]);
  protected readonly cargando = signal(true);
  protected readonly enviando = signal(false);
  protected readonly texto = signal('');
  protected readonly maximo = MAXIMO_TEXTO;

  protected readonly caracteresRestantes = computed(() => MAXIMO_TEXTO - this.texto().length);
  protected readonly puedeEnviar = computed(() => this.texto().trim().length > 0 && !this.enviando());

  private temporizador?: ReturnType<typeof setInterval>;
  /** Último mensaje conocido, para pedir solo los posteriores. */
  private ultimoId = 0;
  /** Número de mensajes en el último renderizado, para hacer scroll solo cuando llegan nuevos. */
  private renderizados = -1;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearInterval(this.temporizador));

    afterRenderEffect(() => {
      const cuantos = this.mensajes().length;
      if (cuantos !== this.renderizados) {
        this.renderizados = cuantos;
        const el = this.lista().nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    });
  }

  /** Los inputs ya están disponibles aquí (en el constructor todavía no). */
  ngOnInit(): void {
    this.cargar();
    this.temporizador = setInterval(() => this.sondear(), INTERVALO_SONDEO);
  }

  /** Enter envía; Mayús+Enter añade una línea. */
  protected alPulsar(evento: KeyboardEvent): void {
    if (evento.key === 'Enter' && !evento.shiftKey) {
      evento.preventDefault();
      this.enviar();
    }
  }

  protected async enviar(): Promise<void> {
    const texto = this.texto().trim();
    if (!texto || this.enviando()) return;

    this.enviando.set(true);
    try {
      const mensaje = await this.api.enviar(this.actividadId(), texto);
      this.texto.set('');
      this.anadir([mensaje]);
    } catch (error) {
      this.avisos.errorDeApi(error, 'No se pudo enviar el mensaje.');
    } finally {
      this.enviando.set(false);
    }
  }

  protected puedeBorrar(mensaje: Mensaje): boolean {
    return mensaje.propio || this.sesion.esAdmin();
  }

  protected async eliminar(mensaje: Mensaje): Promise<void> {
    const seguro = await this.avisos.confirmar('Eliminar mensaje', 'El mensaje desaparecerá para todo el mundo.', {
      textoAceptar: 'Eliminar',
      peligrosa: true,
    });
    if (!seguro) return;

    try {
      await this.api.eliminar(mensaje.id);
      this.mensajes.update((lista) => lista.filter((m) => m.id !== mensaje.id));
    } catch (error) {
      this.avisos.errorDeApi(error, 'No se pudo eliminar el mensaje.');
    }
  }

  /** Si el mensaje anterior es de la misma persona y reciente, se muestra sin cabecera. */
  protected continuaAnterior(indice: number): boolean {
    const lista = this.mensajes();
    const actual = lista[indice];
    const anterior = lista[indice - 1];
    if (!anterior || anterior.usuario.id !== actual.usuario.id) return false;
    return new Date(actual.enviado_en).getTime() - new Date(anterior.enviado_en).getTime() < 5 * 60_000;
  }

  /** Separador de fecha cuando cambia el día respecto al mensaje anterior. */
  protected cambiaDeDia(indice: number): boolean {
    const lista = this.mensajes();
    return indice === 0 || lista[indice - 1].enviado_en.slice(0, 10) !== lista[indice].enviado_en.slice(0, 10);
  }

  private async cargar(): Promise<void> {
    try {
      this.anadir(await this.api.listar(this.actividadId()));
    } catch (error) {
      this.avisos.errorDeApi(error, 'No se pudo cargar el chat.');
    } finally {
      this.cargando.set(false);
    }
  }

  private async sondear(): Promise<void> {
    if (document.hidden || this.cargando()) return;
    try {
      this.anadir(await this.api.listar(this.actividadId(), this.ultimoId));
    } catch {
      // Un fallo puntual del sondeo no merece un aviso: se reintenta en el siguiente.
    }
  }

  private anadir(nuevos: Mensaje[]): void {
    if (!nuevos.length) return;
    this.mensajes.update((lista) => {
      const conocidos = new Set(lista.map((m) => m.id));
      return [...lista, ...nuevos.filter((m) => !conocidos.has(m.id))];
    });
    this.ultimoId = Math.max(this.ultimoId, ...nuevos.map((m) => m.id));
  }
}
