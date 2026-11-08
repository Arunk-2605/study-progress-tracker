import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Auth } from './auth';

describe('Auth Service', () => {
  let service: Auth;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Auth);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created successfully', () => {
    expect(service).toBeTruthy();
  });

  it('should return false for isLoggedIn when no token is in storage', () => {
    expect(service.isLoggedIn()).toBe(false);
    expect(service.getToken()).toBeNull();
  });

  it('should return true for isLoggedIn when access token is present', () => {
    localStorage.setItem('access_token', 'mock_token_xyz');
    expect(service.isLoggedIn()).toBe(true);
    expect(service.getToken()).toBe('mock_token_xyz');
  });

  it('should remove token and user info upon logout', () => {
    localStorage.setItem('access_token', 'mock_token_xyz');
    localStorage.setItem('current_user', JSON.stringify({ id: 1, name: 'Test' }));

    service.logout();

    expect(service.getToken()).toBeNull();
    expect(localStorage.getItem('current_user')).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('should correctly decode user role from JWT token payload', () => {
    // Standard mock JWT with payload { sub: 2, email: 'learner@example.com', role: 'LEARNER' }
    const mockPayload = btoa(
      JSON.stringify({ sub: 2, email: 'learner@example.com', role: 'LEARNER' }),
    );
    const mockJwt = `header.${mockPayload}.signature`;

    localStorage.setItem('access_token', mockJwt);
    expect(service.getUserRole()).toBe('LEARNER');
  });
});
