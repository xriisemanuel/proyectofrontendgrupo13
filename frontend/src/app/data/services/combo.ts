// src/app/data/services/combo.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ICombo, IProducto } from '../../shared/interfaces'; // Asegúrate de que la ruta sea correcta
import { API_BASE_URL } from '../../core/constants/constants';


@Injectable({
  providedIn: 'root'
})
export class ComboService {
  private apiUrl = `${API_BASE_URL}/combos`;

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
      console.error(`Código de error del backend: ${error.status}, cuerpo: ${error.error}`);
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
   * Crea un nuevo combo.
   * @param comboData Los datos del combo a crear.
   * @returns Un Observable con la respuesta del servidor.
   */
  createCombo(comboData: Partial<ICombo>): Observable<any> {
    return this.http.post<any>(this.apiUrl, comboData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene la lista de todos los combos.
   * @returns Un Observable con un array de combos.
   */
  getCombos(): Observable<ICombo[]> {
    return this.http.get<ICombo[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene un combo por su ID, incluyendo los detalles de los productos.
   * @param id El ID del combo.
   * @returns Un Observable con el combo y sus productos.
   */
  getComboById(id: string): Observable<{ combo: ICombo, productos: IProducto[] }> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza un combo existente.
   * @param id El ID del combo a actualizar.
   * @param updateData Los datos a actualizar del combo.
   * @returns Un Observable con la respuesta del servidor.
   */
  updateCombo(id: string, updateData: Partial<ICombo>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, updateData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Elimina un combo por su ID.
   * @param id El ID del combo a eliminar.
   * @returns Un Observable con la respuesta del servidor.
   */
  deleteCombo(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Activa un combo por su ID.
   * @param id El ID del combo a activar.
   * @returns Un Observable con la respuesta del servidor.
   */
  activateCombo(id: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/activar`, {}).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Desactiva un combo por su ID.
   * @param id El ID del combo a desactivar.
   * @returns Un Observable con la respuesta del servidor.
   */
  deactivateCombo(id: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/desactivar`, {}).pipe(
      catchError(this.handleError)
    );
  }
}