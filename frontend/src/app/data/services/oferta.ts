// src/app/data/services/oferta.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_BASE_URL } from '../../core/constants/constants';
import { IOferta, IOfertaPopulated } from '../../shared/oferta.interface';

@Injectable({
  providedIn: 'root'
})
export class OfertaService {
  private apiUrl = `${API_BASE_URL}/ofertas`;

  constructor(private http: HttpClient) { }

  // Obtener todas las ofertas
  getOfertas(): Observable<IOfertaPopulated[]> {
    return this.http.get<IOfertaPopulated[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener ofertas por categoría
  getOfertasByCategoria(categoriaId: string): Observable<IOfertaPopulated[]> {
    return this.http.get<IOfertaPopulated[]>(`${this.apiUrl}?categoria=${categoriaId}&vigente=true`).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener ofertas vigentes
  getOfertasVigentes(): Observable<IOfertaPopulated[]> {
    return this.http.get<IOfertaPopulated[]>(`${this.apiUrl}?vigente=true`).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener una oferta por ID
  getOfertaById(id: string): Observable<IOfertaPopulated> {
    return this.http.get<IOfertaPopulated>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Crear una nueva oferta
  createOferta(oferta: Partial<IOferta>): Observable<IOferta> {
    return this.http.post<IOferta>(this.apiUrl, oferta).pipe(
      catchError(this.handleError)
    );
  }

  // Actualizar una oferta existente
  updateOferta(id: string, oferta: Partial<IOferta>): Observable<IOferta> {
    return this.http.put<IOferta>(`${this.apiUrl}/${id}`, oferta).pipe(
      catchError(this.handleError)
    );
  }

  // Eliminar una oferta
  deleteOferta(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Activar una oferta
  activateOferta(id: string): Observable<IOferta> {
    return this.http.patch<IOferta>(`${this.apiUrl}/${id}/activar`, {}).pipe(
      catchError(this.handleError)
    );
  }

  // Desactivar una oferta
  deactivateOferta(id: string): Observable<IOferta> {
    return this.http.patch<IOferta>(`${this.apiUrl}/${id}/desactivar`, {}).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener ofertas aplicables a un producto específico
  getOfertasByProducto(productId: string): Observable<IOfertaPopulated[]> {
    return this.http.get<IOfertaPopulated[]>(`${this.apiUrl}/producto/${productId}`).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener productos en oferta
  getProductosEnOferta(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/productos-en-oferta`).pipe(
      catchError(this.handleError)
    );
  }

  // Calcular precio con descuento aplicando ofertas
  calcularPrecioConDescuento(precioOriginal: number, ofertas: IOfertaPopulated[]): number {
    if (!ofertas || ofertas.length === 0) {
      return precioOriginal;
    }

    // Aplicar el descuento más alto si hay múltiples ofertas
    const descuentoMaximo = Math.max(...ofertas.map(oferta => oferta.porcentajeDescuento));
    return precioOriginal * (1 - (descuentoMaximo / 100));
  }

  // Obtener descuento máximo aplicable
  obtenerDescuentoMaximo(ofertas: IOfertaPopulated[]): number {
    if (!ofertas || ofertas.length === 0) {
      return 0;
    }
    return Math.max(...ofertas.map(oferta => oferta.porcentajeDescuento));
  }

  // Verificar si una oferta está vigente
  isOfertaVigente(oferta: IOferta): boolean {
    const now = new Date();
    const fechaInicio = new Date(oferta.fechaInicio);
    const fechaFin = new Date(oferta.fechaFin);
    return oferta.activa && (fechaInicio <= now) && (fechaFin >= now);
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'Error desconocido';
    
    if (error.error) {
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error.mensaje) {
        errorMessage = error.error.mensaje;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('Error en OfertaService:', error);
    return throwError(() => new Error(errorMessage));
  }
}