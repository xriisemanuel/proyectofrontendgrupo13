/**
 * Configuración de Rutas de la Aplicación
 * 
 * Define todas las rutas disponibles en la aplicación:
 * - Rutas públicas (accesibles sin autenticación)
 * - Rutas protegidas (requieren autenticación)
 * - Rutas de administrador (requieren permisos especiales)
 * - Redirecciones y rutas por defecto
 */
import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ComboListComponent } from './components/combo-list/combo-list.component';
import { ComboFormComponent } from './components/combo-form/combo-form.component';
import { OfertaListComponent } from './components/oferta-list/oferta-list.component';
import { OfertaFormComponent } from './components/oferta-form/oferta-form.component';

export const routes: Routes = [
  // Ruta principal - Página de inicio
  { path: '', component: HomeComponent },
  
  // Rutas de autenticación
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Rutas de combos
  { path: 'combos', component: ComboListComponent },
  { path: 'crear-combo', component: ComboFormComponent },
  { path: 'editar-combo/:id', component: ComboFormComponent },
  
  // Rutas de ofertas
  { path: 'ofertas', component: OfertaListComponent },
  { path: 'crear-oferta', component: OfertaFormComponent },
  { path: 'editar-oferta/:id', component: OfertaFormComponent },
  
  // Redirección por defecto - cualquier ruta no encontrada va al inicio
  { path: '**', redirectTo: '' }
];
