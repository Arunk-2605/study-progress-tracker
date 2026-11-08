import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ProfileResponse,
  UserRole,
  User,
} from '../core/models/api.models';

export interface LoginResponse {
  access_token: string;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly apiUrl = 'http://localhost:3000/auth';

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((response) => {
          this.setSession(response);
        }),
      );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, data)
      .pipe(
        tap((response) => {
          this.setSession(response);
        }),
      );
  }

  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(`${this.apiUrl}/profile`).pipe(
      tap((res) => {
        if (res && res.user) {
          const current = this.getCurrentUser();
          const updated: User = {
            id: res.user.id,
            name: current?.name || 'Learner',
            email: res.user.email,
            role: res.user.role,
          };
          localStorage.setItem('current_user', JSON.stringify(updated));
        }
      }),
    );
  }

  getMentorDashboard(): Observable<{ message: string; user: any }> {
    return this.http.get<{ message: string; user: any }>(
      `${this.apiUrl}/mentor-dashboard`,
    );
  }

  private setSession(authResult: AuthResponse): void {
    localStorage.setItem('access_token', authResult.access_token);
    if (authResult.user) {
      localStorage.setItem('current_user', JSON.stringify(authResult.user));
    }
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUserRole(): UserRole | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payloadBase64 = token.split('.')[1];
      const decoded = JSON.parse(atob(payloadBase64));
      return decoded?.role ?? null;
    } catch {
      return null;
    }
  }

  getCurrentUser(): User | null {
    const raw = localStorage.getItem('current_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}
