import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';
import { AdminDashboard } from './components/admin-dashboard/admin-dashboard';
import { KitchenDashboard } from './components/kitchen-dashboard/kitchen-dashboard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: './login',
        pathMatch: 'full'
    }, //OK
    {
        path: 'login',
        loadComponent: () => import('./components/login/login').then(m => m.LoginComponent)
    }, //OK
    {
        path: 'register',
        loadComponent: () => import('./components/register/register').then(m => m.RegisterComponent)
    }, //OK

    // Rutas protegidas por AuthGuard y RoleGuard

    {
        path: 'admin/dashboard', loadComponent: () => import('./components/admin-dashboard/admin-dashboard').then(m => m.AdminDashboard),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin'] }
    }, //OK

    // Gestión de Roles (para Admin)
    {
        path: 'admin/roles/add',
        loadComponent: () => import('./components/admin/add-role/add-role').then(m => m.AddRole),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin'] } //OK
    },
    {
        path: 'admin/roles/manage',
        loadComponent: () => import('./components/admin/manage-roles/manage-roles').then(m => m.ManageRoles),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin'] } //OK
    },
    // { (REVISAR ESTA RUTA NO FUNCIONA)
    //     path: 'admin/roles/update/:id',
    //     loadComponent: () => import('./components/admin/update-role/update-role').then(m => m.UpdateRole),
    //     canActivate: [authGuard, roleGuard],
    //     data: { roles: ['admin'] } //OK
    // },
    {
        path: 'admin/users/update/:id',
        loadComponent: () => import('./components/admin/update-user/update-user').then(m => m.UpdateUserComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['supervisor_cocina', 'admin', 'repartidor'] }
    }, //OK

    // Gestión de Repartidores (para Admin)
    
    // {
    //     path: 'admin/repartidores/create',
    //     loadComponent: () => import('./components/admin/create-repartidor/create-repartidor').then(m => m.CreateRepartidorComponent),
    //     canActivate: [authGuard, roleGuard],
    //     data: { roles: ['admin'] }
    // },

    {
        path: 'admin/users/create',
        loadComponent: () => import('./components/admin/create-user/create-user').then(m => m.CreateUserWithRoleComponent),
        canActivate: [authGuard, roleGuard],    
        data: { roles: ['admin'] } // Solo accesible por admin
    },
    {
        path: 'admin/repartidores/manage',
        loadComponent: () => import('./components/admin/manage-repartidores/manage-repartidores').then(m => m.ManageRepartidoresComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['repartidor', 'admin'] }
    },
    // {
    //     path: 'admin/repartidores/update/:id',
    //     loadComponent: () => import('./components/admin/update-repartidor/update-repartidor').then(m => m.Up),
    //     canActivate: [authGuard, roleGuard],
    //     data: { roles: ['repartidor','admin'] }
    // },

    // --- NUEVAS RUTAS PARA CLIENTES ---
    {
        path: 'admin/clientes/manage', // Ruta para listar y gestionar clientes
        loadComponent: () => import('./components/admin/manage-clientes/manage-clientes').then(m => m.ManageClientesComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin'] } // Solo accesible por admin
    },

    //Gestion de supervisores de cocina
    {
        path: 'admin/supervisores/manage',
        loadComponent: () => import('./components/admin/manage-supervisores-cocina/manage-supervisores-cocina').then(m => m.ManageSupervisoresCocinaComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin'] }
    },
    {
        path: 'admin/supervisores-ventas/manage',
        loadComponent: () => import('./components/admin/manage-supervisores-ventas/manage-supervisores-ventas').then(m => m.ManageSupervisoresVentasComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin'] }
    },
    {
        path: 'clientes/dashboard',
        loadComponent: () => import('./components/client-dashboard/client-dashboard').then(m =>m.ClientDashboard),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['cliente'] }
    },
    {
        path: 'kitchen/dashboard',
        loadComponent: () => import('./components/kitchen-dashboard/kitchen-dashboard').then(m => m.KitchenDashboard),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['supervisor_cocina'] }
    },
    {
        path: 'sales/dashboard',
        loadComponent: () => import('./components/sales-dashboard/sales-dashboard').then(m => m.SalesDashboard),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['supervisor_ventas'] }
    },
    {
        path: 'delivery/dashboard',
        loadComponent: () => import('./components/delivery-dashboard/delivery-dashboard').then(m => m.DeliveryDashboard),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['repartidor'] }
    },
    // --- FIN NUEVAS RUTAS PARA CLIENTES ---
    {
        path: 'admin/users/manage-by-role',
        loadComponent: () => import('./components/admin/manage-users/manage-users').then(m => m.ManageUsers),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin'] }
    },

     // Rutas para el Supervisor de Cocina
  {
    path: 'admin/kitchen/dashboard',
    component: KitchenDashboard,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'supervisor_cocina'] } // Acceso para admin y supervisor_cocina
  },
    { path: '**', redirectTo: './login' } // Redirige cualquier ruta desconocida al login
];