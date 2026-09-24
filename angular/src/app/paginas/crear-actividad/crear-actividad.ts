import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Cabecera } from '../../compartido/cabecera/cabecera';
import { Icono } from '../../compartido/icono/icono';
import { SelectorFoto } from '../../compartido/selector-foto/selector-foto';
import { SelectorUbicacion } from '../../compartido/selector-ubicacion/selector-ubicacion';
import { ActividadesApi } from '../../core/actividades-api';
import { Avisos, erroresDeApi } from '../../core/avisos';
import { Ubicacion } from '../../core/buscador-ubicacion';
import { DatosActividad, Foto, TIPOS_ACTIVIDAD, TipoActividad } from '../../core/modelos';
import { Sesion } from '../../core/sesion';

const ETIQUETAS_TIPO: Record<TipoActividad, string> = { DEPORTIVA: 'Deportiva', CULTURAL: 'Cultural', TALLER: 'Taller' };

/** Formulario de creación y edición de actividades: portada del banco de fotos, buscador de ubicación y mapa. */
@Component({
  selector: 'app-crear-actividad',
  imports: [FormsModule, RouterLink, Cabecera, Icono, SelectorUbicacion, SelectorFoto],
  templateUrl: './crear-actividad.html',
  styleUrl: './crear-actividad.css',
})
export class CrearActividad {
  private readonly api = inject(ActividadesApi);
  private readonly avisos = inject(Avisos);
  private readonly sesion = inject(Sesion);
  private readonly router = inject(Router);

  protected readonly tipos = TIPOS_ACTIVIDAD;
  protected readonly etiquetasTipo = ETIQUETAS_TIPO;
  /** Id de la actividad en edición; null al crear. */
  protected readonly idEdicion = signal<number | null>(null);
  protected readonly errores = signal<Record<string, string>>({});
  protected readonly enviando = signal(false);

  protected titulo = '';
  protected descripcion = '';
  protected fecha = '';
  protected hora = '';
  protected tipo: TipoActividad | '' = '';
  protected ciudad = '';
  protected aforo = '';
  protected readonly ubicacion = signal<Ubicacion | null>(null);
  protected readonly foto = signal<Foto | null>(null);

  constructor() {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('id');
    if (id) this.cargarParaEditar(Number(id));
  }

  protected quitarError(campo: string): void {
    if (!this.errores()[campo]) return;
    this.errores.update((errores) => {
      const copia = { ...errores };
      delete copia[campo];
      return copia;
    });
  }

  protected async guardar(): Promise<void> {
    const errores = this.validar();
    this.errores.set(errores);
    if (Object.keys(errores).length) {
      this.avisos.error('Revisa los campos marcados.');
      return;
    }

    const ubicacion = this.ubicacion()!;
    const datos: DatosActividad = {
      titulo: this.titulo.trim(),
      descripcion: this.descripcion.trim(),
      fecha_hora_inicio: `${this.fecha}T${this.hora}:00`,
      tipo: this.tipo as TipoActividad,
      ubicacion: ubicacion.nombre,
      ciudad: this.ciudad.trim(),
      latitud: ubicacion.latitud,
      longitud: ubicacion.longitud,
      aforo: Number(this.aforo),
      foto_id: this.foto()?.id ?? null,
    };

    const id = this.idEdicion();
    this.enviando.set(true);
    try {
      const actividad = id === null ? await this.api.crear(datos) : await this.api.actualizar(id, datos);
      this.avisos.exito(id === null ? 'Actividad publicada. Ya estás apuntado como organizador.' : 'Cambios guardados.');
      this.router.navigate(['/actividades', actividad.id]);
    } catch (error) {
      const deApi = erroresDeApi(error);
      this.errores.set(deApi);
      if (!Object.keys(deApi).length) this.avisos.errorDeApi(error, 'No se pudo guardar la actividad.');
    } finally {
      this.enviando.set(false);
    }
  }

  private validar(): Record<string, string> {
    const errores: Record<string, string> = {};
    if (!this.titulo.trim()) errores['titulo'] = 'Ponle un título a la actividad.';
    else if (this.titulo.trim().length < 3) errores['titulo'] = 'El título debe tener al menos 3 caracteres.';
    if (!this.descripcion.trim()) errores['descripcion'] = 'Cuenta en qué consiste.';
    else if (this.descripcion.trim().length < 10) errores['descripcion'] = 'Cuenta un poco más: al menos 10 caracteres.';
    else if (this.descripcion.length > 2000) errores['descripcion'] = 'La descripción no puede superar los 2000 caracteres.';
    if (!this.fecha) errores['fecha'] = 'Elige una fecha.';
    if (!this.hora) errores['hora'] = 'Indica la hora de inicio.';
    if (this.fecha && this.hora) {
      const inicio = new Date(`${this.fecha}T${this.hora}:00`);
      const dentroDeUnAno = new Date();
      dentroDeUnAno.setFullYear(dentroDeUnAno.getFullYear() + 1);
      if (Number.isNaN(inicio.getTime())) errores['fecha'] = 'La fecha o la hora no son válidas.';
      else if (inicio <= new Date()) errores['fecha'] = 'La actividad debe ser en el futuro.';
      else if (inicio > dentroDeUnAno) errores['fecha'] = 'Solo se pueden publicar actividades con menos de un año de antelación.';
    }
    if (!this.tipo) errores['tipo'] = 'Elige un tipo.';
    if (!this.ubicacion()) errores['ubicacion'] = 'Busca y selecciona la ubicación exacta.';
    if (!this.ciudad.trim()) errores['ciudad'] = 'Indica la ciudad.';

    const aforo = Number(this.aforo);
    if (!this.aforo.trim()) errores['aforo'] = 'Indica cuántas plazas hay.';
    else if (!Number.isInteger(aforo) || aforo <= 0) errores['aforo'] = 'El aforo debe ser un número mayor que 0.';
    else if (aforo > 500) errores['aforo'] = 'El aforo máximo es de 500 plazas.';

    return errores;
  }

  private async cargarParaEditar(id: number): Promise<void> {
    try {
      const actividad = await this.api.obtener(id);
      if (actividad.creador_id !== this.sesion.usuario()?.id) {
        this.avisos.error('Solo puedes editar las actividades que has creado.');
        this.router.navigate(['/']);
        return;
      }

      this.titulo = actividad.titulo;
      this.descripcion = actividad.descripcion;
      [this.fecha, this.hora] = [actividad.fecha_hora_inicio.slice(0, 10), actividad.fecha_hora_inicio.slice(11, 16)];
      this.tipo = actividad.tipo;
      this.ciudad = actividad.ciudad;
      this.aforo = String(actividad.aforo);
      this.foto.set(actividad.foto);
      if (actividad.latitud !== null && actividad.longitud !== null) {
        this.ubicacion.set({ nombre: actividad.ubicacion, tipo: '', latitud: actividad.latitud, longitud: actividad.longitud });
      }
      this.idEdicion.set(id);
    } catch (error) {
      this.avisos.errorDeApi(error, 'No se pudo cargar la actividad.');
      this.router.navigate(['/']);
    }
  }
}
