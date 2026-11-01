import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { ConfirmService } from '../core/confirm.service';
import { IconComponent } from '../shared/icon.component';
import { Booking, Payment } from '../core/models';

@Component({
  selector: 'app-bookings',
  imports: [CommonModule, IconComponent],
  template: `
    <div class="container">
      <h1 class="page-title">{{ auth.role() === 'vendor' ? 'Bookings for my services' : 'My bookings' }}</h1>
      <p class="page-sub">
        {{ auth.role() === 'vendor'
            ? 'Accept requests, update progress, and confirm payments you have received.'
            : 'Track your requested and confirmed services.' }}
      </p>

      @if (loading()) { <p class="muted">Loading…</p> }
      @else if (bookings().length === 0) { <div class="empty">No bookings yet.</div> }
      @else {
        <div class="grid mt-2">
          @for (b of bookings(); track b.id) {
            <div class="card">
              <div class="flex between wrap">
                <div>
                  <h3 style="margin:0">{{ b.service?.name }}</h3>
                  <p class="muted" style="margin:2px 0;font-size:.85rem">
                    {{ b.event?.title }} ·
                    {{ auth.role() === 'vendor' ? ('Client: ' + b.client?.name) : ('Vendor: ' + b.vendor?.name) }}
                    · qty {{ b.quantity }}
                  </p>
                </div>
                <div class="flex" style="gap:8px">
                  <span class="price">KES {{ b.agreed_price | number }}</span>
                  <span class="badge" [class]="statusClass(b.status)">{{ b.status }}</span>
                </div>
              </div>

              <!-- Vendor booking actions -->
              @if (auth.role() === 'vendor') {
                <div class="flex wrap mt-2" style="gap:8px">
                  @if (b.status === 'requested') {
                    <button class="btn btn-sm btn-ok" (click)="accept(b)"><app-icon name="check" [size]="15"></app-icon> Accept</button>
                    <button class="btn btn-sm btn-bad" (click)="decline(b)"><app-icon name="x" [size]="15"></app-icon> Decline</button>
                  }
                  @if (b.status === 'accepted') {
                    <button class="btn btn-sm" (click)="markConfirmed(b)"><app-icon name="check" [size]="15"></app-icon> Mark confirmed</button>
                  }
                  @if (b.status === 'confirmed') {
                    <button class="btn btn-sm btn-ok" (click)="complete(b)"><app-icon name="checkCircle" [size]="15"></app-icon> Mark completed</button>
                  }
                </div>
              }

              <!-- Client cancel -->
              @if (auth.role() === 'client' && (b.status === 'requested' || b.status === 'accepted')) {
                <button class="btn btn-sm btn-outline mt-2" (click)="cancel(b)"><app-icon name="x" [size]="15"></app-icon> Cancel booking</button>
              }

              <!-- Payments -->
              @if (b.payments && b.payments.length) {
                <div class="table-wrap mt-3">
                  <table>
                    <tr><th>Date</th><th>Amount</th><th>Method</th><th>Ref</th><th>Status</th>
                      @if (auth.role() === 'vendor' || auth.role() === 'admin') { <th>Action</th> }
                    </tr>
                    @for (p of b.payments; track p.id) {
                      <tr>
                        <td>{{ p.paid_at }}</td>
                        <td>KES {{ p.amount | number }}</td>
                        <td style="text-transform:uppercase">{{ p.method }}</td>
                        <td>{{ p.reference || '—' }}</td>
                        <td><span class="badge" [class]="payClass(p.status)">{{ p.status }}</span></td>
                        @if (auth.role() === 'vendor' || auth.role() === 'admin') {
                          <td>
                            @if (p.status === 'pending') {
                              <div class="flex" style="gap:6px">
                                <button class="btn btn-sm btn-ok" (click)="confirmPay(p)"><app-icon name="check" [size]="14"></app-icon> Confirm</button>
                                <button class="btn btn-sm btn-bad" (click)="rejectPay(p)"><app-icon name="x" [size]="14"></app-icon> Reject</button>
                              </div>
                            } @else { <span class="muted">—</span> }
                          </td>
                        }
                      </tr>
                    }
                  </table>
                </div>
              } @else { <p class="muted mt-2" style="font-size:.85rem">No payments recorded.</p> }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class BookingsComponent {
  private api = inject(ApiService);
  private confirm = inject(ConfirmService);
  auth = inject(AuthService);

  bookings = signal<Booking[]>([]);
  loading = signal(true);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.bookings().subscribe({
      next: (b) => {
        this.bookings.set(b);
        this.loading.set(false);
        this.api.payments().subscribe((pays) => {
          const byBooking = new Map<number, Payment[]>();
          pays.forEach((p) => {
            const arr = byBooking.get(p.booking_id) ?? [];
            arr.push(p); byBooking.set(p.booking_id, arr);
          });
          this.bookings.set(b.map((bk) => ({ ...bk, payments: byBooking.get(bk.id) ?? [] })));
        });
      },
      error: () => this.loading.set(false),
    });
  }

  private setStatus(b: Booking, status: string) {
    this.api.updateBookingStatus(b.id, status).subscribe(() => this.load());
  }

  async accept(b: Booking) {
    if (await this.confirm.ask({
      title: 'Accept this booking?',
      message: `The client will be notified that you've accepted their request for "${b.service?.name}". Make sure you're available on the event date.`,
      confirmText: 'Accept booking', tone: 'success', icon: 'check',
    })) this.setStatus(b, 'accepted');
  }

  async decline(b: Booking) {
    if (await this.confirm.ask({
      title: 'Decline this booking?',
      message: `The client will be told you can't take this request for "${b.service?.name}". They can then book another vendor.`,
      confirmText: 'Decline', tone: 'danger', icon: 'x',
    })) this.setStatus(b, 'declined');
  }

  async markConfirmed(b: Booking) {
    if (await this.confirm.ask({
      title: 'Mark booking as confirmed?',
      message: `This locks in "${b.service?.name}" for the event. The client will see it as confirmed.`,
      confirmText: 'Confirm booking', tone: 'default', icon: 'check',
    })) this.setStatus(b, 'confirmed');
  }

  async complete(b: Booking) {
    if (await this.confirm.ask({
      title: 'Mark booking as completed?',
      message: `Only do this after the service has been delivered. This closes out "${b.service?.name}".`,
      confirmText: 'Mark completed', tone: 'success', icon: 'checkCircle',
    })) this.setStatus(b, 'completed');
  }

  async cancel(b: Booking) {
    if (await this.confirm.ask({
      title: 'Cancel this booking?',
      message: `This cancels "${b.service?.name}" and notifies the vendor. This action cannot be undone.`,
      confirmText: 'Cancel booking', tone: 'danger', icon: 'alert',
    })) this.setStatus(b, 'cancelled');
  }

  async confirmPay(p: Payment) {
    if (await this.confirm.ask({
      title: 'Confirm this payment?',
      message: `Only confirm after you've verified this ${p.method.toUpperCase()} payment of KES ${(+p.amount).toLocaleString()} (ref: ${p.reference || 'none'}) in your own statement. The client will be notified and a receipt issued.`,
      confirmText: 'Yes, I verified it', tone: 'success', icon: 'check',
    })) this.api.confirmPayment(p.id).subscribe(() => this.load());
  }

  async rejectPay(p: Payment) {
    if (await this.confirm.ask({
      title: 'Reject this payment?',
      message: `Use this if you couldn't find or verify the KES ${(+p.amount).toLocaleString()} payment. The client will be asked to check the reference and re-submit.`,
      confirmText: 'Reject payment', tone: 'danger', icon: 'x',
    })) this.api.rejectPayment(p.id).subscribe(() => this.load());
  }

  statusClass(s: string) {
    return { requested: 'amber', accepted: 'blue', confirmed: 'blue', completed: 'green', declined: 'red', cancelled: 'red' }[s] ?? 'gray';
  }
  payClass(s: string) {
    return { pending: 'amber', confirmed: 'green', rejected: 'red' }[s] ?? 'gray';
  }
}
