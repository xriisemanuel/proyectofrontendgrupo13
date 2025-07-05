import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OpenfoodService {
  private apiUrl = 'https://www.themealdb.com/api/json/v1/1/search.php?s=';

  constructor(private http: HttpClient) {}

  buscarReceta(nombre: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}${encodeURIComponent(nombre)}`);
  }
}

