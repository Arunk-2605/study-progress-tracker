import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppConfig, User } from '../../core/models/api.models';
import { ConfigService } from '../../services/config.service';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-mentor-config',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './mentor-config.html',
  styleUrl: './mentor-config.css',
})
export class MentorConfig implements OnInit {
  currentUser: User | null = null;
  config: AppConfig = {
    id: 1,
    minSessionMinutes: 5,
    maxSessionMinutes: 480,
    maxPrerequisites: 5,
  };

  minSession = 5;
  maxSession = 480;
  maxPrereqs = 5;

  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private configService: ConfigService,
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.currentUser = this.auth.getCurrentUser();
    this.loadConfig();
  }

  loadConfig() {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.configService.getConfig().subscribe({
      next: (cfg) => {
        this.config = cfg;
        this.minSession = cfg.minSessionMinutes;
        this.maxSession = cfg.maxSessionMinutes;
        this.maxPrereqs = cfg.maxPrerequisites;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err.error?.message ||
          'Failed to load application configuration from server.';
        this.cdr.markForCheck();
      },
    });
  }

  saveConfig() {
    this.errorMessage = '';
    this.successMessage = '';

    const min = Number(this.minSession);
    const max = Number(this.maxSession);
    const prereqs = Number(this.maxPrereqs);

    // Validation
    if (isNaN(min) || min < 1 || min > 1440) {
      this.errorMessage = 'Minimum session minutes must be between 1 and 1440.';
      return;
    }

    if (isNaN(max) || max < 1 || max > 1440) {
      this.errorMessage = 'Maximum session minutes must be between 1 and 1440.';
      return;
    }

    if (min > max) {
      this.errorMessage =
        'Minimum session minutes cannot exceed maximum session minutes.';
      return;
    }

    if (isNaN(prereqs) || prereqs < 0 || prereqs > 20) {
      this.errorMessage = 'Maximum prerequisites must be between 0 and 20.';
      return;
    }

    this.isSaving = true;
    this.cdr.markForCheck();

    this.configService
      .updateConfig({
        minSessionMinutes: min,
        maxSessionMinutes: max,
        maxPrerequisites: prereqs,
      })
      .subscribe({
        next: (updated) => {
          this.config = updated;
          this.minSession = updated.minSessionMinutes;
          this.maxSession = updated.maxSessionMinutes;
          this.maxPrereqs = updated.maxPrerequisites;
          this.isSaving = false;
          this.successMessage =
            'Configuration updated successfully! New limits are now active across all learner sessions.';
          this.cdr.markForCheck();

          setTimeout(() => {
            this.successMessage = '';
            this.cdr.markForCheck();
          }, 4000);
        },
        error: (err) => {
          this.isSaving = false;
          this.errorMessage =
            err.error?.message ||
            'Failed to save configuration. Please check your inputs.';
          this.cdr.markForCheck();
        },
      });
  }

  resetToDefaults() {
    this.minSession = 5;
    this.maxSession = 480;
    this.maxPrereqs = 5;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

