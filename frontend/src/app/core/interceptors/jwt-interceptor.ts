import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth'; // Asegúrate de que la ruta sea correcta

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService); // Asegúrate de que AuthService esté registrado en tu aplicación
  const currentUser = authService.currentUserValue;

  // === INICIO DE LA MODIFICACIÓN ===
  // Excluir solicitudes a Cloudinary de añadir el encabezado de autorización
  // Puedes usar una URL base para Cloudinary o parte de ella
  const CLOUDINARY_API_URL_PART = 'api.cloudinary.com'; // O 'https://api.cloudinary.com/v1_1/tu_cloud_name/'

  if (req.url.includes(CLOUDINARY_API_URL_PART)) {
    // Si la URL de la solicitud contiene la parte de la URL de Cloudinary,
    // simplemente pasa la solicitud sin modificar (sin añadir el token).
    return next(req);
  }
  // === FIN DE LA MODIFICACIÓN ===

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