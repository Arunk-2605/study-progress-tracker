import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Auth } from '../../services/auth';
import { UserRole } from '../models/api.models';

/**
 * Role-based route guard.
 *
 * Checks that the currently authenticated user holds one of the allowed
 * roles declared in the route's `data.roles` array.
 *
 * IMPORTANT: This is a UX-layer check only. The backend enforces role
 * restrictions independently on every protected endpoint. Never rely on
 * this guard as the sole security mechanism.
 *
 * Usage in routes:
 *   canActivate: [authGuard, roleGuard],
 *   data: { roles: ['LEARNER'] }          // allow learners only
 *   data: { roles: ['MENTOR'] }           // allow mentors only
 *   data: { roles: ['LEARNER', 'MENTOR'] } // allow both
 *
 * When no `data.roles` is declared the guard allows all authenticated users.
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(Auth);
  const router = inject(Router);

  const allowedRoles: UserRole[] | undefined = route.data?.['roles'];

  // No role restriction declared — allow any authenticated user.
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  const userRole = auth.getUserRole();

  if (userRole && allowedRoles.includes(userRole)) {
    return true;
  }

  // Wrong role — redirect to the appropriate dashboard instead of login.
  if (userRole === 'MENTOR') {
    router.navigate(['/mentor']);
  } else {
    router.navigate(['/dashboard']);
  }

  return false;
};

