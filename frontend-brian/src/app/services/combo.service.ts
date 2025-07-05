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

  getComboById(id: string): Observable<Combo> {
    return this.http.get<Combo>(`${this.apiUrl}/${id}`);
  }

  updateCombo(id: string, combo: Combo): Observable<Combo> {
    return this.http.put<Combo>(`${this.apiUrl}/${id}`, combo);
  }

  deleteCombo(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  activarCombo(id: string): Observable<Combo> {
    return this.http.patch<Combo>(`${this.apiUrl}/${id}/activar`, {});
  }

  desactivarCombo(id: string): Observable<Combo> {
    return this.http.patch<Combo>(`${this.apiUrl}/${id}/desactivar`, {});
  }
}
