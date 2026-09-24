import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Mensaje } from './modelos';

/** Chat de cada actividad. No hay websockets: el componente sondea con `desde` cada pocos segundos. */
@Injectable({ providedIn: 'root' })
export class MensajesApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}`;

  /** Últimos mensajes o, con `desde`, solo los posteriores a ese id. */
  listar(actividadId: number, desde?: number): Promise<Mensaje[]> {
    const params = desde ? new HttpParams().set('desde', desde) : undefined;
    return firstValueFrom(this.http.get<Mensaje[]>(`${this.url}/actividades/${actividadId}/mensajes`, { params }));
  }

  enviar(actividadId: number, texto: string): Promise<Mensaje> {
    return firstValueFrom(this.http.post<Mensaje>(`${this.url}/actividades/${actividadId}/mensajes`, { texto }));
  }

  eliminar(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.url}/mensajes/${id}`));
  }
}
