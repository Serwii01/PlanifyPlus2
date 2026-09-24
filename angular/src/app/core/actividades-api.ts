import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Actividad, DatosActividad } from './modelos';

@Injectable({ providedIn: 'root' })
export class ActividadesApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/actividades`;

  listar(): Promise<Actividad[]> {
    return firstValueFrom(this.http.get<Actividad[]>(this.url));
  }

  obtener(id: number): Promise<Actividad> {
    return firstValueFrom(this.http.get<Actividad>(`${this.url}/${id}`));
  }

  crear(datos: DatosActividad): Promise<Actividad> {
    return firstValueFrom(this.http.post<Actividad>(this.url, datos));
  }

  actualizar(id: number, datos: DatosActividad): Promise<Actividad> {
    return firstValueFrom(this.http.put<Actividad>(`${this.url}/${id}`, datos));
  }

  eliminar(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.url}/${id}`));
  }

  inscribir(id: number): Promise<Actividad> {
    return firstValueFrom(this.http.post<Actividad>(`${this.url}/${id}/inscripcion`, {}));
  }

  cancelarInscripcion(id: number): Promise<Actividad> {
    return firstValueFrom(this.http.delete<Actividad>(`${this.url}/${id}/inscripcion`));
  }

  denunciar(id: number): Promise<Actividad> {
    return firstValueFrom(this.http.post<Actividad>(`${this.url}/${id}/denuncia`, {}));
  }

  /** Actividades en las que está inscrito el usuario en sesión. */
  misInscripciones(): Promise<Actividad[]> {
    return firstValueFrom(this.http.get<Actividad[]>(`${environment.apiUrl}/inscripciones`));
  }
}
