import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/constants'; // Importa la URL base de tu API

// Define la interfaz para un Rol (opcional pero recomendado para tipado)
export interface RoleInterface {
  _id?: string; // El ID es opcional al crear
  nombre: string;
  estado: boolean;
  fechaCreacion?: Date;
}

const ROLE_API = API_BASE_URL + '/rol'; // Ruta base de la API para roles

@Injectable({
  providedIn: 'root'
})
export class Role {

  constructor(private http: HttpClient) { }

  /**
   * @description Obtiene todos los roles del backend.
   * @returns Un Observable con un array de roles.
   */
  getRoles(): Observable<RoleInterface[]> {
    return this.http.get<RoleInterface[]>(ROLE_API);
  }

  /**
   * @description Crea un nuevo rol en el backend.
   * @param roleData Los datos del nuevo rol (nombre, estado).
   * @returns Un Observable con la respuesta del backend.
   */
  createRole(roleData: { nombre: string, estado: boolean }): Observable<any> {
    return this.http.post(ROLE_API, roleData);
  }

  /**
   * @description Actualiza un rol existente en el backend.
   * @param id El ID del rol a actualizar.
   * @param roleData Los datos actualizados del rol.
   * @returns Un Observable con la respuesta del backend.
   */
  updateRole(id: string, roleData: { nombre?: string, estado?: boolean }): Observable<any> {
    return this.http.put(`${ROLE_API}/${id}`, roleData);
  }

  /**
   * @description Elimina un rol del backend.
   * @param id El ID del rol a eliminar.
   * @returns Un Observable con la respuesta del backend.
   */
  deleteRole(id: string): Observable<any> {
    return this.http.delete(`${ROLE_API}/${id}`);
  }

  /**
   * @description Obtiene un rol por su ID.
   * @param id El ID del rol a obtener.
   * @returns Un Observable con el rol.
   */
  getRoleById(id: string): Observable<RoleInterface> {
    return this.http.get<RoleInterface>(`${ROLE_API}/${id}`);
  }
}
