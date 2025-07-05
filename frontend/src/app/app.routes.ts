import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';
import { authRedirectGuard } from './guards/auth-redirect'; // Importa el authRedirectGuard

export const routes: Routes = [
  // Ruta por defecto: redirige al Home (página pública)
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  // Ruta Home (pública, accesible sin autenticación)
  {
    path: 'home',
    loadComponent: () => import('./components/home-page/home-page').then(m => m.HomePage)
  },
  // Rutas públicas de autenticación (login y register)
  // Usan authRedirectGuard para redirigir a usuarios ya logueados
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then(m => m.LoginComponent),
    canActivate: [authRedirectGuard] // Si ya está logueado, redirige
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register').then(m => m.RegisterComponent),
    canActivate: [authRedirectGuard] // Si ya está logueado, redirige
  },

  // Rutas protegidas por AuthGuard y RoleGuard

  // Dashboard de Administrador
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./components/admin-dashboard/admin-dashboard').then(m => m.AdminDashboard),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },

  // Gestión de Roles (para Admin)
  {
    path: 'admin/roles/add',
    loadComponent: () => import('./components/admin/add-role/add-role').then(m => m.AddRole),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'admin/roles/manage',
    loadComponent: () => import('./components/admin/manage-roles/manage-roles').then(m => m.ManageRoles),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },

  // Gestión de Usuarios General (para Admin)
  {
    path: 'admin/users/create',
    loadComponent: () => import('./components/admin/create-user/create-user').then(m => m.CreateUserWithRoleComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] } // Solo accesible por admin
  },
  {
    path: 'admin/users/manage-by-role',
    loadComponent: () => import('./components/admin/manage-users/manage-users').then(m => m.ManageUsers),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'admin/users/update/:id',
    loadComponent: () => import('./components/admin/update-user/update-user').then(m => m.UpdateUserComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },
  // Gestión de Repartidores (para Admin)
  {
    path: 'admin/repartidores/manage',
    loadComponent: () => import('./components/admin/manage-repartidores/manage-repartidores').then(m => m.ManageRepartidoresComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] } // Solo admin gestiona repartidores
  },

  // Gestión de Clientes (para Admin)
  {
    path: 'admin/clientes/manage', // Ruta para listar y gestionar clientes
    loadComponent: () => import('./components/admin/manage-clientes/manage-clientes').then(m => m.ManageClientesComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] } // Solo accesible por admin
  },

  // Gestión de Supervisores de Cocina (para Admin)
  {
    path: 'admin/supervisores-cocina/manage', // Ruta corregida a supervisores-cocina
    loadComponent: () => import('./components/admin/manage-supervisores-cocina/manage-supervisores-cocina').then(m => m.ManageSupervisoresCocinaComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },
  // Gestión de Supervisores de Ventas (para Admin)
  {
    path: 'admin/supervisores-ventas/manage',
    loadComponent: () => import('./components/admin/manage-supervisores-ventas/manage-supervisores-ventas').then(m => m.ManageSupervisoresVentasComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },

  // Dashboards de otros roles
  {
    path: 'cliente/dashboard',
    loadComponent: () => import('./components/client-dashboard/client-dashboard').then(m => m.ClientDashboard),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['cliente'] }
  },
  {
    path: 'cocina/dashboard',
    loadComponent: () => import('./components/kitchen-dashboard/kitchen-dashboard').then(m => m.KitchenDashboard),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['supervisor_cocina'] }
  },
  {
    path: 'ventas/dashboard',
    loadComponent: () => import('./components/sales-dashboard/sales-dashboard').then(m => m.SalesDashboard),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['supervisor_ventas'] }
  },
  {
    path: 'repartidor/dashboard',
    loadComponent: () => import('./components/delivery-dashboard/delivery-dashboard').then(m => m.DeliveryDashboard),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['repartidor'] }
  },

  // Ruta de wildcard: cualquier otra ruta no definida redirige al Home
  { path: '**', redirectTo: '/home' }
];
