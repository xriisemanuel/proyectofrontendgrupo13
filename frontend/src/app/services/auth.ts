// src/app/services/auth.ts (¡Este es el archivo que debes actualizar!)
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { API_BASE_URL } from '../core/constants';
// Asegúrate de que estas importaciones sean correctas si tienes interfaces IUsuario o IRol
// Si no las tienes, puedes eliminarlas o definirlas. Por ahora, las mantendremos.
import { IUsuario, IRol } from './usuario'; 

const AUTH_API = API_BASE_URL + '/auth/';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>; // Este es el observable al que se suscriben los componentes
  public currentUserValue: any; // Este es el getter para obtener el valor actual directamente
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    let initialUser = null;
    if (this.isBrowser) {
      const storedUser = localStorage.getItem('user');
      try {
        initialUser = storedUser ? JSON.parse(storedUser) : null;
      } catch (e) {
        console.error('AuthService constructor: ERROR al parsear usuario desde localStorage:', e);
        localStorage.removeItem('user'); // Limpiar datos corruptos
        initialUser = null;
      }
    }
    
    this.currentUserSubject = new BehaviorSubject<any>(initialUser);
    this.currentUser = this.currentUserSubject.asObservable();
    // Suscribirse internamente para mantener currentUserValue actualizado
    this.currentUser.subscribe(user => this.currentUserValue = user); 
  }

  // Método register con 13 argumentos (¡ahora sí coincidirá!)
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
        tap(response => {
          if (this.isBrowser && response && response.token) {
            if (response.usuario && response.usuario.rol) {
                response.usuario.rol = String(response.usuario.rol).trim().toLowerCase();
            }
            localStorage.setItem('user', JSON.stringify(response));
            this.currentUserSubject.next(response);
          }
        }),
        catchError((error: HttpErrorResponse) => {
            this.logout();
            return throwError(() => new Error(error.error?.mensaje || 'Credenciales inválidas o error de red.'));
        })
      );
  }

  logout() {
    if (this.isBrowser) {
      localStorage.removeItem('user');
    }
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    if (this.isBrowser) {
      const userResponse = this.currentUserSubject.value;
      return userResponse && userResponse.token ? userResponse.token : null;
    }
    return null;
  }

  getRole(): string | null {
    if (this.isBrowser) {
      const userResponse = this.currentUserSubject.value;
      let roleName = null;
      if (userResponse && userResponse.usuario && userResponse.usuario.rol) {
          roleName = String(userResponse.usuario.rol).trim().toLowerCase();
      }
      return roleName;
    }
    return null;
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

  isAuthenticated(): boolean {
    const authenticated = !!this.getToken();
    return authenticated;
  }

  // Métodos de verificación de roles (¡ahora sí existen en este archivo!)
  hasAdminPermissions(): boolean {
    const role = this.getRole();
    return role === 'admin';
  }

  hasSupervisorVentasPermissions(): boolean {
    const role = this.getRole();
    return role === 'supervisor_ventas' || role === 'admin';
  }

  hasSupervisorCocinaPermissions(): boolean {
    const role = this.getRole();
    return role === 'supervisor_cocina' || role === 'admin';
  }

  hasRepartidorPermissions(): boolean {
    const role = this.getRole();
    return role === 'repartidor' || role === 'admin';
  }

  isCliente(): boolean {
    const role = this.getRole();
    return role === 'cliente';
  }
}
