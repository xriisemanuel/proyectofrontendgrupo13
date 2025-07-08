// proyecto/frontend/src/app/core/auth/auth.service.ts
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../core/constants/constants'; // Asegúrate de que esta ruta sea correcta

// Importar la interfaz de registro
import { IRegisterUserPayload, IRegisterSuccessResponse } from './auth.interface';

// Importar jwt-decode
import { jwtDecode } from 'jwt-decode';
import { IUsuario } from '../../shared/interfaces'; // Asegúrate de que esta ruta sea correcta

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
      // --- CAMBIO CLAVE: Usar sessionStorage en lugar de localStorage ---
      const storedUser = sessionStorage.getItem('user');
      console.log('AuthService constructor: Usuario almacenado en sessionStorage:', storedUser);
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // Al inicializar, también validamos el token si existe
          if (parsedUser && parsedUser.token && !this.isTokenExpired(parsedUser.token)) {
            initialUser = parsedUser;
          } else {
            // Si el token está expirado o es inválido, limpiamos sessionStorage
            sessionStorage.removeItem('user');
            console.log('AuthService constructor: Token expirado o inválido en sessionStorage. Sesión limpiada.');
          }
        } catch (e) {
          console.error('AuthService constructor: Error al parsear usuario de sessionStorage:', e);
          sessionStorage.removeItem('user'); // Limpiar si hay error al parsear
        }
      }
    }
    this.currentUserSubject = new BehaviorSubject<any>(initialUser);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  /**
   * Registra un nuevo usuario con los datos de payload.
   * @param payload Objeto que contiene todos los datos de registro, incluyendo campos de perfil.
   * @returns Observable con la respuesta del registro.
   */
  register(payload: IRegisterUserPayload): Observable<IRegisterSuccessResponse> {
    console.log('AuthService: Enviando payload de registro al backend:', payload);
    return this.http.post<IRegisterSuccessResponse>(AUTH_API + 'register', payload);
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(AUTH_API + 'login', { username, password })
      .pipe(map(response => {
        console.log('AuthService login: Respuesta del backend:', response);
        if (this.isBrowser && response && response.token) {
          // Almacenar solo si el token no está expirado inmediatamente
          if (!this.isTokenExpired(response.token)) {
            // --- CAMBIO CLAVE: Usar sessionStorage en lugar de localStorage ---
            sessionStorage.setItem('user', JSON.stringify(response));
            this.currentUserSubject.next(response);
            console.log('AuthService login: Usuario guardado en sessionStorage y BehaviorSubject.');
          } else {
            console.warn('AuthService login: Token recibido ya expirado. No se guarda la sesión.');
            this.logout(); // Limpiar por si acaso
          }
        }
        return response;
      }));
  }

  logout() {
    if (this.isBrowser) {
      // --- CAMBIO CLAVE: Usar sessionStorage en lugar de localStorage ---
      sessionStorage.removeItem('user');
      console.log('AuthService logout: Usuario eliminado de sessionStorage.');
    }
    this.currentUserSubject.next(null);
  }

  /**
   * Decodifica el token JWT y verifica si ha expirado.
   * @param token El token JWT a verificar.
   * @returns True si el token ha expirado o es inválido, false en caso contrario.
   */
  private isTokenExpired(token: string): boolean {
    if (!token) {
      return true;
    }
    try {
      const decoded: any = jwtDecode(token);
      if (!decoded || !decoded.exp) {
        return true; // No se pudo decodificar o no tiene fecha de expiración
      }
      const currentTime = Date.now() / 1000; // Tiempo actual en segundos
      return decoded.exp < currentTime; // True si expiró
    } catch (error) {
      console.error('Error al decodificar el token JWT:', error);
      return true; // Si hay un error al decodificar, consideramos que es inválido/expirado
    }
  }

  /**
   * Obtiene el token JWT actual y verifica su validez.
   * @returns El JWT token string o null si no está autenticado o el token ha expirado.
   */
  getToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }
    const user = this.currentUserSubject.value;
    const token = user && user.token ? user.token : null;

    if (token && this.isTokenExpired(token)) {
      console.log('AuthService getToken: Token expirado. Realizando logout.');
      this.logout(); // Limpiar sesión si el token expiró
      return null;
    }
    return token;
  }

  /**
   * Obtiene el rol del usuario del token JWT decodificado.
   * @returns El nombre del rol como string o null si no está autenticado o el rol no se encuentra.
   */
  getRole(): string | null {
    if (!this.isBrowser || !this.isAuthenticated()) { // Solo intenta obtener el rol si está autenticado
      return null;
    }
    const user = this.currentUserSubject.value;
    const token = user && user.token ? user.token : null;

    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        // Asumiendo que el rol está en la propiedad 'rol' del payload del token
        return decoded.rol || null;
      } catch (error) {
        console.error('Error al obtener el rol del token:', error);
        this.logout(); // Si el token es inválido para decodificar, limpia la sesión
        return null;
      }
    }
    return null;
  }

  /**
   * Checks if the user is currently authenticated and has a valid, non-expired token.
   * @returns True if authenticated with a valid token, false otherwise.
   */
  isAuthenticated(): boolean {
    return !!this.getToken(); // Depende de getToken() que ahora valida la expiración
  }

  getLoggedInUserId(): string | null {
    if (this.isBrowser) {
      const userResponse = this.currentUserSubject.value;
      const userId = userResponse && userResponse.usuario && (userResponse.usuario.id || userResponse.usuario._id) ? 
                     (userResponse.usuario.id || userResponse.usuario._id) : null;
      return userId;
    }
    return null;
  }
}