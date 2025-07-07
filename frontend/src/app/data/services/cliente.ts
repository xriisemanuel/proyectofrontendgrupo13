import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/constants/constants'; // Importa la URL base de tu API

// --- Definiciones de Interfaces para un tipado estricto (si no las tienes ya en un archivo de tipos global) ---
// Es buena práctica tener estas interfaces centralizadas, por ejemplo, en un archivo `src/app/shared/interfaces.ts`
// y luego importarlas donde se necesiten. Por ahora, las incluimos aquí para que el servicio funcione.

export interface IRol {
  _id: string;
  nombre: string;
  estado: boolean;
  fechaCreacion?: Date;
}

export interface IUsuario {
  _id: string;
  username: string;
  email: string;
  telefono?: string;
  nombre: string;
  apellido: string;
  rolId: IRol; // rolId DEBE ser del tipo IRol (el objeto poblado)
  estado: boolean;
  clienteId?: string;
}

export interface ICliente {
  _id: string;
  usuarioId: IUsuario; // usuarioId DEBE ser del tipo IUsuario (el objeto poblado)
  direccion: string;
  fechaNacimiento?: Date;
  preferenciasAlimentarias?: string[];
  puntos?: number;
}
// --- Fin de Definiciones de Interfaces ---


// ¡CORRECCIÓN AQUÍ! La ruta base ahora es '/cliente' (singular)
const CLIENTE_API = API_BASE_URL + '/cliente'; // URL base para la API de clientes

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  constructor(private http: HttpClient) { }

  /**
   * @description Obtiene la lista de todos los clientes.
   * Corresponde a GET /api/cliente
   * @returns Un Observable con un array de clientes.
   */
  getClientes(): Observable<ICliente[]> {
    return this.http.get<ICliente[]>(CLIENTE_API);
  }

  /**
   * @description Obtiene un cliente específico por su ID.
   * Corresponde a GET /api/cliente/:id
   * @param id El ID del cliente.
   * @returns Un Observable con los datos del cliente.
   */
  getClienteById(id: string): Observable<ICliente> {
    return this.http.get<ICliente>(`${CLIENTE_API}/${id}`);
  }

  /**
   * @description Crea un nuevo cliente.
   * Corresponde a POST /api/cliente
   * @param cliente Los datos del nuevo cliente (usuarioId, direccion, etc.).
   * @returns Un Observable con la respuesta del backend.
   */
  createCliente(cliente: { usuarioId: string, direccion: string, fechaNacimiento?: Date, preferenciasAlimentarias?: string[], puntos?: number }): Observable<any> {
    return this.http.post<any>(CLIENTE_API, cliente);
  }

  /**
   * @description Actualiza un cliente existente.
   * Corresponde a PUT /api/cliente/:id
   * @param id El ID del cliente a actualizar.
   * @param cliente Los datos actualizados del cliente.
   * @returns Un Observable con la respuesta del backend.
   */
  updateCliente(id: string, cliente: { direccion?: string, fechaNacimiento?: Date, preferenciasAlimentarias?: string[], puntos?: number }): Observable<any> {
    return this.http.put<any>(`${CLIENTE_API}/${id}`, cliente);
  }

  /**
   * @description Elimina un cliente por su ID.
   * Corresponde a DELETE /api/cliente/:id
   * @param id El ID del cliente a eliminar.
   * @returns Un Observable con la respuesta del backend.
   */
  deleteCliente(id: string): Observable<any> {
    return this.http.delete<any>(`${CLIENTE_API}/${id}`);
  }
}
