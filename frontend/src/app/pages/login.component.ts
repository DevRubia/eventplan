import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container" style="max-width:420px">
      <div class="card mt-4">
        <h1 class="page-title">Welcome back</h1>
        <p class="page-sub">Log in to plan events or manage bookings.</p>

        @if (error()) { <div class="alert err">{{ error() }}</div> }

        <form (ngSubmit)="submit()">
          <div class="field">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email" required />
          </div>
          <div class="field">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password" required />
          </div>
          <button class="btn btn-block" [disabled]="loading()">
            {{ loading() ? 'Signing in…' : 'Log in' }}
          </button>
        </form>

        <p class="muted mt-3 center">No account? <a routerLink="/register">Sign up</a></p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  submit(): void {
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (e) => {
        this.error.set(e?.error?.message ?? 'Login failed.');
        this.loading.set(false);
      },
    });
  }
}
