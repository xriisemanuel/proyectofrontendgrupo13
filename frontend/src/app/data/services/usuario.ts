import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/constants/constants';

// --- Definiciones de Interfaces (¡CRUCIALES PARA EL TIPADO CORRECTO!) ---
export interface IRol {
  _id: string;
  nombre: string;
  estado: boolean;
  fechaCreacion?: Date;
}

export interface IClientePerfil {
  _id: string;
  direccion: string;
  fechaNacimiento?: string; // Usamos string para el input type="date"
  preferenciasAlimentarias?: string[];
  puntos: number;
}

export interface IRepartidorPerfil {
  _id: string;
  estado: string;
  vehiculo: string;
  numeroLicencia: string;
  ubicacionActual?: { lat: number, lon: number }; // Corregido a 'lon' para consistencia con el modelo
  historialEntregas?: string[];
  calificacionPromedio?: number;
}

// La interfaz IUsuario ahora incluye los perfiles específicos populados
export interface IUsuario {
  _id: string;
  username: string;
  email: string;
  telefono?: string;
  nombre: string;
  apellido: string;
  rolId: IRol; // rolId DEBE ser del tipo IRol (el objeto poblado)
  estado: boolean;
  clienteId?: IClientePerfil; // Ahora es el objeto Cliente populado
  repartidorId?: IRepartidorPerfil; // Ahora es el objeto Repartidor populado
}
// --- Fin de Definiciones de Interfaces ---


const USUARIO_API = API_BASE_URL + '/usuario'; // URL base para la API de gestión de usuarios (corregido de '/usuario' a '/usuarios')
const ROLES_API = API_BASE_URL + '/rol'; // Asumiendo que tienes un endpoint para roles

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  constructor(private http: HttpClient) { }

  /**
   * Obtiene la lista de todos los usuarios del sistema.
   * Corresponde a GET /api/usuarios
   * @returns Un Observable con un array de usuarios.
   */
  getUsuarios(): Observable<IUsuario[]> {
    return this.http.get<IUsuario[]>(USUARIO_API);
  }

  /**
   * Obtiene un usuario específico por su ID.
   * Corresponde a GET /api/usuarios/:id
   * @param id El ID del usuario.
   * @returns Un Observable con los datos del usuario.
   */
  getUsuarioById(id: string): Observable<IUsuario> {
    return this.http.get<IUsuario>(`${USUARIO_API}/${id}`);
  }

  /**
   * Actualiza un usuario existente.
   * Corresponde a PUT /api/usuarios/:id
   * @param id El ID del usuario a actualizar.
   * @param userData Los datos actualizados del usuario.
   * @returns Un Observable con la respuesta del backend.
   */
  updateUsuario(id: string, userData: any): Observable<any> {
    return this.http.put<any>(`${USUARIO_API}/${id}`, userData);
  }

  /**
   * Elimina un usuario por su ID.
   * Corresponde a DELETE /api/usuarios/:id
   * @param id El ID del usuario a eliminar.
   * @returns Un Observable con la respuesta del backend.
   */
  deleteUsuario(id: string): Observable<any> {
    return this.http.delete<any>(`${USUARIO_API}/${id}`);
  }

  /**
   * Obtiene la lista de todos los roles disponibles.
   * Corresponde a GET /api/roles
   * @returns Un Observable con un array de roles.
   */
  getRoles(): Observable<IRol[]> {
    return this.http.get<IRol[]>(ROLES_API);
  }
}
