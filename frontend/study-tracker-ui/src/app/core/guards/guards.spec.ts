import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, ActivatedRouteSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { roleGuard } from './role.guard';
import { Auth } from '../../services/auth';

describe('Guards', () => {
  let authService: Auth;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    authService = TestBed.inject(Auth);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('authGuard', () => {
    it('should deny access and redirect to /login when user is not logged in', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as any, {} as any),
      );

      expect(result).toBe(false);
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });

    it('should allow access when user has valid token in storage', () => {
      localStorage.setItem('access_token', 'valid_token');
      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as any, {} as any),
      );

      expect(result).toBe(true);
    });
  });

  describe('roleGuard', () => {
    it('should allow access when no roles are specified in route data', () => {
      const route = { data: {} } as ActivatedRouteSnapshot;
      const result = TestBed.runInInjectionContext(() => roleGuard(route, {} as any));
      expect(result).toBe(true);
    });

    it('should allow access when user role matches permitted roles', () => {
      const payload = btoa(JSON.stringify({ sub: 1, role: 'LEARNER' }));
      localStorage.setItem('access_token', `header.${payload}.signature`);

      const route = {
        data: { roles: ['LEARNER'] },
      } as unknown as ActivatedRouteSnapshot;

      const result = TestBed.runInInjectionContext(() => roleGuard(route, {} as any));
      expect(result).toBe(true);
    });

    it('should redirect mentor to /mentor when attempting to access learner route', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      const payload = btoa(JSON.stringify({ sub: 1, role: 'MENTOR' }));
      localStorage.setItem('access_token', `header.${payload}.signature`);

      const route = {
        data: { roles: ['LEARNER'] },
      } as unknown as ActivatedRouteSnapshot;

      const result = TestBed.runInInjectionContext(() => roleGuard(route, {} as any));
      expect(result).toBe(false);
      expect(navigateSpy).toHaveBeenCalledWith(['/mentor']);
    });
  });
});
