import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  email = '';
  password = '';
  showPassword = false;

  errorMessage = '';
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

  onLogin() {
    this.errorMessage = '';
    this.isLoading = true;
    this.cdr.markForCheck();

    this.auth
      .login({
        email: this.email.trim(),
        password: this.password,
      })
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          const role = res?.user?.role || this.auth.getUserRole();
          if (role === 'MENTOR') {
            this.router.navigate(['/mentor']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage =
            error.error?.message ||
            'Login failed. Please verify your email and password.';
          this.cdr.markForCheck();
        },
      });
  }
}
