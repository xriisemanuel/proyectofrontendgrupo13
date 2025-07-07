import { inject } from '@angular/core';
import { Router, CanActivateFn, UrlTree } from '@angular/router'; // Importa UrlTree
import { AuthService } from './auth'; // Asegúrate de que la ruta a tu AuthService sea correcta

export const authRedirectGuard: CanActivateFn = (route, state): boolean | UrlTree => { // Define el tipo de retorno
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si el usuario ya está autenticado, redirigirlo a su dashboard según su rol
  if (authService.isAuthenticated()) {
    const userRole = authService.getRole();
    switch (userRole) {
      case 'admin':
        return router.createUrlTree(['/admin/dashboard']);
      case 'cliente':
        return router.createUrlTree(['/cliente/dashboard']);
      case 'repartidor':
        return router.createUrlTree(['/repartidor/dashboard']);
      case 'supervisor_cocina':
        return router.createUrlTree(['/cocina/dashboard']);
      case 'supervisor_ventas':
        return router.createUrlTree(['/ventas/dashboard']);
      default:
        return router.createUrlTree(['/dashboard']); // Dashboard genérico si el rol no tiene una ruta específica
    }
  }

  // Si no está autenticado, permite el acceso a la ruta actual (que debería ser el login o register)
  return true;
};
