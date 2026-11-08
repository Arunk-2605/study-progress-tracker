import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../../services/auth';

/**
 * Authentication guard.
 *
 * Protects routes that require the user to be logged in.
 * Redirects unauthenticated users to the /login page.
 *
 * Usage in routes:
 *   canActivate: [authGuard]
 */
export const authGuard: CanActivateFn = (_route, _state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  // Not logged in — send to login page.
  router.navigate(['/login']);
  return false;
};
