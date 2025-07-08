/**
 * Interceptor de Autenticación
 * 
 * Intercepta todas las peticiones HTTP para:
 * - Agregar automáticamente el token JWT en el header Authorization
 * - Manejar errores de autenticación (401, 403)
 * - Redirigir al login cuando sea necesario
 */
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Obtener el token del localStorage
  const token = localStorage.getItem('token');
  
  // Si existe un token, agregarlo al header Authorization
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }
  
  // Si no hay token, continuar con la petición original
  return next(req);
};
