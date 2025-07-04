import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';
import { Dashboard } from './components/dashboard/dashboard';
import { AdminDashboard } from './components/admin-dashboard/admin-dashboard';
import { LoginComponent } from './components/login/login';



export const routes: Routes = [
    {
        path: '',
        redirectTo: './login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadComponent: () => import('./components/login/login').then(m => m.LoginComponent)
    },
    {
        path: 'register',
        loadComponent: () => import('./components/register/register').then(m => m.RegisterComponent)
    },
    {
        path: 'dashboard', // Un dashboard genérico para cualquier usuario logueado
        component: Dashboard,
        canActivate: [authGuard] // Solo usuarios autenticados
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
    {
        path: 'admin/roles/update/:id',
        loadComponent: () => import('./components/admin/update-rol/update-rol').then(m => m.UpdateRol),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin'] }
    },
    {
        path: 'admin/users/manage-by-role',
        loadComponent: () => import('./components/admin/manage-users/manage-users').then(m => m.ManageUsers),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin'] }
    },


    // rutas para REPARTIDOR
    {
        path: 'admin/users/create',
        loadComponent: () => import('./components/admin/create-user/create-user').then(m => m.CreateUserWithRoleComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin'] }
    },
    {
        path: 'admin/repartidores/manage',
        loadComponent: () => import('./components/admin/manage-repartidores/manage-repartidores').then(m => m.ManageRepartidores),
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
        loadComponent: () => import('./components/admin/manage-clientes/manage-clientes').then(m => m.ManageClientes),
        title: 'Gestión de Clientes'
    },
    // {
    //     path: 'clientes/update/:id', // Ruta para actualizar un cliente específico
    //     loadComponent: () => import('./components/admin/update-cliente/update-cliente.component').then(m => m.UpdateClienteComponent),
    //     title: 'Actualizar Cliente'
    // },
    // --- FIN NUEVAS RUTAS PARA CLIENTES ---

    {
        path: 'admin/dashboard',
        component: AdminDashboard,
        canActivate: [authGuard, roleGuard], // Requiere autenticación Y rol 'admin'
        data: { roles: ['admin'] } // Pasa los roles permitidos a RoleGuard
    },
    { path: '**', redirectTo: './login' } // Redirige cualquier ruta desconocida al login
];