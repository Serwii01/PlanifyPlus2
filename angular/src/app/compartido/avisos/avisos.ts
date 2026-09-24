import { Component, inject } from '@angular/core';
import { Avisos as ServicioAvisos } from '../../core/avisos';
import { Icono, NombreIcono } from '../icono/icono';

const ICONO_POR_TIPO: Record<string, NombreIcono> = { exito: 'check', error: 'alerta', info: 'info' };

/** Pinta los toasts y el diálogo de confirmación activos. Se monta una vez en la raíz. */
@Component({
  selector: 'app-avisos',
  imports: [Icono],
  templateUrl: './avisos.html',
  styleUrl: './avisos.css',
})
export class Avisos {
  protected readonly avisos = inject(ServicioAvisos);

  protected icono(tipo: string): NombreIcono {
    return ICONO_POR_TIPO[tipo];
  }
}
