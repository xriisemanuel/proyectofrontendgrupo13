import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Importar HttpHeaders
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/constants/constants';
import { AuthService } from '../../core/auth/auth'; // Importar AuthService para obtener el token
import { ICliente } from '../../shared/interfaces';


const CLIENTE_API = API_BASE_URL + '/cliente'; // URL base para la API de clientes

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  constructor(private http: HttpClient, private authService: AuthService) { } // Inyectar AuthService

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * @description Obtiene la lista de todos los clientes.
   * Corresponde a GET /api/cliente
   * @returns Un Observable con un array de clientes.
   */
  getClientes(): Observable<ICliente[]> {
    return this.http.get<ICliente[]>(CLIENTE_API, { headers: this.getAuthHeaders() });
  }

  /**
   * @description Obtiene un cliente específico por su ID de perfil de cliente.
   * Corresponde a GET /api/cliente/:id
   * @param id El ID del cliente (del documento Cliente).
   * @returns Un Observable con los datos del cliente.
   */
  getClienteById(id: string): Observable<ICliente> {
    return this.http.get<ICliente>(`${CLIENTE_API}/${id}`, { headers: this.getAuthHeaders() });
  }


  /**
   * @description Crea un nuevo cliente.
   * Corresponde a POST /api/cliente
   * @param cliente Los datos del nuevo cliente (usuarioId, direccion, etc.).
   * @returns Un Observable con la respuesta del backend.
   */
  createCliente(cliente: { usuarioId: string, direccion: string, fechaNacimiento?: Date, preferenciasAlimentarias?: string[], puntos?: number }): Observable<any> {
    return this.http.post<any>(CLIENTE_API, cliente, { headers: this.getAuthHeaders() });
  }

  /**
   * @description Actualiza un cliente existente.
   * Corresponde a PUT /api/cliente/:id
   * @param id El ID del cliente a actualizar.
   * @param cliente Los datos actualizados del cliente.
   * @returns Un Observable con la respuesta del backend.
   */
  updateCliente(id: string, cliente: { direccion?: string, fechaNacimiento?: Date, preferenciasAlimentarias?: string[], puntos?: number }): Observable<any> {
    return this.http.put<any>(`${CLIENTE_API}/${id}`, cliente, { headers: this.getAuthHeaders() });
  }

  /**
   * @description Elimina un cliente por su ID.
   * Corresponde a DELETE /api/cliente/:id
   * @param id El ID del cliente a eliminar.
   * @returns Un Observable con la respuesta del backend.
   */
  deleteCliente(id: string): Observable<any> {
    return this.http.delete<any>(`${CLIENTE_API}/${id}`, { headers: this.getAuthHeaders() });
  }

  /**
   * @description Obtiene un perfil de cliente por el ID del usuario asociado.
   * Corresponde a GET /api/cliente/by-usuario/:usuarioId
   * @param usuarioId El ID del usuario (del documento Usuario) asociado al cliente.
   * @returns Un Observable con los datos del cliente.
   */
  getClienteByUsuarioId(usuarioId: string): Observable<ICliente> {
    return this.http.get<ICliente>(`${CLIENTE_API}/by-usuario/${usuarioId}`, { headers: this.getAuthHeaders() });
  }
}
