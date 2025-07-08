// src/app/data/services/calificacion.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/constants/constants';
import { AuthService } from '../../core/auth/auth';
import { ICalificacion } from '../../shared/interfaces'; // Asegúrate de que esta interfaz exista

const CALIFICACION_API = API_BASE_URL + '/calificaciones'; // Endpoint para calificaciones

@Injectable({
    providedIn: 'root'
})
export class CalificacionService {

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    /**
     * Genera los encabezados HTTP con el token de autenticación.
     * @returns HttpHeaders con el token JWT.
     */
    private getAuthHeaders(): HttpHeaders {
        const token = this.authService.getToken();
        let headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });
        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
    }

    /**
     * Obtiene todas las calificaciones (puede ser filtrado por el backend por cliente/admin).
     * @returns Observable de un array de ICalificacion.
     */
    getCalificaciones(): Observable<ICalificacion[]> {
        return this.http.get<ICalificacion[]>(CALIFICACION_API, { headers: this.getAuthHeaders() });
    }

    /**
     * Obtiene una calificación por su ID.
     * @param id El ID de la calificación.
     * @returns Observable de ICalificacion.
     */
    getCalificacionById(id: string): Observable<ICalificacion> {
        return this.http.get<ICalificacion>(`${CALIFICACION_API}/${id}`, { headers: this.getAuthHeaders() });
    }

    /**
     * Crea una nueva calificación.
     * @param calificacion Los datos de la nueva calificación.
     * @returns Observable de la respuesta del backend.
     */
    createCalificacion(calificacion: Partial<ICalificacion>): Observable<any> {
        return this.http.post<any>(CALIFICACION_API, calificacion, { headers: this.getAuthHeaders() });
    }

    /**
     * Actualiza una calificación existente.
     * @param id El ID de la calificación a actualizar.
     * @param calificacion Los datos actualizados de la calificación.
     * @returns Observable de la respuesta del backend.
     */
    updateCalificacion(id: string, calificacion: Partial<ICalificacion>): Observable<any> {
        return this.http.put<any>(`${CALIFICACION_API}/${id}`, calificacion, { headers: this.getAuthHeaders() });
    }

    /**
     * Elimina una calificación por su ID.
     * @param id El ID de la calificación a eliminar.
     * @returns Observable de la respuesta del backend.
     */
    deleteCalificacion(id: string): Observable<any> {
        return this.http.delete<any>(`${CALIFICACION_API}/${id}`, { headers: this.getAuthHeaders() });
    }

    /**
     * Obtiene calificaciones por ID de cliente.
     * @param clienteId El ID del cliente.
     * @returns Observable de un array de ICalificacion.
     */
    getCalificacionesByClienteId(clienteId: string): Observable<ICalificacion[]> {
        return this.http.get<ICalificacion[]>(`${CALIFICACION_API}/cliente/${clienteId}`, { headers: this.getAuthHeaders() });
    }
}
