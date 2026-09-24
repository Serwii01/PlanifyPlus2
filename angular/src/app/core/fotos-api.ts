import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Foto } from './modelos';

/** Banco de fotos: búsqueda por etiquetas y subida de fotos propias. */
@Injectable({ providedIn: 'root' })
export class FotosApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/fotos`;

  buscar(texto: string): Promise<Foto[]> {
    return firstValueFrom(this.http.get<Foto[]>(this.url, { params: { q: texto } }));
  }

  /**
   * Sube una imagen. Las públicas entran en el banco con sus etiquetas para que
   * cualquiera las use de portada; las privadas solo sirven de avatar.
   */
  subir(archivo: File, opciones: { etiquetas?: string; titulo?: string; publica: boolean }): Promise<Foto> {
    const datos = new FormData();
    datos.append('archivo', archivo);
    datos.append('publica', opciones.publica ? '1' : '0');
    if (opciones.etiquetas) datos.append('etiquetas', opciones.etiquetas);
    if (opciones.titulo) datos.append('titulo', opciones.titulo);
    return firstValueFrom(this.http.post<Foto>(this.url, datos));
  }
}
