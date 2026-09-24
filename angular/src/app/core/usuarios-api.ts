import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Actividad, PerfilPublico, UsuarioBreve } from './modelos';

@Injectable({ providedIn: 'root' })
export class UsuariosApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/usuarios`;

  perfilPublico(id: number): Promise<PerfilPublico> {
    return firstValueFrom(this.http.get<PerfilPublico>(`${this.url}/${id}`));
  }

  seguir(id: number): Promise<UsuarioBreve> {
    return firstValueFrom(this.http.post<UsuarioBreve>(`${this.url}/${id}/seguir`, {}));
  }

  dejarDeSeguir(id: number): Promise<UsuarioBreve> {
    return firstValueFrom(this.http.delete<UsuarioBreve>(`${this.url}/${id}/seguir`));
  }

  seguidores(id: number): Promise<UsuarioBreve[]> {
    return firstValueFrom(this.http.get<UsuarioBreve[]>(`${this.url}/${id}/seguidores`));
  }

  seguidos(id: number): Promise<UsuarioBreve[]> {
    return firstValueFrom(this.http.get<UsuarioBreve[]>(`${this.url}/${id}/seguidos`));
  }

  /** Personas que aún no sigues: primero con quien compartes planes, luego las de tu ciudad. */
  sugerencias(): Promise<UsuarioBreve[]> {
    return firstValueFrom(this.http.get<UsuarioBreve[]>(`${environment.apiUrl}/social/sugerencias`));
  }

  /** Planes próximos a los que va la gente a la que sigues (con `seguidos_que_van`). */
  planesDeSeguidos(): Promise<Actividad[]> {
    return firstValueFrom(this.http.get<Actividad[]>(`${environment.apiUrl}/social/planes`));
  }
}
