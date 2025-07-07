import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth'; // Ruta corregida

@Injectable({
  providedIn: 'root'
})
export class authGuard implements CanActivate { // Mantengo el nombre de clase como 'authGuard'

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

    // Verifica si el usuario está autenticado usando tu AuthService
    if (this.authService.isAuthenticated()) {
      return true; // Permite el acceso a la ruta
    } else {
      // Si no está autenticado, redirige al login y puedes pasar la URL intentada
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false; // Deniega el acceso
    }
  }
}
