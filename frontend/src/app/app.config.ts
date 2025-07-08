// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router'; // Importa provideRouter
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http'; // Importa provideHttpClient
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt-interceptor'; // Asegúrate de que esta ruta sea correcta
import { MatDialogModule } from '@angular/material/dialog';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes), // Provee el enrutador a toda la aplicación
    provideClientHydration(withEventReplay()),
    provideHttpClient( // Provee HttpClient a toda la aplicación
      withInterceptors([
        jwtInterceptor // Tu interceptor JWT
      ]),
      withFetch(),
    ),
    provideAnimations(), // Requerido para ngx-toastr
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true,
      closeButton: true,
    }),
    MatDialogModule
  ]
};