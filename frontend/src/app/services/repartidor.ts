import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/constants';

// --- Definiciones de Interfaces (DEBEN ESTAR EXPORTADAS) ---
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
  rolId: IRol; // DEBE ser IRol (objeto poblado)
  estado: boolean;
  clienteId?: string;
}

export interface IUbicacionActual {
  lat: number | null;
  lon: number | null;
}

export interface IHistorialEntrega {
  pedidoId?: string;
  fechaEntrega?: Date;
  calificacionCliente?: number;
}

export interface IRepartidor {
  _id: string;
  usuarioId: IUsuario; // DEBE ser IUsuario (objeto poblado)
  estado: string;
  vehiculo?: string;
  numeroLicencia?: string;
  ubicacionActual?: IUbicacionActual;
  historialEntregas?: IHistorialEntrega[];
  calificacionPromedio?: number;
  disponible?: boolean;
}
// --- Fin de Definiciones de Interfaces ---


const REPARTIDOR_API = API_BASE_URL + '/repartidores/';

@Injectable({
  providedIn: 'root'
})
export class RepartidorService {

  constructor(private http: HttpClient) { }

  getRepartidores(): Observable<IRepartidor[]> {
    return this.http.get<IRepartidor[]>(REPARTIDOR_API);
  }

  getRepartidorById(id: string): Observable<IRepartidor> {
    return this.http.get<IRepartidor>(REPARTIDOR_API + id);
  }

  createRepartidor(repartidor: { usuarioId: string, estado?: string, vehiculo?: string, numeroLicencia?: string }): Observable<any> {
    return this.http.post<any>(REPARTIDOR_API, repartidor);
  }

  updateRepartidor(id: string, repartidor: { estado?: string, vehiculo?: string, numeroLicencia?: string, ubicacionActual?: IUbicacionActual }): Observable<any> {
    return this.http.put<any>(REPARTIDOR_API + id, repartidor);
  }

  deleteRepartidor(id: string): Observable<any> {
    return this.http.delete<any>(REPARTIDOR_API + id);
  }

  updateUbicacion(id: string, lat: number, lon: number): Observable<any> {
    return this.http.put<any>(`${REPARTIDOR_API}${id}/ubicacion`, { lat, lon });
  }

  cambiarEstadoRepartidor(id: string, estado: string): Observable<any> {
    return this.http.patch<any>(`${REPARTIDOR_API}${id}/estado`, { estado });
  }

  registrarEntregaRepartidor(id: string, entregaData: { pedidoId: string; calificacionCliente?: number; fechaEntrega?: Date }): Observable<any> {
    return this.http.patch<any>(`${REPARTIDOR_API}${id}/registrar-entrega`, entregaData);
  }
  getRepartidorByUserId(userId: string): Observable<IRepartidor> {
    return this.http.get<IRepartidor>(`${REPARTIDOR_API}by-user/${userId}`);
  }
}
