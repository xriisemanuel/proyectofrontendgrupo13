// src/app/core/services/unplash.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UnplashService {
  // ¡ATENCIÓN! Exponer la clave de acceso de Unsplash directamente en el frontend (incluso en un servicio)
  // no es la mejor práctica para producción debido a la seguridad y límites de tasa.
  // Considera proxyar estas llamadas a través de tu backend.
  private accessKey = 'EnNos1gl402EosaHnpEfuNqplCvX5q9XFxhT6-1ul1A'; // <-- Tu Access Key de Unsplash
  private apiUrl = 'https://api.unsplash.com/search/photos';

  constructor(private http: HttpClient) { }

  // Modificado para aceptar `perPage` y `orientation`
  buscarImagen(query: string, perPage: number = 9, orientation: string = 'landscape') {
    return this.http.get<any>(`${this.apiUrl}?query=${query}&per_page=${perPage}&orientation=${orientation}&client_id=${this.accessKey}`);
  }

}