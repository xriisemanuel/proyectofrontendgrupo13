import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../core/constants';

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
      initialUser = storedUser ? JSON.parse(storedUser) : null;
    }
    this.currentUserSubject = new BehaviorSubject<any>(initialUser);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  /**
   * Registers a new user with their specific role profile.
   * This method now accepts all potential fields for different roles,
   * which the backend will handle conditionally.
   * @param username User's chosen username.
   * @param password User's password.
   * @param email User's email.
   * @param telefono User's phone number (optional).
   * @param rolName The name of the role (e.g., 'cliente', 'repartidor').
   * @param nombre User's first name.
   * @param apellido User's last name.
   * @param direccionCliente Client's address (optional, for 'cliente' role).
   * @param fechaNacimientoCliente Client's date of birth (optional, for 'cliente' role).
   * @param preferenciasAlimentariasCliente Client's dietary preferences (optional, for 'cliente' role).
   * @param puntosCliente Client's loyalty points (optional, for 'cliente' role).
   * @param vehiculoRepartidor Delivery person's vehicle (optional, for 'repartidor' role).
   * @param numeroLicenciaRepartidor Delivery person's license number (optional, for 'repartidor' role).
   * @returns An Observable with the backend response.
   */
  register(
    username: string,
    password: string,
    email: string,
    telefono: string,
    rolName: string,
    nombre: string,
    apellido: string,
    // Campos específicos de cliente
    direccionCliente?: string,
    fechaNacimientoCliente?: string, // Asumiendo formato de string para input de fecha
    preferenciasAlimentariasCliente?: string[], // Nuevo campo para preferencias
    puntosCliente?: number, // Nuevo campo para puntos
    // Campos específicos de repartidor
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
      // Pass all optional fields to the backend; it will handle them based on rolName
      direccionCliente,
      fechaNacimientoCliente,
      preferenciasAlimentariasCliente, // Enviar al backend
      puntosCliente, // Enviar al backend
      vehiculoRepartidor,
      numeroLicenciaRepartidor
    });
  }

  /**
   * Handles user login.
   * @param username User's username.
   * @param password User's password.
   * @returns An Observable with the login response including token and user data.
   */
  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(AUTH_API + 'login', { username, password })
      .pipe(map(response => {
        if (this.isBrowser && response && response.token) {
          localStorage.setItem('user', JSON.stringify(response));
          this.currentUserSubject.next(response);
        }
        return response;
      }));
  }

  /**
   * Logs out the current user.
   */
  logout() {
    if (this.isBrowser) {
      localStorage.removeItem('user');
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
      return user && user.usuario && user.usuario.rol ? user.usuario.rol : null;
    }
    return null;
  }

  /**
   * Checks if the user is currently authenticated.
   * @returns True if authenticated, false otherwise.
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
