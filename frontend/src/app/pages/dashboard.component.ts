import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { IconComponent } from '../shared/icon.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, IconComponent],
  template: `
    <div class="container">
      <h1 class="page-title">Hi {{ auth.user()?.name }}</h1>
      <p class="page-sub">Here's your {{ d()?.role }} overview.</p>

      @if (d(); as data) {
        <!-- CLIENT -->
        @if (data.role === 'client') {
          <div class="grid grid-4">
            <div class="stat"><div class="label">My events</div><div class="value">{{ data.events }}</div></div>
            <div class="stat"><div class="label">Bookings</div><div class="value">{{ data.bookings }}</div></div>
            <div class="stat"><div class="label">Pending requests</div><div class="value">{{ data.pending_bookings }}</div></div>
            <div class="stat"><div class="label">Paid (confirmed)</div><div class="value" style="font-size:1.2rem">KES {{ data.confirmed_paid | number }}</div></div>
          </div>
          <div class="flex wrap mt-4">
            <a routerLink="/events" class="btn">Manage my events</a>
            <a routerLink="/home" class="btn btn-outline">Browse services</a>
            <a routerLink="/my-bookings" class="btn btn-outline">My bookings</a>
          </div>
        }

        <!-- VENDOR -->
        @if (data.role === 'vendor') {
          <div class="grid grid-4">
            <div class="stat"><div class="label">My services</div><div class="value">{{ data.services }}</div></div>
            <div class="stat"><div class="label">Bookings</div><div class="value">{{ data.bookings }}</div></div>
            <div class="stat"><div class="label">New requests</div><div class="value">{{ data.new_requests }}</div></div>
            <div class="stat"><div class="label">Earnings (confirmed)</div><div class="value" style="font-size:1.2rem">KES {{ data.earnings_confirmed | number }}</div></div>
          </div>
          @if (data.payments_to_confirm > 0) {
            <div class="alert ok mt-3 flex"><app-icon name="wallet" [size]="17"></app-icon> You have {{ data.payments_to_confirm }} payment(s) awaiting your confirmation.</div>
          }
          <div class="flex wrap mt-4">
            <a routerLink="/vendor/services" class="btn">Manage services</a>
            <a routerLink="/my-bookings" class="btn btn-outline">View bookings & payments</a>
            <a routerLink="/vendor/profile" class="btn btn-outline">Edit profile</a>
          </div>
        }

        <!-- ADMIN -->
        @if (data.role === 'admin') {
          <div class="grid grid-4">
            <div class="stat"><div class="label">Events</div><div class="value">{{ data.events }}</div></div>
            <div class="stat"><div class="label">Bookings</div><div class="value">{{ data.bookings }}</div></div>
            <div class="stat"><div class="label">Confirmed revenue</div><div class="value" style="font-size:1.2rem">KES {{ data.confirmed_revenue | number }}</div></div>
            <div class="stat"><div class="label">Pending payments</div><div class="value">{{ data.pending_payments }}</div></div>
          </div>
          <div class="flex wrap mt-4">
            <a routerLink="/admin/users" class="btn">Manage users & vendors</a>
            <a routerLink="/admin/payment-settings" class="btn btn-outline">Payment settings</a>
          </div>
        }
      } @else {
        <p class="muted">Loading…</p>
      }
    </div>
  `,
})
export class DashboardComponent {
  private api = inject(ApiService);
  auth = inject(AuthService);
  d = signal<any>(null);

  ngOnInit() {
    this.api.dashboard().subscribe((data) => this.d.set(data));
  }
}
