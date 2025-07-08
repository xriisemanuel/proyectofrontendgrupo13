/**
 * Configuración Principal de la Aplicación
 * 
 * Configura los providers y servicios globales de la aplicación:
 * - Configuración de HTTP con interceptores
 * - Configuración de formularios reactivos
 * - Configuración de rutas
 * - Configuración de animaciones
 */
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { authInterceptor } from './services/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Configuración del router con las rutas definidas
    provideRouter(routes),
    
    // Configuración del cliente HTTP con interceptor de autenticación
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    
    // Configuración de animaciones del navegador
    provideAnimations()
  ]
};
