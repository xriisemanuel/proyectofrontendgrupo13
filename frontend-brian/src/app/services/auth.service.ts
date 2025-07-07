import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { RoleService, UserRole } from './role.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(
    private http: HttpClient,
    private roleService: RoleService
  ) { }

  login(credentials: { username: string, password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response && response.token && typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('token', response.token);
          
          // Establecer rol basado en la respuesta del backend
          if (response.usuario && response.usuario.rol) {
            const role = response.usuario.rol as UserRole;
            this.roleService.setRole(role);
          } else {
            // Por defecto cliente si no hay rol en la respuesta
            this.roleService.setRole('cliente');
          }
        }
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        // Si el registro es exitoso, establecer el rol del usuario registrado
        if (response && response.token && response.usuario && response.usuario.rol) {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('token', response.token);
          }
          const role = response.usuario.rol as UserRole;
          this.roleService.setRole(role);
        }
      })
    );
  }

  logout() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('token');
    }
    this.roleService.clearRole();
  }

  getToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('token');
    }
    return null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getCurrentRole(): UserRole {
    return this.roleService.getRole();
  }

  isAdmin(): boolean {
    return this.roleService.isAdmin();
  }

  isCliente(): boolean {
    return this.roleService.isCliente();
  }

  hasAdminPermissions(): boolean {
    return this.roleService.hasAdminPermissions();
  }
}
