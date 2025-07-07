// src/app/core/auth/auth-redirect.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth'; // Asegúrate de la ruta correcta a tu AuthService

export const authRedirectGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // Si el usuario está autenticado, redirige a su dashboard
    // Aquí puedes añadir lógica para redirigir según el rol del usuario
    const userRole = authService.getRole(); // Asumiendo que getRole() devuelve el nombre del rol
    console.log('authRedirectGuard: Usuario autenticado. Rol:', userRole);

    if (userRole === 'admin') {
      router.navigate(['/admin/dashboard']);
      return false; // No permite el acceso a la ruta actual (login/register)
    }
    // Puedes añadir más condiciones para otros roles si tienes dashboards específicos
    // else if (userRole === 'cliente') { router.navigate(['/client/dashboard']); return false; }
    // else if (userRole === 'repartidor') { router.navigate(['/delivery/dashboard']); return false; }

    // Si no hay un rol específico o no se redirige a un dashboard conocido,
    // puedes redirigir a una página por defecto o simplemente no permitir el acceso.
    router.navigate(['/home']); // Redirige a home si no hay un dashboard específico
    return false; // No permite el acceso a la ruta actual (login/register)
  }
  console.log('authRedirectGuard: Usuario NO autenticado. Permitiendo acceso a login/register.');
  return true; // Permite el acceso a la ruta actual (login/register) si no está autenticado
};