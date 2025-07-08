// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth-guard'; // Importa el guard de autenticación
import { roleGuard } from './core/auth/role-guard'; // Importa el guard de roles
// ELIMINADO: import { authRedirectGuard } from './core/auth/auth-redirect'; // Se elimina el guard de redirección

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
  // Ya no usan authRedirectGuard. Serán accesibles directamente.
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent),
    // ELIMINADO: canActivate: [authRedirectGuard]
    // ELIMINADO: data: { roles: ['admin', 'cliente'] }
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent),
    // ELIMINADO: canActivate: [authRedirectGuard]
    // ELIMINADO: data: { roles: ['admin', 'cliente'] }
  },

  // Rutas protegidas por AuthGuard y RoleGuard

  // Dashboard de Administrador
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard').then(m => m.AdminDashboard), // Ruta corregida
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },

  // Gestión de Roles (para Admin)
  {
    path: 'admin/roles/add',
    loadComponent: () => import('./features/admin/add-role/add-role').then(m => m.AddRole), // Ruta corregida
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'admin/roles/manage',
    loadComponent: () => import('./features/admin/manage-roles/manage-roles').then(m => m.ManageRoles),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },
  // --- ¡CORRECCIÓN CLAVE AQUÍ! ---
  {
    path: 'admin/roles/edit/:id', // <--- ¡Añadido el parámetro :id!
    loadComponent: () => import('./features/admin/edit-role/edit-role').then(m => m.EditRoleComponent), // Ruta corregida
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },
  // --- FIN CORRECCIÓN CLAVE ---

  // Gestión de Usuarios General (para Admin)
  {
    path: 'admin/users/create',
    loadComponent: () => import('./features/admin/create-user/create-user').then(m => m.CreateUserWithRoleComponent), // Ruta corregida
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'admin/users/manage-by-role',
    loadComponent: () => import('./features/admin/manage-users/manage-users').then(m => m.ManageUsers),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },
  // --- ¡NUEVA RUTA PARA EDITAR USUARIO! ---
  {
    path: 'admin/users/edit/:id', // Ruta para editar un usuario específico
    loadComponent: () => import('./features/admin/edit-user/edit-user').then(m => m.EditUserComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] } // Solo admins pueden editar usuarios
  },
  // Gestión de Supervisores de Ventas (para Admin)
  // NO EXISTEN MÁS COMPONENTES; DEBEMOS CREARLOS (esto se abordará en un paso posterior si es necesario)
  { path: '**', redirectTo: 'home' }
];