// src/app/core/auth/role-guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as string[]; // Obtiene los roles requeridos de la ruta

  if (!requiredRoles || requiredRoles.length === 0) {
    return true; // Si no se especifican roles, permite el acceso (aunque esto no debería pasar en rutas protegidas por roleGuard)
  }

  const userRole = authService.getRole(); // Obtiene el rol del usuario logueado
  console.log('roleGuard: Rol del usuario:', userRole, 'Roles requeridos:', requiredRoles);

  if (userRole && requiredRoles.includes(userRole)) {
    console.log('roleGuard: Rol autorizado. Permitiendo acceso.');
    return true; // Permite el acceso si el usuario tiene uno de los roles requeridos
  } else {
    console.log('roleGuard: Rol NO autorizado. Redirigiendo a home o a una página de acceso denegado.');
    // Puedes redirigir a una página de "acceso denegado" o a la página de inicio
    router.navigate(['/home']); // O a '/access-denied' si tienes una
    return false; // No permite el acceso
  }
};