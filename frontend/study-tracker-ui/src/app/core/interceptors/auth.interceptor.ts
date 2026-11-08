import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Auth } from '../../services/auth';

/**
 * Functional HTTP interceptor that:
 * 1. Attaches Authorization: Bearer <token> to every outgoing protected request
 *    when a token is present in localStorage.
 * 2. Avoids attaching tokens to public login or registration requests unnecessarily.
 * 3. Handles 401 Unauthorized responses by clearing the stored token
 *    and redirecting the user back to the /login page.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(Auth);
  const router = inject(Router);
  const token = authService.getToken();

  const isPublicAuth =
    req.url.includes('/auth/login') || req.url.includes('/auth/register');

  const authReq =
    token && !isPublicAuth
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
