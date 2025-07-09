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
  {
    path: 'cliente/register',
    loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent),
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
  // --- ¡NUEVA RUTA PARA GESTIÓN DE REPARTIDORES! ---
  {
    path: 'admin/repartidores/manage',
    loadComponent: () => import('./features/admin/manage-repartidores/manage-repartidores').then(m => m.ManageRepartidores),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] } // Solo admins pueden gestionar repartidores
  },
  // --- ¡NUEVA RUTA PARA GESTIÓN DE CLIENTES! ---
  {
    path: 'admin/clientes/manage',
    loadComponent: () => import('./features/admin/manage-clientes/manage-clientes').then(m => m.ManageClientes),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] } // Solo admins pueden gestionar clientes
  },
  // --- ¡NUEVA RUTA PARA GESTIÓN DE SUPERVISORES DE COCINA! ---
  {
    path: 'admin/supervisores-cocina/manage',
    loadComponent: () => import('./features/admin/manage-supervisores-cocina/manage-supervisores-cocina').then(m => m.ManageSupervisoresCocina),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] } // Solo admins pueden gestionar supervisores de cocina
  },
  ///admin/categories/edit
  // --- ¡NUEVA RUTA PARA GESTIÓN DE SUPERVISORES DE VENTAS! ---
  {
    path: 'admin/supervisores-ventas/manage',
    loadComponent: () => import('./features/admin/manage-supervisores-ventas/manage-supervisores-ventas').then(m => m.ManageSupervisoresVentas),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] } // Solo admins pueden gestionar supervisores de ventas
  },
  // --- ¡NUEVA RUTA PARA CREAR CATEGORÍA! ---
  {
    path: 'admin/categories/create',
    loadComponent: () => import('./features/admin/create-category/create-category').then(m => m.CreateCategory),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] } // Solo admins pueden crear categorías
  },
  // --- ¡NUEVA RUTA PARA CREAR PRODUCTO! ---
  {
    path: 'admin/products/create',
    loadComponent: () => import('./features/admin/create-product/create-product').then(m => m.CreateProduct),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] } // Solo admins pueden crear productos
  },
  // --- ¡NUEVA RUTA PARA GESTIONAR CATEGORÍAS! ---
  {
    path: 'admin/categories', // Ruta para la lista de categorías
    loadComponent: () => import('./features/admin/manage-categories/manage-categories').then(m => m.ManageCategories),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] } // Solo admins pueden gestionar categorías
  },
  // --- ¡NUEVA RUTA PARA GESTIONAR PRODUCTOS! ---
  {
    path: 'admin/products', // Ruta para la lista de productos
    loadComponent: () => import('./features/admin/manage-products/manage-products').then(m => m.ManageProducts),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] } // Solo admins pueden gestionar productos
  },
  // --- NUEVA RUTA: CREAR COMBO ---
  {
    path: 'admin/combos/create',
    loadComponent: () => import('./features/admin/create-combo/create-combo').then(m => m.CreateComboComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] } // Solo admins pueden crear combos
  },
  // --- NUEVA RUTA: EDITAR COMBO ---
  {
    path: 'admin/combos/edit/:id', // Ruta para editar un combo específico
    loadComponent: () => import('./features/admin/edit-combo/edit-combo').then(m => m.EditComboComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] } // Solo admins pueden editar combos
  },
  // Gestión de Categorías (para Admin) - AÑADIDA LA RUTA DE EDICIÓN
  {
    path: 'admin/categories/edit/:id', // Ruta para editar una categoría específica
    loadComponent: () => import('./features/admin/edit-category/edit-category').then(m => m.EditCategoryComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] } // Solo admins pueden editar categorías
  }
  ,

  // --- NUEVA RUTA: GESTIONAR COMBOS ---
  {
    path: 'admin/combos', // Ruta principal para gestionar combos
    loadComponent: () => import('./features/admin/manage-combos/manage-combos').then(m => m.ManageCombosComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] } // Solo admins pueden gestionar combos
  },
  {
    path: 'admin/ofertas/create',
    loadComponent: () => import('./features/admin/create-oferta/create-oferta').then(m => m.CreateOfertaComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'supervisor_ventas'] } // Admin y Supervisor de Ventas pueden crear ofertas
  },
  {
    path: 'admin/ofertas',
    loadComponent: () => import('./features/admin/manage-ofertas/manage-ofertas').then(m => m.ManageOfertasComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'supervisor_ventas'] } // Admin y Supervisor de Ventas pueden gestionar ofertas
  },
  {
    path: 'admin/ofertas/edit/:id',
    loadComponent: () => import('./features/admin/edit-oferta/edit-oferta').then(m => m.EditOfertaComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'supervisor_ventas'] } // Admin y Supervisor de Ventas pueden editar ofertas
  },
  // --- ¡NUEVA RUTA PARA PERFIL DE REPARTIDOR! ---
  {
    path: 'delivery/dashboard',
    loadComponent: () => import('./features/delivery-dashboard/delivery-dashboard').then(m => m.DeliveryDashboard),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['repartidor'] } // Solo los repartidores pueden acceder a este dashboard
  },
  // --- ¡NUEVA RUTA PARA DASHBOARD DE COCINA! ---
  {
    path: 'kitchen/dashboard',
    loadComponent: () => import('./features/kitchen-dashboard/kitchen-dashboard').then(m => m.KitchenDashboard),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['supervisor_cocina'] } // Solo el supervisor de cocina puede acceder
  },
  {
    path: 'cliente/dashboard',
    loadComponent: () => import('./features/client-dashboard/client-dashboard').then(m => m.ClientDashboard),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['cliente'] } // Solo los clientes pueden acceder a este dashboard
  },
  // Rutas específicas del Cliente
  {
    path: 'cliente/realizar-pedido',
    loadComponent: () => import('./features/cliente/realizar-pedido/realizar-pedido').then(m => m.RealizarPedidoComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['cliente'] }
  },
  {
    path: 'mis-pedidos',
    loadComponent: () => import('./features/cliente/mis-pedidos/mis-pedidos').then(m => m.MisPedidosComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['cliente'] } // Solo los clientes pueden ver sus pedidos
  },
  {
    path: 'calificaciones',
    loadComponent: () => import('./features/cliente/calificaciones/calificaciones').then(m => m.CalificacionesComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['cliente'] } // Solo los clientes pueden ver sus pedidos
  },
  {
    path: 'client/profile/edit', // <-- Nueva ruta para editar perfil
    loadComponent: () => import('./features/cliente/client-profile-edit/client-profile-edit').then(m => m.ClientProfileEditComponent), // Asegúrate de que el componente esté correctamente importado
    canActivate: [authGuard, roleGuard],
    data: { roles: ['cliente', 'admin'] } // Permite que un admin también pueda editar perfiles de cliente si es necesario
  },
  { path: '**', redirectTo: 'home' }
];