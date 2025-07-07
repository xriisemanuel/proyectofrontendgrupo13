// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth-guard'; // Importa el guard de autenticación
import { roleGuard } from './core/auth/role-guard'; // Importa el guard de roles
import { authRedirectGuard } from './core/auth/auth-redirect'; // Importa el guard de redirección para usuarios ya logueados

export const routes: Routes = [
  // Ruta por defecto: redirige al Home (página pública)
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  // Ruta Home (pública, accesible sin autenticación)
  {
    path: 'home',
    loadComponent: () => import('./public/home-page/home-page').then(m => m.HomePageComponent)
  },
  // Rutas públicas de autenticación (login y register)
  // Usan authRedirectGuard para redirigir a usuarios ya logueados a su dashboard
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent),
    canActivate: [authRedirectGuard] // <--- ¡CORREGIDO! Solo authRedirectGuard
    // data: { roles: ['admin', 'cliente'] } // <--- ELIMINADO: No es necesario aquí
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent),
    canActivate: [authRedirectGuard] // <--- ¡CORREGIDO! Solo authRedirectGuard
    // data: { roles: ['admin', 'cliente'] } // <--- ELIMINADO: No es necesario aquí
  },

  // Rutas protegidas por AuthGuard y RoleGuard

  // Dashboard de Administrador
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./features/admin/components/admin-dashboard/admin-dashboard').then(m => m.AdminDashboard),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },

  // Gestión de Roles (para Admin)
  {
    path: 'admin/roles/add',
    loadComponent: () => import('./features/admin/components/admin/add-role/add-role').then(m => m.AddRole),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'admin/roles/manage',
    loadComponent: () => import('./features/admin/manage-roles/manage-roles').then(m => m.ManageRoles),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },

  // Gestión de Usuarios General (para Admin)
  {
    path: 'admin/users/create',
    loadComponent: () => import('./features/admin/components/admin/create-user/create-user').then(m => m.CreateUserWithRoleComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'admin/users/manage-by-role',
    loadComponent: () => import('./features/admin/manage-users/manage-users').then(m => m.ManageUsers),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },
  // Gestión de Supervisores de Ventas (para Admin)
  //NO EXISTEN MAS COMPONENTES; DEBEMOS CREAELOS
  { path: '**', redirectTo: 'home' }
];
