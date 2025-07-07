// src/app/services/pedido/pedido.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/constants/constants'; // Asegúrate de que esta ruta sea correcta

// --- INTERFACES ---
// Estas interfaces reflejan la estructura de tus datos del backend, incluyendo las populaciones
// que se hacen en los controladores.

// Interfaz para el subdocumento detalleProductos
export interface IDetalleProducto {
  productoId: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal?: number; // El backend lo calcula, pero puede venir en la respuesta
}

// Interfaz para el usuario (usado en Cliente/Repartidor populado)
export interface IUsuarioPopulated {
  _id: string;
  username: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  rol: string;
  // Añade otros campos de usuario si los necesitas
}

// Interfaz para Cliente cuando es populado en un pedido
export interface IClientePopulated {
  _id: string;
  usuarioId: IUsuarioPopulated; // Si clienteId en Pedido.populate('clienteId') incluye usuarioId
  nombre?: string; // Si solo populas 'nombre apellido email telefono' directamente del cliente
  apellido?: string;
  email?: string;
  telefono?: string;
}

// Interfaz para Repartidor cuando es populado en un pedido
export interface IRepartidorPopulated {
  _id: string;
  nombre: string; // Basado en .populate('repartidorId', 'nombre')
  apellido?: string; // Si también se popula
  telefono?: string; // Si también se popula
  // Añade otros campos del repartidor si los necesitas y los populas
}


// Interfaz principal para un Pedido
export interface IPedido {
  _id?: string; // Opcional al crear
  clienteId: string | IClientePopulated; // Puede ser solo el ID o el objeto populado
  fechaPedido?: Date;
  estado: 'pendiente' | 'confirmado' | 'en_preparacion' | 'en_envio' | 'entregado' | 'cancelado';
  direccionEntrega: string;
  metodoPago: string;
  subtotal?: number; // Calculado en el backend
  descuentos?: number;
  costoEnvio?: number;
  total?: number; // Calculado en el backend
  detalleProductos: IDetalleProducto[];
  fechaEstimadaEntrega?: Date | null;
  repartidorId?: string | IRepartidorPopulated | null; // Puede ser solo el ID, el objeto populado o null
  observaciones?: string | null;
  createdAt?: Date; // Si usas timestamps: true
  updatedAt?: Date; // Si usas timestamps: true
}

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
  getPedidos(estados?: string[]): Observable<IPedido[]> {
    let url = PEDIDO_API;
    if (estados && estados.length > 0) {
      // Usamos el endpoint '/filtrados' y enviamos los estados como query params
      // El controlador ya maneja 'estado' como query param para getPedidosFiltrados
      url = `${PEDIDO_API}/filtrados?estado=${estados.join(',')}`;
    }
    // Si no se especifican estados, el backend devolverá lo que su lógica de rol permita.
    return this.http.get<IPedido[]>(url);
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
   * @param estado El estado por el cual filtrar.
   * @returns Un Observable con un array de pedidos.
   */
  getPedidosByEstado(estado: IPedido['estado']): Observable<IPedido[]> {
    return this.http.get<IPedido[]>(`${PEDIDO_API}/estado/${estado}`);
  }

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
}