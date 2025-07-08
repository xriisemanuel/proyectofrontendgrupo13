import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, timer } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';

export interface Oferta {
  _id?: string;
  nombre: string;
  descripcion?: string;
  descuento: number;
  fechaInicio: Date;
  fechaFin: Date;
  productosAplicables: any[];
  categoriasAplicables: any[];
  imagen?: string;
  estado?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OfertaService {
  private apiUrl = 'http://localhost:3000/api/ofertas';

  constructor(private http: HttpClient) { }

  getOfertas(): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(this.apiUrl);
  }

  getOfertaById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  buscarOfertas(termino: string): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${this.apiUrl}?buscar=${encodeURIComponent(termino)}`);
  }

  crearOferta(oferta: Oferta): Observable<any> {
    return this.http.post<any>(this.apiUrl, oferta);
  }

  editarOferta(id: string, oferta: Oferta): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, oferta);
  }

  eliminarOferta(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  activarOferta(id: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/activar`, {});
  }

  desactivarOferta(id: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/desactivar`, {});
  }

  // Nuevo método para verificar ofertas expiradas
  verificarOfertasExpiradas(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/verificar-expiradas`, {});
  }

  // Método para obtener ofertas con verificación automática de expiración
  getOfertasConVerificacion(): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${this.apiUrl}/con-verificacion`);
  }

  // Método para verificar si una oferta específica ha expirado
  verificarOfertaExpirada(oferta: Oferta): boolean {
    if (!oferta.fechaFin || !oferta.estado) {
      return false;
    }
    
    const fechaFin = new Date(oferta.fechaFin);
    const fechaActual = new Date();
    
    return fechaActual > fechaFin;
  }

  // Método para obtener ofertas que necesitan ser desactivadas
  getOfertasParaDesactivar(ofertas: Oferta[]): Oferta[] {
    return ofertas.filter(oferta => 
      oferta.estado && this.verificarOfertaExpirada(oferta)
    );
  }
} 