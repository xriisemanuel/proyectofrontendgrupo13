import { Routes } from '@angular/router';
import { CalificacionesComponent } from './pages/calificaciones/calificaciones.component';
import { VentasComponent } from './pages/ventas/ventas.component';

export const routes: Routes = [
  { path: '', redirectTo: 'calificaciones', pathMatch: 'full' },
  { path: 'calificaciones', component: CalificacionesComponent },
  { path: 'ventas', component: VentasComponent }
];
