import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiURL = 'http://localhost:3000/api/productos';

  constructor(private http: HttpClient) {}

  getProductos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiURL);
  }

  crearProducto(data: any): Observable<any> {
    return this.http.post<any>(this.apiURL, data);
  }

  // Otros métodos como editar, eliminar, obtener por ID, etc., los agregamos después
}

