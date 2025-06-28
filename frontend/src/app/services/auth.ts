// Este archivo es parte de un servicio de autenticación en Angular.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../core/constants'; // <-- ¡Esta es la línea de importación!

const AUTH_API = API_BASE_URL + '/auth/'; // Usa la constante para la URL base de autenticación

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<any>(JSON.parse(localStorage.getItem('user') || '{}'));
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

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

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(AUTH_API + 'login', { username, password })
      .pipe(map(response => {
        if (response && response.token) {
          localStorage.setItem('user', JSON.stringify(response));
          this.currentUserSubject.next(response);
        }
        return response;
      }));
  }

  logout() {
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    const user = this.currentUserSubject.value;
    return user && user.token ? user.token : null;
  }

  getRole(): string | null {
    const user = this.currentUserSubject.value;
    return user && user.usuario && user.usuario.rol ? user.usuario.rol : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
