import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/api.service';
import { ConfirmService } from '../core/confirm.service';
import { IconComponent } from '../shared/icon.component';
import { User } from '../core/models';

@Component({
  selector: 'app-admin-users',
  imports: [CommonModule, IconComponent],
  template: `
    <div class="container">
      <h1 class="page-title">Users &amp; Vendors</h1>
      <p class="page-sub">Verify vendors, and activate or deactivate accounts.</p>

      @if (reports(); as r) {
        <div class="grid grid-4">
          <div class="stat"><div class="label">Clients</div><div class="value">{{ r.users.clients }}</div></div>
          <div class="stat"><div class="label">Vendors</div><div class="value">{{ r.users.vendors }}</div></div>
          <div class="stat"><div class="label">Pending verification</div><div class="value">{{ r.vendors_pending_verification }}</div></div>
          <div class="stat"><div class="label">Confirmed revenue</div><div class="value" style="font-size:1.1rem">KES {{ r.payments.confirmed_total | number }}</div></div>
        </div>
      }

      <div class="flex wrap mt-4" style="gap:8px">
        <button class="btn btn-sm" [class.btn-outline]="filter() !== ''" (click)="setFilter('')">All</button>
        <button class="btn btn-sm" [class.btn-outline]="filter() !== 'client'" (click)="setFilter('client')">Clients</button>
        <button class="btn btn-sm" [class.btn-outline]="filter() !== 'vendor'" (click)="setFilter('vendor')">Vendors</button>
      </div>

      <div class="card mt-3" style="padding:0">
       <div class="table-wrap">
        <table>
          <tr><th>Name</th><th>Email</th><th>Role</th><th>Business</th><th>Status</th><th>Actions</th></tr>
          @for (u of users(); track u.id) {
            <tr>
              <td>{{ u.name }}</td>
              <td class="muted">{{ u.email }}</td>
              <td><span class="badge purple">{{ u.role }}</span></td>
              <td>
                @if (u.vendor_profile) {
                  {{ u.vendor_profile.business_name }}
                  <span class="badge" [class]="u.vendor_profile.is_verified ? 'green' : 'amber'">
                    {{ u.vendor_profile.is_verified ? 'verified' : 'pending' }}
                  </span>
                } @else { <span class="muted">—</span> }
              </td>
              <td><span class="badge" [class]="u.is_active ? 'green' : 'red'">{{ u.is_active ? 'active' : 'disabled' }}</span></td>
              <td class="flex wrap" style="gap:6px">
                @if (u.vendor_profile) {
                  <button class="btn btn-sm" (click)="verify(u)">
                    <app-icon [name]="u.vendor_profile.is_verified ? 'x' : 'checkCircle'" [size]="14"></app-icon>
                    {{ u.vendor_profile.is_verified ? 'Unverify' : 'Verify' }}
                  </button>
                }
                @if (u.role !== 'admin') {
                  <button class="btn btn-sm btn-outline" (click)="toggle(u)">
                    {{ u.is_active ? 'Deactivate' : 'Activate' }}
                  </button>
                }
              </td>
            </tr>
          }
        </table>
       </div>
      </div>
    </div>
  `,
})
export class AdminUsersComponent {
  private api = inject(ApiService);
  private confirm = inject(ConfirmService);
  users = signal<User[]>([]);
  reports = signal<any>(null);
  filter = signal('');

  ngOnInit() { this.loadReports(); this.load(); }

  loadReports() { this.api.adminReports().subscribe((r) => this.reports.set(r)); }
  load() {
    const params = this.filter() ? { role: this.filter() } : undefined;
    this.api.adminUsers(params).subscribe((u) => this.users.set(u));
  }
  setFilter(f: string) { this.filter.set(f); this.load(); }

  async verify(u: User) {
    if (!u.vendor_profile) return;
    const verified = u.vendor_profile.is_verified;
    const ok = await this.confirm.ask({
      title: verified ? 'Remove verification?' : 'Verify this vendor?',
      message: verified
        ? `"${u.vendor_profile.business_name}" will be hidden from public listings until verified again.`
        : `"${u.vendor_profile.business_name}" will become visible to clients and bookable. Only verify vendors you trust.`,
      confirmText: verified ? 'Unverify' : 'Verify vendor',
      tone: verified ? 'danger' : 'success', icon: verified ? 'x' : 'checkCircle',
    });
    if (ok) this.api.verifyVendor(u.vendor_profile.id).subscribe(() => { this.load(); this.loadReports(); });
  }

  async toggle(u: User) {
    const active = u.is_active;
    const ok = await this.confirm.ask({
      title: active ? 'Deactivate this account?' : 'Activate this account?',
      message: active
        ? `${u.name} will no longer be able to log in until reactivated.`
        : `${u.name} will be able to log in and use the system again.`,
      confirmText: active ? 'Deactivate' : 'Activate',
      tone: active ? 'danger' : 'success', icon: active ? 'alert' : 'check',
    });
    if (ok) this.api.toggleUser(u.id).subscribe(() => this.load());
  }
}
