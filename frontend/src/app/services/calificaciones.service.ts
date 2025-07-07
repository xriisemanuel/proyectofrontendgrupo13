import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Calificacion {
  pedidoId: string;
  clienteId: string;
  puntuacionComida: number | null;
  puntuacionServicio: number | null;
  puntuacionEntrega: number | null;
  comentario: string;
  _id?: string;
}


@Injectable({
  providedIn: 'root'
})
export class CalificacionesService {
  private apiUrl = 'http://localhost:3000/api/calificaciones';

  constructor(private http: HttpClient) {}

  getCalificaciones(): Observable<Calificacion[]> {
    return this.http.get<Calificacion[]>(this.apiUrl);
  }

  getCalificacionById(id: string): Observable<Calificacion> {
    return this.http.get<Calificacion>(`${this.apiUrl}/${id}`);
  }

  createCalificacion(calificacion: Calificacion): Observable<Calificacion> {
    return this.http.post<Calificacion>(this.apiUrl, calificacion);
  }

  updateCalificacion(id: string, calificacion: Calificacion): Observable<Calificacion> {
    return this.http.put<Calificacion>(`${this.apiUrl}/${id}`, calificacion);
  }

  deleteCalificacion(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
