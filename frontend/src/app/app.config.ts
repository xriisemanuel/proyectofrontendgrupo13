import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // <--- ¡IMPORTA ESTO!

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { jwtInterceptor } from './interceptors/jwt-interceptor'; 

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    // --- AÑADE ESTAS LÍNEAS PARA HABILITAR HTTPCLIENT Y REGISTRAR EL INTERCEPTOR ---
    provideHttpClient(withInterceptors([jwtInterceptor])), // <--- Habilita HttpClient y registra el interceptor funcional
    // --- FIN DE LAS LÍNEAS A AÑADIR ---
  ]
};
