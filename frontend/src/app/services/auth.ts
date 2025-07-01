import { Injectable, PLATFORM_ID, Inject } from '@angular/core'; // <--- Importa PLATFORM_ID y Inject
import { isPlatformBrowser } from '@angular/common'; // <--- Importa isPlatformBrowser
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
  private isBrowser: boolean; // <--- Nueva propiedad para saber si estamos en el navegador

  // Inyecta PLATFORM_ID en el constructor
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object // <--- Inyección de PLATFORM_ID
  ) {
    // Determina si el código se está ejecutando en un navegador
    this.isBrowser = isPlatformBrowser(this.platformId);

    let initialUser = null;
    // Solo intenta acceder a localStorage si estamos en el navegador
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

  // Método para el registro de usuarios
  register(username: string, password: string, email: string, telefono: string, rolName: string, nombre: string, apellido: string): Observable<any> {
    return this.http.post(AUTH_API + 'register', {
      username,
      password,
      email,
      telefono,
      rolName,
      nombre,
      apellido
    });
  }

  // Método para el inicio de sesión
  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(AUTH_API + 'login', { username, password })
      .pipe(map(response => {
        // Guarda el token y los datos del usuario en localStorage solo si estamos en el navegador
        if (this.isBrowser && response && response.token) {
          localStorage.setItem('user', JSON.stringify(response));
          this.currentUserSubject.next(response); // Actualiza el BehaviorSubject
        }
        return response;
      }));
  }

  // Método para cerrar sesión
  logout() {
    // Elimina del localStorage solo si estamos en el navegador
    if (this.isBrowser) {
      localStorage.removeItem('user');
    }
    this.currentUserSubject.next(null); // Limpia el usuario actual
  }

  // Método para obtener el token JWT del usuario actual
  getToken(): string | null {
    // Accede a localStorage solo si estamos en el navegador
    if (this.isBrowser) {
      const user = this.currentUserSubject.value;
      return user && user.token ? user.token : null;
    }
    return null; // Si no estamos en el navegador, no hay token
  }

  // Método para obtener el rol del usuario actual
  getRole(): string | null {
    // Accede a localStorage solo si estamos en el navegador
    if (this.isBrowser) {
      const user = this.currentUserSubject.value;
      return user && user.usuario && user.usuario.rol ? user.usuario.rol : null;
    }
    return null; // Si no estamos en el navegador, no hay rol
  }

  // Método para verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
