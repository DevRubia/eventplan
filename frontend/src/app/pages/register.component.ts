import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { OptionsService } from '../core/options.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container" style="max-width:480px">
      <div class="card mt-4">
        <h1 class="page-title">Create your account</h1>
        <p class="page-sub">Join as a client (plan events) or a vendor (offer services).</p>

        @if (error()) { <div class="alert err">{{ error() }}</div> }

        <form (ngSubmit)="submit()">
          <div class="field">
            <label>I am a…</label>
            <select [(ngModel)]="form.role" name="role">
              <option value="client">Client — I want to plan an event</option>
              <option value="vendor">Vendor — I offer event services</option>
            </select>
          </div>
          <div class="field">
            <label>Full name</label>
            <input [(ngModel)]="form.name" name="name" required />
          </div>
          <div class="row">
            <div class="field">
              <label>Email</label>
              <input type="email" [(ngModel)]="form.email" name="email" required />
            </div>
            <div class="field">
              <label>Phone</label>
              <input [(ngModel)]="form.phone" name="phone" />
            </div>
          </div>

          @if (form.role === 'vendor') {
            <div class="row">
              <div class="field">
                <label>Business name</label>
                <input [(ngModel)]="form.business_name" name="business_name" />
              </div>
              <div class="field">
                <label>Category</label>
                <select [(ngModel)]="form.category" name="category">
                  @for (o of opts.group('service_category'); track o.value) {
                    <option [value]="o.value">{{ o.label }}</option>
                  }
                </select>
              </div>
            </div>
          }

          <div class="row">
            <div class="field">
              <label>Password</label>
              <input type="password" [(ngModel)]="form.password" name="password" required />
            </div>
            <div class="field">
              <label>Confirm password</label>
              <input type="password" [(ngModel)]="form.password_confirmation" name="password_confirmation" required />
            </div>
          </div>

          <button class="btn btn-block" [disabled]="loading()">
            {{ loading() ? 'Creating…' : 'Create account' }}
          </button>
        </form>

        <p class="muted mt-3 center">Already registered? <a routerLink="/login">Log in</a></p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  opts = inject(OptionsService);

  form: any = { role: 'client', name: '', email: '', phone: '', password: '', password_confirmation: '', category: 'Catering' };
  loading = signal(false);
  error = signal('');

  submit(): void {
    this.loading.set(true);
    this.error.set('');
    this.auth.register(this.form).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (e) => {
        const errs = e?.error?.errors;
        this.error.set(errs ? Object.values(errs).flat().join(' ') : (e?.error?.message ?? 'Registration failed.'));
        this.loading.set(false);
      },
    });
  }
}
