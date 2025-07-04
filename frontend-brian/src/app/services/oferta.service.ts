import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Oferta {
  _id?: string;
  nombre: string;
  descripcion?: string;
  descuento: number;
  fechaInicio: string;
  fechaFin: string;
  productosAplicables?: string[];
  categoriasAplicables?: string[];
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

  addOferta(oferta: Oferta): Observable<Oferta> {
    return this.http.post<Oferta>(this.apiUrl, oferta);
  }
}
