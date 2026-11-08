import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';

  showPassword = false;
  showConfirmPassword = false;

  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      const role = this.auth.getUserRole();
      if (role === 'MENTOR') {
        this.router.navigate(['/mentor']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onRegister() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match. Please re-enter.';
      return;
    }

    if (this.password.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long.';
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    this.auth
      .register({
        name: this.name.trim(),
        email: this.email.trim(),
        password: this.password,
      })
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.successMessage =
            'Account created successfully! Redirecting to your dashboard...';
          this.cdr.markForCheck();

          setTimeout(() => {
            const role = res?.user?.role || this.auth.getUserRole();
            if (role === 'MENTOR') {
              this.router.navigate(['/mentor']);
            } else {
              this.router.navigate(['/dashboard']);
            }
          }, 1200);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage =
            error.error?.message ||
            'Registration failed. Please verify your details.';
          this.cdr.markForCheck();
        },
      });
  }
}
