// src/app/data/services/rol.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/constants/constants';
import { AuthService } from '../../core/auth/auth';

// --- ¡IMPORTACIÓN CORRECTA Y ÚNICA DE IRol! ---
import { IRol } from '../../shared/interfaces';
// --- FIN DE IMPORTACIÓN ---

const ROLES_API = API_BASE_URL + '/rol';

@Injectable({
  providedIn: 'root'
})
export class RolService {

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  getRoles(): Observable<IRol[]> {
    return this.http.get<IRol[]>(ROLES_API, { headers: this.getAuthHeaders() });
  }

  createRole(roleData: Partial<IRol>): Observable<any> {
    return this.http.post<any>(ROLES_API, roleData, { headers: this.getAuthHeaders() });
  }

  getRolById(id: string): Observable<IRol> {
    return this.http.get<IRol>(`${ROLES_API}/${id}`, { headers: this.getAuthHeaders() });
  }

  updateRol(id: string, roleData: Partial<IRol>): Observable<any> {
    return this.http.put<any>(`${ROLES_API}/${id}`, roleData, { headers: this.getAuthHeaders() });
  }

  deleteRol(id: string): Observable<any> {
    return this.http.delete<any>(`${ROLES_API}/${id}`, { headers: this.getAuthHeaders() });
  }
}