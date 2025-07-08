// src/app/data/services/oferta.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IOferta, IOfertaPopulated } from '../../shared/oferta.interface'; // Ajusta la ruta
import { API_BASE_URL } from '../../core/constants/constants'; // Asegúrate de que esta constante exista

@Injectable({
  providedIn: 'root'
})
export class OfertaService {
  private apiUrl = `${API_BASE_URL}/ofertas`;

  constructor(private http: HttpClient) { }

  /**
   * Manejo centralizado de errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido.';
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // El backend retornó un código de error
      console.error(`Código de error del backend: ${error.status}, cuerpo: ${JSON.stringify(error.error)}`);
      if (error.status === 400) {
        errorMessage = error.error?.mensaje || 'Datos inválidos proporcionados.';
      } else if (error.status === 404) {
        errorMessage = error.error?.mensaje || 'Recurso no encontrado.';
      } else if (error.status === 409) {
        errorMessage = error.error?.mensaje || 'Conflicto: el recurso ya existe o no se puede completar la operación.';
      } else if (error.status === 500) {
        errorMessage = error.error?.mensaje || 'Error interno del servidor.';
      } else {
        errorMessage = `Error del servidor: ${error.status} - ${error.message}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Crea una nueva oferta.
   * @param ofertaData Los datos de la oferta a crear.
   * @returns Un Observable con la respuesta del servidor.
   */
  createOferta(ofertaData: Partial<IOferta>): Observable<any> {
    return this.http.post<any>(this.apiUrl, ofertaData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene la lista de todas las ofertas.
   * @returns Un Observable con un array de ofertas.
   */
  getOfertas(): Observable<IOfertaPopulated[]> {
    return this.http.get<IOfertaPopulated[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene una oferta por su ID, incluyendo los detalles de productos y categorías.
   * @param id El ID de la oferta.
   * @returns Un Observable con la oferta y sus productos/categorías.
   */
  getOfertaById(id: string): Observable<IOfertaPopulated> {
    return this.http.get<IOfertaPopulated>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza una oferta existente.
   * @param id El ID de la oferta a actualizar.
   * @param updateData Los datos a actualizar de la oferta.
   * @returns Un Observable con la respuesta del servidor.
   */
  updateOferta(id: string, updateData: Partial<IOferta>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, updateData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Elimina una oferta por su ID.
   * @param id El ID de la oferta a eliminar.
   * @returns Un Observable con la respuesta del servidor.
   */
  deleteOferta(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Activa una oferta por su ID.
   * @param id El ID de la oferta a activar.
   * @returns Un Observable con la respuesta del servidor.
   */
  activateOferta(id: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/activar`, {}).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Desactiva una oferta por su ID.
   * @param id El ID de la oferta a desactivar.
   * @returns Un Observable con la respuesta del servidor.
   */
  deactivateOferta(id: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/desactivar`, {}).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene ofertas aplicables a un producto específico.
   * @param productId El ID del producto.
   * @returns Un Observable con las ofertas aplicables.
   */
  getOfertasByProduct(productId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/producto/${productId}`).pipe(
      catchError(this.handleError)
    );
  }
}