// src/app/data/services/producto.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/constants/constants';
import { AuthService } from '../../core/auth/auth';

import { IProducto } from '../../shared/interfaces';

const PRODUCTO_API = API_BASE_URL + '/productos'; // Asegúrate de que este endpoint coincida con tu backend

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  createProduct(productData: Partial<IProducto>): Observable<any> {
    return this.http.post<any>(PRODUCTO_API, productData, { headers: this.getAuthHeaders() });
  }

  getProducts(estado?: boolean): Observable<IProducto[]> {
    let params = new HttpParams();
    if (estado !== undefined && estado !== null) {
      params = params.append('estado', estado.toString());
    }
    return this.http.get<IProducto[]>(PRODUCTO_API, { headers: this.getAuthHeaders(), params });
  }

  getProductById(id: string): Observable<IProducto> {
    return this.http.get<IProducto>(`${PRODUCTO_API}/${id}`, { headers: this.getAuthHeaders() });
  }

  updateProduct(id: string, productData: Partial<IProducto>): Observable<any> {
    return this.http.put<any>(`${PRODUCTO_API}/${id}`, productData, { headers: this.getAuthHeaders() });
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete<any>(`${PRODUCTO_API}/${id}`, { headers: this.getAuthHeaders() });
  }

  activarProduct(id: string): Observable<any> {
    return this.http.patch<any>(`${PRODUCTO_API}/${id}/activar`, {}, { headers: this.getAuthHeaders() });
  }

  desactivarProduct(id: string): Observable<any> {
    return this.http.patch<any>(`${PRODUCTO_API}/${id}/desactivar`, {}, { headers: this.getAuthHeaders() });
  }
}