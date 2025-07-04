import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Combo {
  _id?: string;
  nombre: string;
  descripcion: string;
  productosIds: string[];
  precioCombo: number;
  descuento?: number;
  imagen?: string;
  estado?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ComboService {
  private apiUrl = 'http://localhost:3000/api/combos';

  constructor(private http: HttpClient) { }

  getCombos(): Observable<Combo[]> {
    return this.http.get<Combo[]>(this.apiUrl);
  }

  addCombo(combo: Combo): Observable<Combo> {
    return this.http.post<Combo>(this.apiUrl, combo);
  }
}
