import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth'; // Ruta corregida

@Injectable({
  providedIn: 'root'
})
export class roleGuard implements CanActivate { // Mantengo el nombre de clase como 'roleGuard'

  constructor(private authService: AuthService, private router: Router) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

    // Obtiene los roles permitidos para esta ruta desde los datos de la ruta (definidos en app.routes.ts)
    const expectedRoles = route.data['roles'] as Array<string>;

    // Si no se especifican roles en la ruta, y AuthGuard ya se ejecutó, permite el acceso
    // Esto es una salvaguarda, pero todas las rutas con RoleGuard deberían tener 'data: { roles: [...] }'
    if (!expectedRoles || expectedRoles.length === 0) {
      return true;
    }

    // Obtiene el rol del usuario actual desde AuthService
    const userRole = this.authService.getRole();

    // Si el usuario tiene un rol y ese rol está incluido en la lista de roles esperados
    if (userRole && expectedRoles.includes(userRole)) {
      return true; // Permite el acceso
    } else {
      // Si el rol no está permitido, redirige a una página de acceso denegado o al dashboard principal
      console.warn(`Acceso denegado: Usuario con rol '${userRole}' intentó acceder a ruta protegida con roles: ${expectedRoles.join(', ')}`);
      // Redirige a un dashboard genérico si está logueado, o al login si no
      if (this.authService.isAuthenticated()) {
        const currentUserRole = this.authService.getRole();
        switch (currentUserRole) {
          case 'admin':
            this.router.navigate(['/admin/dashboard']);
            break;
          case 'cliente':
            this.router.navigate(['/cliente/dashboard']);
            break;
          case 'repartidor':
            this.router.navigate(['/repartidor/dashboard']);
            break;
          case 'supervisor_cocina':
            this.router.navigate(['/cocina/dashboard']);
            break;
          case 'supervisor_ventas':
            this.router.navigate(['/ventas/dashboard']);
            break;
          default:
            this.router.navigate(['/dashboard']); // Dashboard genérico
            break;
        }
      } else {
        this.router.navigate(['/login']); // Si no está autenticado, al login
      }
      return false; // Deniega el acceso
    }
  }
}
