import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
private apiURL = 'http://localhost:3000/api/categorias'; // 👈 Endpoint de categorías

  constructor(private http: HttpClient) {}

  getCategorias(): Observable<any[]> {
    return this.http.get<any[]>(this.apiURL);
  }

  crearCategoria(data: any): Observable<any> {
    return this.http.post<any>(this.apiURL, data);
  }

  // Se pueden agregar editarCategoria(), eliminarCategoria(), etc.
}