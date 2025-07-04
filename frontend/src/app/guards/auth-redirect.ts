import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth'; // Asegúrate de que la ruta a tu AuthService sea correcta

export const authRedirectGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si el usuario ya está autenticado, redirigirlo a su dashboard según su rol
  if (authService.isAuthenticated()) {
    const userRole = authService.getRole();
    if (userRole === 'admin') {
      return router.createUrlTree(['/admin/dashboard']);
    }
    // Puedes añadir más lógica aquí para otros roles si tienen dashboards específicos
    // else if (userRole === 'cliente') {
    //   return router.createUrlTree(['/cliente/dashboard']);
    // }
    // ...
    return router.createUrlTree(['/dashboard']); // Redirección genérica si no es admin
  }

  // Si no está autenticado, permite el acceso a la ruta actual (que debería ser el login)
  return true;
};
