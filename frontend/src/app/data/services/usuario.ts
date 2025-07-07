// proyecto/frontend/src/app/data/services/usuario.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Importar HttpHeaders
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/constants/constants'; // Asegúrate de que esta ruta sea correcta
import { AuthService } from '../../core/auth/auth'; // Importar AuthService

// --- Definiciones de Interfaces (¡CRUCIALES PARA EL TIPADO CORRECTO!) ---
export interface IRol {
  _id: string;
  nombre: string;
  estado: boolean;
  fechaCreacion?: Date; // createdAt
  updatedAt?: Date; // updatedAt (añadido para consistencia con el modelo backend)
}

export interface IClientePerfil {
  _id: string;
  usuarioId: string; // Añadido para reflejar la referencia al usuario
  direccion: string;
  fechaNacimiento?: string; // Usamos string para el input type="date"
  preferenciasAlimentarias?: string[];
  puntos: number;
}

export interface IRepartidorPerfil {
  _id: string;
  usuarioId: string; // Añadido para reflejar la referencia al usuario
  estado: string;
  vehiculo: string;
  numeroLicencia: string;
  ubicacionActual?: { lat: number, lon: number };
  historialEntregas?: any[]; // Puede ser un array de objetos con pedidoId, fechaEntrega, calificacionCliente
  calificacionPromedio?: number;
  disponible?: boolean; // Añadido para consistencia con el modelo backend
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
  createdAt?: Date; // Añadido para consistencia con el modelo backend
  updatedAt?: Date; // Añadido para consistencia con el modelo backend
}
// --- Fin de Definiciones de Interfaces ---


const USUARIO_API = API_BASE_URL + '/usuario'; // URL base para la API de gestión de usuarios
const ROLES_API = API_BASE_URL + '/rol'; // Asumiendo que tienes un endpoint para roles

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  constructor(
    private http: HttpClient,
    private authService: AuthService // Inyectar AuthService
  ) { }

  // Método auxiliar para obtener los headers con el token
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  /**
   * Obtiene la lista de todos los usuarios del sistema.
   * Corresponde a GET /api/usuario (o /api/usuarios si tu ruta es plural)
   * @returns Un Observable con un array de usuarios.
   */
  getUsuarios(): Observable<IUsuario[]> {
    return this.http.get<IUsuario[]>(USUARIO_API, { headers: this.getAuthHeaders() });
  }

  /**
   * Obtiene un usuario específico por su ID.
   * Corresponde a GET /api/usuario/:id
   * @param id El ID del usuario.
   * @returns Un Observable con los datos del usuario.
   */
  getUsuarioById(id: string): Observable<IUsuario> {
    return this.http.get<IUsuario>(`${USUARIO_API}/${id}`, { headers: this.getAuthHeaders() });
  }

  /**
   * Actualiza un usuario existente.
   * Corresponde a PUT /api/usuario/:id
   * @param id El ID del usuario a actualizar.
   * @param userData Los datos actualizados del usuario.
   * @returns Un Observable con la respuesta del backend.
   */
  updateUsuario(id: string, userData: any): Observable<any> {
    return this.http.put<any>(`${USUARIO_API}/${id}`, userData, { headers: this.getAuthHeaders() });
  }

  /**
   * Elimina un usuario por su ID.
   * Corresponde a DELETE /api/usuario/:id
   * @param id El ID del usuario a eliminar.
   * @returns Un Observable con la respuesta del backend.
   */
  deleteUsuario(id: string): Observable<any> {
    return this.http.delete<any>(`${USUARIO_API}/${id}`, { headers: this.getAuthHeaders() });
  }

  /**
   * Obtiene la lista de todos los roles disponibles.
   * Corresponde a GET /api/rol
   * @returns Un Observable con un array de roles.
   */
  getRoles(): Observable<IRol[]> {
    return this.http.get<IRol[]>(ROLES_API, { headers: this.getAuthHeaders() });
  }
}