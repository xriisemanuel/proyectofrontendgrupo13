import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class Unplash {
  private accessKey = 'EnNos1gl402EosaHnpEfuNqplCvX5q9XFxhT6-1ul1A';
  private apiUrl = 'https://api.unsplash.com/search/photos';

  constructor(private http: HttpClient) { }

   buscarImagen(query: string) {
    return this.http.get<any>(`${this.apiUrl}?query=${query}&per_page=1&client_id=${this.accessKey}`);
  }
}