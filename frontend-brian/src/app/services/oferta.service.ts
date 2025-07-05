import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  buscarOfertas(termino: string): Observable<Oferta[]> {
    const url = `${this.apiUrl}?buscar=${encodeURIComponent(termino)}`;
    console.log('Llamando a la API:', url);
    return this.http.get<Oferta[]>(url);
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
} 