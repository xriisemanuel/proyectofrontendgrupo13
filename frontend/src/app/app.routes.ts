import { Routes } from '@angular/router';
import { RegisterComponent } from './components/register/register';
import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';

import { Dashboard} from './components/dashboard/dashboard';
import { AdminDashboard } from './components/admin-dashboard/admin-dashboard';



export const routes: Routes = [
    {
        path: '',
        redirectTo: './components/dashboard',
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

    // Rutas protegidas por rol (AuthGuard y RoleGuard)
    {
        path: 'admin/dashboard',
        component: AdminDashboard,
        canActivate: [authGuard, roleGuard], // Requiere autenticación Y rol 'admin'
        data: { roles: ['admin'] } // Pasa los roles permitidos a RoleGuard
    },
    { path: '**', redirectTo: '/dashboard' }
];
