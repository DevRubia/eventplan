import { HttpInterceptorFn } from '@angular/common/http';

// Attaches the Sanctum bearer token to every API request.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('ep_token');
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
  } else {
    req = req.clone({ setHeaders: { Accept: 'application/json' } });
  }
  return next(req);
};
