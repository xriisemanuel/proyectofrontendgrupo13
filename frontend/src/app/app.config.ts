// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core'; // provideBrowserGlobalErrorListeners() ya no es parte de ApplicationConfig, se puede quitar o mover si se necesita.
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations'; // ¡NUEVA IMPORTACIÓN!
import { provideToastr } from 'ngx-toastr'; // ¡NUEVA IMPORTACIÓN!

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt-interceptor';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// FormsModule y ReactiveFormsModule no se proveen en app.config.ts, se importan en los componentes standalone o en los módulos.
// Si tu proyecto es completamente standalone, los importarás directamente en cada componente que los use.

export const appConfig: ApplicationConfig = {
  providers: [
    // provideBrowserGlobalErrorListeners(), // Comentado/removido, no es un proveedor de ApplicationConfig
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withInterceptors([
        jwtInterceptor
      ]),
      withFetch(),
    ),
    // ¡NUEVOS PROVEEDORES PARA NGX-TOASTR!
    provideAnimations(), // Requerido por ngx-toastr para las animaciones
    provideToastr({       // Configuración global de ngx-toastr
      timeOut: 3000,       // Duración del toast en ms
      positionClass: 'toast-top-right', // Posición en pantalla (ej. 'toast-bottom-right', 'toast-top-center')
      preventDuplicates: true,           // Evita que aparezcan toasts idénticos repetidamente
      progressBar: true,                 // Muestra una barra de progreso
      closeButton: true,                 // Muestra un botón para cerrar manualmente el toast
    }),
    FormsModule, // Se importa en los componentes standalone o en módulos
    ReactiveFormsModule, // Se importa en los componentes standalone o en módulos
  ]
};