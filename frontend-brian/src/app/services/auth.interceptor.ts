import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Verificar si estamos en el navegador antes de acceder a localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    const token = localStorage.getItem('token');
    
    // Siempre enviar el token si está disponible
    // El backend decidirá si lo necesita o no
    if (token) {
      const authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
      return next(authReq);
    }
  }
  return next(req);
};
