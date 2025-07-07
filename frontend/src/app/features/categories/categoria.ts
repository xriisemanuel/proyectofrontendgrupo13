// src/app/features/categories/services/categoria.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICategoria } from '../categories/models/categoria.model'; // Asegúrate de que esta ruta sea correcta
import { API_BASE_URL } from '../../core/constants/constants'; // Tu constante de URL base
import { AuthService } from '../../core/auth/auth'; // Tu servicio de autenticación

const CATEGORIA_API = API_BASE_URL + '/categorias'; // Endpoint para categorías

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {

  constructor(
    private http: HttpClient,
    private authService: AuthService // Inyectamos el AuthService
  ) { }

  /**
   * Genera los encabezados HTTP con el token de autenticación.
   * @returns HttpHeaders con el token JWT.
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken(); // Obtiene el token del AuthService
    if (token) {
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'x-access-token': token // O 'Authorization': `Bearer ${token}` dependiendo de tu backend
      });
    }
    // Si no hay token, devuelve headers básicos o un error (aunque esto debería manejarse con guards)
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  /**
   * Obtiene todas las categorías.
   * @param estado Opcional. Filtra por estado (true para activas, false para inactivas).
   * @returns Observable de un array de ICategoria.
   */
  getCategorias(estado?: boolean): Observable<ICategoria[]> {
    let params = new HttpParams();
    if (estado !== undefined) {
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
   * @returns Observable de la respuesta del backend (que incluye la categoría creada).
   */
  createCategoria(categoria: { nombre: string, descripcion?: string, imagen?: string, estado?: boolean }): Observable<any> {
    // El backend espera un objeto con los campos directamente
    return this.http.post<any>(CATEGORIA_API, categoria, { headers: this.getAuthHeaders() });
  }

  /**
   * Actualiza una categoría existente.
   * @param id El ID de la categoría a actualizar.
   * @param categoria Los datos actualizados de la categoría.
   * @returns Observable de la respuesta del backend (que incluye la categoría actualizada).
   */
  updateCategoria(id: string, categoria: { nombre?: string, descripcion?: string, imagen?: string, estado?: boolean }): Observable<any> {
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
   * Activa una categoría.
   * @param id El ID de la categoría a activar.
   * @returns Observable de la respuesta del backend.
   */
  activarCategoria(id: string): Observable<any> {
    return this.http.patch<any>(`${CATEGORIA_API}/${id}/activar`, {}, { headers: this.getAuthHeaders() });
  }

  /**
   * Desactiva una categoría.
   * @param id El ID de la categoría a desactivar.
   * @returns Observable de la respuesta del backend.
   */
  desactivarCategoria(id: string): Observable<any> {
    return this.http.patch<any>(`${CATEGORIA_API}/${id}/desactivar`, {}, { headers: this.getAuthHeaders() });
  }

  /**
   * Obtiene los productos asociados a una categoría específica.
   * @param categoriaId El ID de la categoría.
   * @returns Observable de un array de productos. (Necesitarás definir la interfaz de IProducto)
   */
  getProductosByCategoria(categoriaId: string): Observable<any[]> { // Considera tipar 'any[]' con 'IProducto[]' cuando la tengas
    return this.http.get<any[]>(`${CATEGORIA_API}/${categoriaId}/productos`, { headers: this.getAuthHeaders() });
  }
}