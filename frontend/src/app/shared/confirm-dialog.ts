// src/app/shared/confirm-dialog/confirm-dialog.service.ts

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root' // Hace que el servicio esté disponible en toda la aplicación
})
export class ConfirmDialogService {

  constructor() { }

  /**
   * Muestra un diálogo de confirmación al usuario.
   *
   * @param message El mensaje que se mostrará en el diálogo de confirmación.
   * @returns Una Promesa que se resuelve a `true` si el usuario hace clic en "Aceptar" (OK),
   * o a `false` si el usuario hace clic en "Cancelar".
   *
   * NOTA: Esta es una implementación básica usando `window.confirm()`.
   * Para una experiencia de usuario más rica y personalizable (con CSS, etc.),
   * se recomendaría usar un componente de diálogo de Angular (por ejemplo, de Angular Material
   * o una implementación custom con OverlayModule).
   */
  confirm(message: string): Promise<boolean> {
    // window.confirm() devuelve true si el usuario hace clic en OK, y false si hace clic en Cancelar.
    return Promise.resolve(window.confirm(message));
  }
}