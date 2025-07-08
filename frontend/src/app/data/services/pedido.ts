// src/app/services/pedido/pedido.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/constants/constants'; // Asegúrate de que esta ruta sea correcta
import { IPedido } from '../../shared/interfaces';

const PEDIDO_API = `${API_BASE_URL}/pedido`; // Ruta base de la API para pedidos (ajusta si es diferente)

@Injectable({
  providedIn: 'root'
})
export class PedidoService {

  constructor(private http: HttpClient) { }

  /**
   * @description Obtiene una lista de pedidos.
   * Dependiendo del rol, el backend filtra automáticamente.
   * Para supervisor_cocina, se podría querer filtrar por estados específicos.
   * @param estados Opcional. Array de estados por los que filtrar (ej. ['pendiente', 'en_preparacion']).
   * @returns Un Observable con un array de pedidos.
   */
  // **AJUSTADO: Eliminando la lógica de 'url = ${PEDIDO_API}/filtrados?estado=' aquí**
  // Ya que ahora 'getPedidos' y 'getPedidosByRepartidorId' (que es el que se usa en el dashboard)
  // pueden usar el mismo endpoint raíz '/pedido' con query parameters.
  // Tu `listarPedidos` en el backend ya maneja `estado` y `repartidorId` como query params.
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

    return this.http.get<IPedido[]>(PEDIDO_API, { params });
  }

  /**
   * @description Obtiene un pedido por su ID.
   * @param id El ID del pedido.
   * @returns Un Observable con el pedido.
   */
  getPedidoById(id: string): Observable<IPedido> {
    return this.http.get<IPedido>(`${PEDIDO_API}/${id}`);
  }

  /**
   * @description Actualiza el estado de un pedido.
   * Esta es la función clave para el Supervisor de Cocina.
   * @param id El ID del pedido a actualizar.
   * @param nuevoEstado El nuevo estado del pedido.
   * @returns Un Observable con la respuesta del backend.
   */
  updateEstadoPedido(id: string, nuevoEstado: IPedido['estado']): Observable<any> {
    return this.http.patch(`${PEDIDO_API}/${id}/estado`, { nuevoEstado });
  }

  // --- Métodos adicionales que podrías necesitar más adelante o para otros roles ---

  /**
   * @description Crea un nuevo pedido. (Principalmente para el cliente)
   * @param pedidoData Los datos del pedido a crear.
   * @returns Un Observable con la respuesta del backend.
   */
  createPedido(pedidoData: Omit<IPedido, '_id' | 'fechaPedido' | 'subtotal' | 'total' | 'estado' | 'createdAt' | 'updatedAt'>): Observable<any> {
    return this.http.post(PEDIDO_API, pedidoData);
  }

  /**
   * @description Actualiza cualquier campo de un pedido. (Principalmente para admin/supervisor_ventas)
   * @param id El ID del pedido a actualizar.
   * @param updateData Los campos a actualizar.
   * @returns Un Observable con la respuesta del backend.
   */
  updatePedido(id: string, updateData: Partial<IPedido>): Observable<any> {
    // Nota: El controlador `actualizarPedido` solo permite 'admin' y 'supervisor_ventas'
    return this.http.put(`${PEDIDO_API}/${id}`, updateData);
  }

  /**
   * @description Elimina un pedido. (Solo para admin)
   * @param id El ID del pedido a eliminar.
   * @returns Un Observable con la respuesta del backend.
   */
  deletePedido(id: string): Observable<any> {
    return this.http.delete(`${PEDIDO_API}/${id}`);
  }

  /**
   * @description Obtiene pedidos filtrados por estado (endpoint específico).
   * **RECOMENDACIÓN:** Este método `getPedidosByEstado` se vuelve redundante.
   * Ahora `getPedidos(estados)` hace lo mismo llamando al endpoint principal.
   * Puedes eliminarlo si ya no lo usas explícitamente en otros lugares.
   */
  // getPedidosByEstado(estado: IPedido['estado']): Observable<IPedido[]> {
  //   return this.http.get<IPedido[]>(`${PEDIDO_API}/estado/${estado}`);
  // }

  /**
   * @description Asigna un repartidor a un pedido. (Solo para admin/supervisor_ventas)
   * @param pedidoId El ID del pedido.
   * @param repartidorId El ID del repartidor.
   * @param fechaEstimadaEntrega La fecha estimada de entrega.
   * @returns Un Observable con la respuesta del backend.
   */
  asignarRepartidor(pedidoId: string, repartidorId: string, fechaEstimadaEntrega?: Date): Observable<any> {
    return this.http.patch(`${PEDIDO_API}/${pedidoId}/asignar-repartidor`, { repartidorId, fechaEstimadaEntrega });
  }

  /**
   * @description Aplica descuentos a un pedido. (Solo para admin/supervisor_ventas)
   * @param pedidoId El ID del pedido.
   * @param montoDescuento El monto del descuento.
   * @returns Un Observable con la respuesta del backend.
   */
  aplicarDescuentos(pedidoId: string, montoDescuento: number): Observable<any> {
    return this.http.patch(`${PEDIDO_API}/${pedidoId}/aplicar-descuentos`, { montoDescuento });
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
    return this.http.get<IPedido[]>(PEDIDO_API, { params });
  }
}