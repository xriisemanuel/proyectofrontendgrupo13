// src/app/services/pedido/pedido.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http'; // Importa HttpHeaders
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/constants/constants'; // Asegúrate de que esta ruta sea correcta
import { IPedidoPayload } from '../../shared/pedido.interface'; // Importa IPedidoPayload
import { IPedido } from '../../shared/interfaces'; // Importa IPedido
import { AuthService } from '../../core/auth/auth'; // Importa AuthService

const PEDIDO_API = `${API_BASE_URL}/pedido`; // Ruta base de la API para pedidos (ajusta si es diferente)

@Injectable({
  providedIn: 'root'
})
export class PedidoService {

  constructor(
    private http: HttpClient,
    private authService: AuthService // Inyecta AuthService
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
   * @description Obtiene una lista de pedidos.
   * Dependiendo del rol, el backend filtra automáticamente.
   * Para supervisor_cocina, se podría querer filtrar por estados específicos.
   * @param estados Opcional. Array de estados por los que filtrar (ej. ['pendiente', 'en_preparacion']).
   * @returns Un Observable con un array de pedidos.
   */
  getPedidos(
    estados?: string[],
    repartidorId?: string,
    clienteId?: string,
    fechaDesde?: string, // Usamos string para que coincida con el input type="date"
    fechaHasta?: string, // Usamos string para que coincida con el input type="date"
    searchTerm?: string
  ): Observable<IPedido[]> {
    let params = new HttpParams();

    if (estados && estados.length > 0) {
      params = params.set('estados', estados.join(','));
    }
    if (repartidorId) {
      params = params.set('repartidorId', repartidorId);
    }
    if (clienteId) {
      params = params.set('clienteId', clienteId);
    }
    if (fechaDesde) {
      params = params.set('fechaDesde', fechaDesde);
    }
    if (fechaHasta) {
      params = params.set('fechaHasta', fechaHasta);
    }
    if (searchTerm) {
      params = params.set('searchTerm', searchTerm); // Asume que tu backend maneja este filtro
    }

    // APLICA LOS ENCABEZADOS DE AUTENTICACIÓN AQUÍ
    return this.http.get<IPedido[]>(PEDIDO_API, { headers: this.getAuthHeaders(), params });
  }

  /**
   * @description Obtiene un pedido por su ID.
   * @param id El ID del pedido.
   * @returns Un Observable con el pedido.
   */
  getPedidoById(id: string): Observable<IPedido> {
    // APLICA LOS ENCABEZADOS DE AUTENTICACIÓN AQUÍ
    return this.http.get<IPedido>(`${PEDIDO_API}/${id}`, { headers: this.getAuthHeaders() });
  }

  /**
   * @description Actualiza el estado de un pedido.
   * Esta es la función clave para el Supervisor de Cocina.
   * @param id El ID del pedido a actualizar.
   * @param nuevoEstado El nuevo estado del pedido.
   * @returns Un Observable con la respuesta del backend.
   */
  updateEstadoPedido(id: string, nuevoEstado: IPedido['estado']): Observable<any> {
    // APLICA LOS ENCABEZADOS DE AUTENTICACIÓN AQUÍ
    return this.http.patch(`${PEDIDO_API}/${id}/estado`, { nuevoEstado }, { headers: this.getAuthHeaders() });
  }

  // --- Métodos adicionales que podrías necesitar más adelante o para otros roles ---

  /**
   * @description Crea un nuevo pedido. (Principalmente para el cliente)
   * Acepta directamente el IPedidoPayload que se construye en el frontend.
   * @param pedidoData Los datos del pedido a crear.
   * @returns Un Observable con la respuesta del backend.
   */
  createPedido(pedidoData: IPedidoPayload): Observable<any> {
    // APLICA LOS ENCABEZADOS DE AUTENTICACIÓN AQUÍ
    return this.http.post(PEDIDO_API, pedidoData, { headers: this.getAuthHeaders() });
  }

  /**
   * @description Actualiza cualquier campo de un pedido. (Principalmente para admin/supervisor_ventas)
   * @param id El ID del pedido a actualizar.
   * @param updateData Los campos a actualizar.
   * @returns Un Observable con la respuesta del backend.
   */
  updatePedido(id: string, updateData: Partial<IPedido>): Observable<any> {
    // APLICA LOS ENCABEZADOS DE AUTENTICACIÓN AQUÍ
    return this.http.put(`${PEDIDO_API}/${id}`, updateData, { headers: this.getAuthHeaders() });
  }

  /**
   * @description Elimina un pedido. (Solo para admin)
   * @param id El ID del pedido a eliminar.
   * @returns Un Observable con la respuesta del backend.
   */
  deletePedido(id: string): Observable<any> {
    // APLICA LOS ENCABEZADOS DE AUTENTICACIÓN AQUÍ
    return this.http.delete(`${PEDIDO_API}/${id}`, { headers: this.getAuthHeaders() });
  }

  /**
   * @description Obtiene pedidos asignados a un repartidor específico, opcionalmente filtrados por estado.
   * @param repartidorId El ID del repartidor.
   * @param estados Opcional. Array de estados por los que filtrar (ej. ['en_envio', 'entregado']).
   * @returns Un Observable con un array de pedidos.
   */
  getPedidosByRepartidorId(repartidorId: string, estados?: string[]): Observable<IPedido[]> {
    let params = new HttpParams().set('repartidorId', repartidorId);
    if (estados && estados.length > 0) {
      params = params.set('estados', estados.join(',')); // Envía estados como una cadena separada por comas
    }
    // Llama al endpoint principal `/pedido` que tu `listarPedidos` ya maneja
    // APLICA LOS ENCABEZADOS DE AUTENTICACIÓN AQUÍ
    return this.http.get<IPedido[]>(PEDIDO_API, { headers: this.getAuthHeaders(), params });
  }
}
