// src/app/core/auth/auth-guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    console.log('authGuard: Usuario autenticado. Permitiendo acceso.');
    return true; // Permite el acceso si está autenticado
  } else {
    console.log('authGuard: Usuario NO autenticado. Redirigiendo a login.');
    router.navigate(['/login']); // Redirige al login si no está autenticado
    return false; // No permite el acceso a la ruta protegida
  }
};