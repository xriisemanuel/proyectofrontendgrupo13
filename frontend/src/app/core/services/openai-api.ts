// src/app/core/services/openai-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants/constants'; // Asegúrate de que esta ruta sea correcta

@Injectable({
  providedIn: 'root' // Esto hace que el servicio sea un singleton y esté disponible en toda la aplicación
})
export class OpenaiApiService {

  private apiUrl = `${API_BASE_URL}/generate-image`; // Endpoint de tu backend para generar imágenes

  constructor(private http: HttpClient) { }

  /**
   * Llama a tu backend para generar una imagen utilizando un prompt.
   * @param prompt La descripción de texto para la imagen.
   * @returns Un Observable que emite la URL de la imagen generada.
   */
  generateImage(prompt: string): Observable<{ imageUrl: string }> {
    return this.http.post<{ imageUrl: string }>(this.apiUrl, { prompt });
  }

  // Podrías añadir otros métodos aquí si usas otras funciones de OpenAI a través de tu backend
  // Por ejemplo:
  // generateText(textPrompt: string): Observable<any> {
  //   return this.http.post<any>(`${API_BASE_URL}/generate-text`, { textPrompt });
  // }
}