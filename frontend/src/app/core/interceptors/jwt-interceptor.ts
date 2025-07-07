import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth'; // Asegúrate de que la ruta sea correcta

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService); // Asegúrate de que AuthService esté registrado en tu aplicación
  const currentUser = authService.currentUserValue;
  // Si el usuario está logueado y tiene un token, clona la solicitud y añade el encabezado de autorización
  if (currentUser && currentUser.token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${currentUser.token}` // Añade el token JWT al encabezado
      }
    });
  }

  return next(req); // Continúa con la solicitud modificada (o la original si no hay token)
};
