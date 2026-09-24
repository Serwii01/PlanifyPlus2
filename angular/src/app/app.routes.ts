import { Routes } from '@angular/router';
import { sesionGuard, usuarioGuard } from './core/guards';
import { DetalleActividad } from './paginas/detalle-actividad/detalle-actividad';
import { ConfPerfil } from './paginas/conf-perfil/conf-perfil';
import { CrearActividad } from './paginas/crear-actividad/crear-actividad';
import { Inicio } from './paginas/inicio/inicio';
import { Login } from './paginas/login/login';
import { NoEncontrada } from './paginas/no-encontrada/no-encontrada';
import { Perfil } from './paginas/perfil/perfil';
import { PerfilPublicoPagina } from './paginas/perfil-publico/perfil-publico';
import { Registro } from './paginas/registro/registro';
import { Social } from './paginas/social/social';

export const routes: Routes = [
  { path: '', component: Inicio, title: 'PlanifyPlus - Inicio' },
  { path: 'login', component: Login, title: 'PlanifyPlus - Iniciar sesión' },
  { path: 'registro', component: Registro, title: 'PlanifyPlus - Crear cuenta' },
  { path: 'actividades/nueva', component: CrearActividad, canActivate: [usuarioGuard], title: 'PlanifyPlus - Crear actividad' },
  { path: 'actividades/:id', component: DetalleActividad, title: 'PlanifyPlus - Actividad' },
  { path: 'actividades/:id/editar', component: CrearActividad, canActivate: [usuarioGuard], title: 'PlanifyPlus - Editar actividad' },
  { path: 'perfil', component: Perfil, canActivate: [sesionGuard], title: 'PlanifyPlus - Mi perfil' },
  { path: 'usuarios/:id', component: PerfilPublicoPagina, title: 'PlanifyPlus - Perfil' },
  { path: 'social', component: Social, canActivate: [usuarioGuard], title: 'PlanifyPlus - Tu red' },
  { path: 'perfil/editar', component: ConfPerfil, canActivate: [usuarioGuard], title: 'PlanifyPlus - Configuración del perfil' },
  { path: '**', component: NoEncontrada, title: 'PlanifyPlus - Página no encontrada' },
];
