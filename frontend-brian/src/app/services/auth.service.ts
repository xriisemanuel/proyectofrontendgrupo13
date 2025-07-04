import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth/login';
  private registerUrl = 'http://localhost:3000/api/auth/register';

  constructor(private http: HttpClient) { }

  login(credentials: { username: string, password: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl, credentials).pipe(
      tap(response => {
        if (response && response.token && typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('token', response.token);
        }
      })
    );
  }

  registerAdmin(data: any): Observable<any> {
    // No agregar campo 'rol', solo enviar los datos tal cual (con 'rolName')
    const { rol, ...dataSinRol } = data;
    return this.http.post<any>(this.registerUrl, dataSinRol);
  }

  logout() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('token');
    }
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
}
