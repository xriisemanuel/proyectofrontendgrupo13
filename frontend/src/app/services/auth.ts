import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../core/constants';
import { IUsuario, IRol } from './usuario'; // Ruta corregida a usuario.service.ts

const AUTH_API = API_BASE_URL + '/auth/';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    let initialUser = null;
    if (this.isBrowser) {
      const storedUser = localStorage.getItem('user');
      console.log('AuthService constructor: Usuario almacenado en localStorage:', storedUser);
      initialUser = storedUser ? JSON.parse(storedUser) : null;
    }
    this.currentUserSubject = new BehaviorSubject<any>(initialUser);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  register(
    username: string,
    password: string,
    email: string,
    telefono: string,
    rolName: string,
    nombre: string,
    apellido: string,
    direccionCliente?: string,
    fechaNacimientoCliente?: string,
    preferenciasAlimentariasCliente?: string[],
    puntosCliente?: number,
    vehiculoRepartidor?: string,
    numeroLicenciaRepartidor?: string
  ): Observable<any> {
    return this.http.post(AUTH_API + 'register', {
      username,
      password,
      email,
      telefono,
      rolName,
      nombre,
      apellido,
      direccionCliente,
      fechaNacimientoCliente,
      preferenciasAlimentariasCliente,
      puntosCliente,
      vehiculoRepartidor,
      numeroLicenciaRepartidor
    });
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(AUTH_API + 'login', { username, password })
      .pipe(map(response => {
        console.log('AuthService login: Respuesta del backend:', response);
        if (this.isBrowser && response && response.token) {
          localStorage.setItem('user', JSON.stringify(response));
          this.currentUserSubject.next(response);
          console.log('AuthService login: Usuario guardado en localStorage y BehaviorSubject.');
        }
        return response;
      }));
  }

  logout() {
    if (this.isBrowser) {
      localStorage.removeItem('user');
      console.log('AuthService logout: Usuario eliminado de localStorage.');
    }
    this.currentUserSubject.next(null);
  }

  /**
   * Gets the current user's JWT token.
   * @returns The JWT token string or null if not authenticated.
   */
  getToken(): string | null {
    if (this.isBrowser) {
      const user = this.currentUserSubject.value;
      console.log('AuthService getToken: currentUserSubject.value:', user);
      return user && user.token ? user.token : null;
    }
    return null;
  }

  /**
   * Gets the current user's role.
   * @returns The role name string or null if not authenticated or role not found.
   */
  getRole(): string | null {
    if (this.isBrowser) {
      const user = this.currentUserSubject.value;
      console.log('AuthService getRole: currentUserSubject.value para rol:', user);
      const role = user && user.usuario && user.usuario.rol ? user.usuario.rol : null;
      console.log('AuthService getRole: Rol extraído:', role);
      return role;
    }
    return null;
  }

  /**
   * Checks if the user is currently authenticated.
   * @returns True if authenticated, false otherwise.
   */
  isAuthenticated(): boolean {
    const authenticated = !!this.getToken();
    console.log('AuthService isAuthenticated: ', authenticated);
    return authenticated;
  }
}
