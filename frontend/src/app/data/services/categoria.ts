// src/app/data/services/categoria.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'; // Importa HttpParams
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/constants/constants';
import { AuthService } from '../../core/auth/auth';

import { ICategoria, IProducto } from '../../shared/interfaces'; // Importa ICategoria y IProducto

const CATEGORIA_API = API_BASE_URL + '/categorias'; // Asegúrate de que este endpoint coincida con tu backend (puede ser '/categorias')

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  /**
   * Genera los encabezados HTTP con el token de autenticación.
   * @returns HttpHeaders con el token JWT.
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken(); // Obtiene el token del AuthService
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`); // Usa 'Bearer' para el token JWT
    }
    return headers;
  }

  /**
   * Obtiene todas las categorías.
   * @param estado Opcional. Filtra por estado (true para activas, false para inactivas).
   * @returns Observable de un array de ICategoria.
   */
  getCategorias(estado?: boolean): Observable<ICategoria[]> {
    let params = new HttpParams();
    if (estado !== undefined && estado !== null) { // Asegúrate de que el estado sea un booleano definido
      params = params.append('estado', estado.toString());
    }
    return this.http.get<ICategoria[]>(CATEGORIA_API, { headers: this.getAuthHeaders(), params });
  }

  /**
   * Obtiene una categoría por su ID.
   * @param id El ID de la categoría.
   * @returns Observable de ICategoria.
   */
  getCategoriaById(id: string): Observable<ICategoria> {
    return this.http.get<ICategoria>(`${CATEGORIA_API}/${id}`, { headers: this.getAuthHeaders() });
  }

  /**
   * Crea una nueva categoría.
   * @param categoria Los datos de la nueva categoría.
   * @returns Observable de la respuesta del backend.
   */
  createCategoria(categoria: Partial<ICategoria>): Observable<any> { // Usamos Partial<ICategoria> para campos opcionales
    return this.http.post<any>(CATEGORIA_API, categoria, { headers: this.getAuthHeaders() });
  }

  /**
   * Actualiza una categoría existente.
   * @param id El ID de la categoría a actualizar.
   * @param categoria Los datos actualizados de la categoría.
   * @returns Observable de la respuesta del backend.
   */
  updateCategoria(id: string, categoria: Partial<ICategoria>): Observable<any> { // Usamos Partial<ICategoria>
    return this.http.put<any>(`${CATEGORIA_API}/${id}`, categoria, { headers: this.getAuthHeaders() });
  }

  /**
   * Elimina una categoría por su ID.
   * @param id El ID de la categoría a eliminar.
   * @returns Observable de la respuesta del backend.
   */
  deleteCategoria(id: string): Observable<any> {
    return this.http.delete<any>(`${CATEGORIA_API}/${id}`, { headers: this.getAuthHeaders() });
  }

  /**
   * Activa una categoría (cambia su estado a true).
   * @param id El ID de la categoría a activar.
   * @returns Observable de la respuesta del backend.
   */
  activarCategoria(id: string): Observable<any> {
    // Asumiendo que tu backend tiene un endpoint PATCH para activar/desactivar o que PUT/PATCH con {estado: true} es suficiente
    return this.http.patch<any>(`${CATEGORIA_API}/${id}/activar`, {}, { headers: this.getAuthHeaders() });
  }

  /**
   * Desactiva una categoría (cambia su estado a false).
   * @param id El ID de la categoría a desactivar.
   * @returns Observable de la respuesta del backend.
   */
  desactivarCategoria(id: string): Observable<any> {
    // Asumiendo que tu backend tiene un endpoint PATCH para activar/desactivar
    return this.http.patch<any>(`${CATEGORIA_API}/${id}/desactivar`, {}, { headers: this.getAuthHeaders() });
  }

  /**
   * Obtiene los productos asociados a una categoría específica.
   * @param categoriaId El ID de la categoría.
   * @returns Observable de un array de productos.
   */
  getProductosByCategoria(categoriaId: string): Observable<IProducto[]> { // Tipado con IProducto[]
    return this.http.get<IProducto[]>(`${CATEGORIA_API}/${categoriaId}/productos`, { headers: this.getAuthHeaders() });
  }
}
