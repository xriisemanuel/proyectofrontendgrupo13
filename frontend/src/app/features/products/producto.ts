// src/app/features/products/services/product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto } from '../products/models/producto.model'; // Importa la interfaz Producto
import { API_BASE_URL } from '../../core/constants/constants'; // Asegúrate de que esta ruta sea correcta

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private apiUrl = `${API_BASE_URL}/productos`; // Endpoint para tus productos

  constructor(private http: HttpClient) { }

  // Obtener todos los productos
  getProducts(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  // Obtener un producto por ID
  getProductById(id: string): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  // Crear un nuevo producto
  createProduct(product: Producto): Observable<Producto> {
    // Asegúrate de enviar solo el ID de la categoría si categoriaId es un objeto
    const dataToSend = {
      ...product,
      categoriaId: (product.categoriaId as any)._id || product.categoriaId // Envía el ID si es objeto populado
    };
    return this.http.post<Producto>(this.apiUrl, dataToSend);
  }

  // Actualizar un producto existente
  updateProduct(id: string, product: Producto): Observable<Producto> {
    // Asegúrate de enviar solo el ID de la categoría si categoriaId es un objeto
    const dataToSend = {
      ...product,
      categoriaId: (product.categoriaId as any)._id || product.categoriaId // Envía el ID si es objeto populado
    };
    return this.http.put<Producto>(`${this.apiUrl}/${id}`, dataToSend);
  }

  // Eliminar un producto
  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}