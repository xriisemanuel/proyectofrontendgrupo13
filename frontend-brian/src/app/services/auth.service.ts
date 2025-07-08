/**
 * Servicio de Autenticación
 * 
 * Maneja todas las operaciones relacionadas con la autenticación de usuarios:
 * - Login y logout
 * - Registro de usuarios
 * - Gestión de tokens JWT
 * - Verificación de roles y permisos
 * - Integración con el servicio de roles
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { RoleService, UserRole } from './role.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /** URL base de la API de autenticación */
  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(
    private http: HttpClient,
    private roleService: RoleService
  ) { }

  /**
   * Autentica un usuario con credenciales
   * @param credentials - Objeto con username y password
   * @returns Observable con la respuesta del servidor
   */
  login(credentials: { username: string, password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response && response.token && typeof window !== 'undefined' && window.localStorage) {
          // Guardar token en localStorage
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

  /**
   * Registra un nuevo usuario
   * @param userData - Datos del usuario a registrar
   * @returns Observable con la respuesta del servidor
   */
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

  /**
   * Cierra la sesión del usuario actual
   * Elimina el token y limpia el rol
   */
  logout() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('token');
    }
    this.roleService.clearRole();
  }

  /**
   * Obtiene el token JWT del localStorage
   * @returns Token JWT o null si no existe
   */
  getToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('token');
    }
    return null;
  }

  /**
   * Verifica si el usuario está autenticado
   * @returns true si existe un token válido
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Obtiene el rol actual del usuario
   * @returns Rol del usuario actual
   */
  getCurrentRole(): UserRole {
    return this.roleService.getRole();
  }

  /**
   * Verifica si el usuario es administrador
   * @returns true si el rol es 'admin'
   */
  isAdmin(): boolean {
    return this.roleService.isAdmin();
  }

  /**
   * Verifica si el usuario es cliente
   * @returns true si el rol es 'cliente'
   */
  isCliente(): boolean {
    return this.roleService.isCliente();
  }

  /**
   * Verifica si el usuario tiene permisos de administrador
   * @returns true si tiene permisos de admin o supervisor
   */
  hasAdminPermissions(): boolean {
    return this.roleService.hasAdminPermissions();
  }
}
