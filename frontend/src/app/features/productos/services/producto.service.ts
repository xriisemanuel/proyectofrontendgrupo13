import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiURL = 'http://localhost:3000/api/productos';

  constructor(private http: HttpClient, 
  ) {}

  infoNutricional: any = null;

  getProductos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiURL);
  }

  crearProducto(data: any): Observable<any> {
    return this.http.post<any>(this.apiURL, data);
  }

  // Obtener un producto por ID
getProductoPorId(id: string): Observable<any> {
  return this.http.get<any>(`${this.apiURL}/${id}`);
}

// Actualizar producto
actualizarProducto(id: string, data: any): Observable<any> {
  return this.http.put<any>(`${this.apiURL}/${id}`, data);
}

// Eliminar producto
eliminarProducto(id: string): Observable<any> {
  return this.http.delete<any>(`${this.apiURL}/${id}`);
}

}

