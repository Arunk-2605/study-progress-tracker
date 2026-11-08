import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, shareReplay } from 'rxjs';
import { AppConfig, UpdateConfigRequest } from '../core/models/api.models';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private readonly apiUrl = 'http://localhost:3000/config';
  private cachedConfig: AppConfig | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Fetch current system application configuration (MENTOR only on backend).
   */
  getConfig(): Observable<AppConfig> {
    return this.http.get<AppConfig>(this.apiUrl).pipe(
      tap((config) => {
        this.cachedConfig = config;
      }),
    );
  }

  /**
   * Update system configuration (MENTOR only).
   */
  updateConfig(dto: UpdateConfigRequest): Observable<AppConfig> {
    return this.http.patch<AppConfig>(this.apiUrl, dto).pipe(
      tap((config) => {
        this.cachedConfig = config;
      }),
    );
  }

  /**
   * Synchronously return cached configuration or safe fallback defaults.
   */
  getCachedConfig(): AppConfig {
    return (
      this.cachedConfig ?? {
        id: 1,
        minSessionMinutes: 5,
        maxSessionMinutes: 480,
        maxPrerequisites: 5,
      }
    );
  }
}

