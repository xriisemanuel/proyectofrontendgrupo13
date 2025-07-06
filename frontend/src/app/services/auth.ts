import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // Importar HttpErrorResponse
import { Observable, BehaviorSubject, of, throwError } from 'rxjs'; // Importar throwError y of
import { map, tap, catchError } from 'rxjs/operators'; // Importar tap y catchError
import { API_BASE_URL } from '../core/constants';
// Asegúrate de que la ruta a IUsuario e IRol sea correcta
// Si están en 'src/app/services/usuario.ts' o 'src/app/interfaces/usuario.interface.ts'
// ajusta la ruta. Por ahora, mantengo la que tenías:
import { IUsuario, IRol } from '../services/usuario'; 

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
      console.log('AuthService constructor: Ejecutándose en el navegador.');
      console.log('AuthService constructor: Intentando cargar usuario desde localStorage...');
      const storedUser = localStorage.getItem('user');
      console.log('AuthService constructor: Valor RAW de "user" en localStorage:', storedUser);
      
      try {
        initialUser = storedUser ? JSON.parse(storedUser) : null;
        console.log('AuthService constructor: Usuario PARSEADO desde localStorage:', initialUser);
      } catch (e) {
        console.error('AuthService constructor: ERROR al parsear usuario desde localStorage:', e);
        // Si hay un error al parsear, es probable que localStorage esté corrupto, lo borramos.
        localStorage.removeItem('user');
        initialUser = null;
      }
    } else {
      console.log('AuthService constructor: Ejecutándose en el servidor (SSR). localStorage no disponible.');
    }
    
    this.currentUserSubject = new BehaviorSubject<any>(initialUser);
    this.currentUser = this.currentUserSubject.asObservable();
    console.log('AuthService constructor: Estado inicial de currentUserSubject:', this.currentUserSubject.value);
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
      .pipe(
        tap(response => { // Usamos tap para ver el side effect sin modificar el stream
          console.log('AuthService login (TAP): Respuesta del backend RECIBIDA:', response);
          if (this.isBrowser && response && response.token) {
            localStorage.setItem('user', JSON.stringify(response));
            this.currentUserSubject.next(response);
            console.log('AuthService login (TAP): Usuario y token GUARDADOS en localStorage y BehaviorSubject.');
            console.log('AuthService login (TAP): Estado ACTUAL de currentUserSubject:', this.currentUserSubject.value);
          } else {
            console.warn('AuthService login (TAP): No hay token en la respuesta, o no es un navegador.');
          }
        }),
        catchError((error: HttpErrorResponse) => { // Captura errores de la petición HTTP
            console.error('AuthService login (CATCH ERROR): Error en la petición de login:', error);
            this.logout(); // Asegura que el estado se limpia en caso de error de login
            return throwError(() => new Error(error.error?.mensaje || 'Credenciales inválidas o error de red.'));
        })
      );
  }

  logout() {
    console.log('AuthService logout: Iniciando proceso de logout.');
    if (this.isBrowser) {
      localStorage.removeItem('user');
      console.log('AuthService logout: Usuario eliminado de localStorage.');
    }
    this.currentUserSubject.next(null);
    console.log('AuthService logout: currentUserSubject.value establecido a null.');
  }

  /**
   * Gets the current user's JWT token.
   * @returns The JWT token string or null if not authenticated.
   */
  getToken(): string | null {
    if (this.isBrowser) {
      const userResponse = this.currentUserSubject.value;
      // console.log('AuthService getToken: currentUserSubject.value:', userResponse); // Descomentar para depuración intensa
      return userResponse && userResponse.token ? userResponse.token : null;
    }
    return null;
  }

  /**
   * Gets the current user's role name.
   * @returns The role name string (e.g., 'repartidor', 'cliente', 'admin') or null if not authenticated or role not found.
   */
  getRole(): string | null {
    if (this.isBrowser) {
      const userResponse = this.currentUserSubject.value;
      // console.log('AuthService getRole: currentUserSubject.value para rol:', userResponse); // Descomentar para depuración intensa
      const roleName = userResponse && userResponse.usuario && userResponse.usuario.rol ? userResponse.usuario.rol : null;
      // console.log('AuthService getRole: Rol extraído:', roleName); // Descomentar para depuración intensa
      return roleName;
    }
    return null;
  }

  /**
   * **MÉTODO AÑADIDO/CORREGIDO:** Obtiene el ID (_id) del usuario actualmente logueado.
   * @returns El ID del usuario (string) o null si no hay usuario logueado o el ID no está disponible.
   */
  getLoggedInUserId(): string | null {
    if (this.isBrowser) {
      const userResponse = this.currentUserSubject.value;
      // console.log('AuthService getLoggedInUserId: currentUserSubject.value para ID:', userResponse); // Descomentar para depuración intensa
      // Asume que la respuesta del login tiene userResponse.usuario.id (o _id si tu backend lo devuelve así)
      const userId = userResponse && userResponse.usuario && (userResponse.usuario.id || userResponse.usuario._id) ? 
                     (userResponse.usuario.id || userResponse.usuario._id) : null;
      // console.log('AuthService getLoggedInUserId: ID de usuario logueado:', userId); // Descomentar para depuración intensa
      return userId;
    }
    return null;
  }

  /**
   * Checks if the user is currently authenticated.
   * @returns True if authenticated, false otherwise.
   */
  isAuthenticated(): boolean {
    const authenticated = !!this.getToken();
    // console.log('AuthService isAuthenticated: ', authenticated); // Descomentar para depuración intensa
    return authenticated;
  }
}