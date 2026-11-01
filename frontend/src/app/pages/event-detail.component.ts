import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { IconComponent } from '../shared/icon.component';
import { Booking, EventItem, EventSummary, Payment, PaymentSettings } from '../core/models';

@Component({
  selector: 'app-event-detail',
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  template: `
    <div class="container">
      <a routerLink="/events" class="link-back"><app-icon name="back" [size]="16"></app-icon> All events</a>

      @if (event(); as e) {
        <div class="flex between wrap mt-2">
          <div>
            <h1 class="page-title">{{ e.title }}</h1>
            <p class="page-sub">{{ e.type }} · {{ e.event_date }} · {{ e.venue || e.location }} · {{ e.guest_count }} guests</p>
          </div>
          <span class="badge purple" style="height:fit-content">{{ e.status }}</span>
        </div>

        <!-- Budget summary -->
        @if (summary(); as sm) {
          <div class="card">
            <h3 style="margin-top:0">Budget &amp; payments</h3>
            <div class="grid grid-4">
              <div><div class="label muted">Budget</div><div class="price" style="font-size:1.2rem">KES {{ sm.budget | number }}</div></div>
              <div><div class="label muted">Committed</div><div style="font-size:1.2rem;font-weight:700">KES {{ sm.committed | number }}</div></div>
              <div><div class="label muted">Paid (confirmed)</div><div style="font-size:1.2rem;font-weight:700;color:var(--ok)">KES {{ sm.paid | number }}</div></div>
              <div><div class="label muted">Outstanding</div><div style="font-size:1.2rem;font-weight:700;color:var(--warn)">KES {{ sm.outstanding | number }}</div></div>
            </div>
            <div class="mt-3">
              <div class="flex between"><span class="muted" style="font-size:.82rem">Spent vs budget</span>
                <span class="muted" style="font-size:.82rem">{{ pct(sm.committed, sm.budget) }}%</span></div>
              <div class="progress mt-2"><span [style.width.%]="pct(sm.committed, sm.budget)"></span></div>
            </div>
          </div>
        }

        <!-- Bookings -->
        <h2 class="mt-4">Booked services</h2>
        @if (bookings().length === 0) {
          <div class="empty">No services booked yet. <a routerLink="/home">Browse services</a></div>
        } @else {
          <div class="grid mt-2">
            @for (b of bookings(); track b.id) {
              <div class="card">
                <div class="flex between wrap">
                  <div>
                    <h3 style="margin:0">{{ b.service?.name }}</h3>
                    <p class="muted" style="margin:2px 0;font-size:.85rem">{{ b.vendor?.name }} · qty {{ b.quantity }}</p>
                  </div>
                  <span class="badge" [class]="statusClass(b.status)">{{ b.status }}</span>
                </div>

                <div class="grid grid-3 mt-2">
                  <div><div class="label muted">Agreed</div><div class="price">KES {{ b.agreed_price | number }}</div></div>
                  <div><div class="label muted">Paid</div><div style="color:var(--ok);font-weight:700">KES {{ paidOf(b) | number }}</div></div>
                  <div><div class="label muted">Balance</div><div style="color:var(--warn);font-weight:700">KES {{ balanceOf(b) | number }}</div></div>
                </div>

                <!-- Payments list -->
                @if (b.payments && b.payments.length) {
                  <div class="table-wrap mt-3">
                    <table>
                      <tr><th>Date</th><th>Amount</th><th>Method</th><th>Ref</th><th>Type</th><th>Status</th></tr>
                      @for (p of b.payments; track p.id) {
                        <tr>
                          <td>{{ p.paid_at }}</td>
                          <td>KES {{ p.amount | number }}</td>
                          <td style="text-transform:uppercase">{{ p.method }}</td>
                          <td>{{ p.reference || '—' }}</td>
                          <td>{{ p.type }}</td>
                          <td><span class="badge" [class]="payClass(p.status)">{{ p.status }}</span></td>
                        </tr>
                      }
                    </table>
                  </div>
                }

                <!-- Record payment -->
                @if (settings()) {
                  <div class="mt-3">
                    @if (payForm() === b.id) {
                      <div class="card" style="background:#faf8ff">
                        <div class="flex between"><strong>Record a payment</strong>
                          <button class="btn btn-sm btn-outline" (click)="payForm.set(null)">Cancel</button></div>
                        @if (payErr()) { <div class="alert err mt-2">{{ payErr() }}</div> }
                        <div class="row mt-2">
                          <div class="field"><label>Amount (KES)</label><input type="number" [(ngModel)]="pf.amount" /></div>
                          <div class="field">
                            <label>Method</label>
                            <select [(ngModel)]="pf.method">
                              @for (m of settings()!.allowed_methods; track m) { <option [value]="m">{{ m | uppercase }}</option> }
                            </select>
                          </div>
                          <div class="field">
                            <label>Type</label>
                            <select [(ngModel)]="pf.type"><option value="deposit">Deposit</option><option value="balance">Balance</option><option value="full">Full</option></select>
                          </div>
                        </div>
                        <div class="row">
                          <div class="field"><label>Date paid</label><input type="date" [(ngModel)]="pf.paid_at" /></div>
                          <div class="field">
                            <label>Reference {{ settings()!.require_reference ? '(required)' : '(optional)' }}</label>
                            <input [(ngModel)]="pf.reference" placeholder="M-Pesa code / bank slip no." />
                          </div>
                        </div>
                        <p class="muted flex" style="font-size:.8rem;align-items:flex-start;gap:6px">
                          <app-icon name="info" [size]="15"></app-icon> {{ settings()!.business_details }}
                        </p>
                        <button class="btn" (click)="submitPayment(b)"><app-icon name="wallet" [size]="16"></app-icon> Submit for confirmation</button>
                      </div>
                    } @else if (canPay(b)) {
                      <button class="btn btn-sm" (click)="openPay(b)"><app-icon name="plus" [size]="15"></app-icon> Record payment</button>
                    } @else {
                      <p class="muted flex" style="font-size:.82rem;gap:6px">
                        <app-icon name="info" [size]="15"></app-icon>
                        Payments are closed for a {{ b.status }} booking.
                      </p>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      } @else { <p class="muted mt-3">Loading…</p> }
    </div>
  `,
})
export class EventDetailComponent {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  id!: number;
  event = signal<EventItem | null>(null);
  summary = signal<EventSummary | null>(null);
  bookings = signal<Booking[]>([]);
  settings = signal<PaymentSettings | null>(null);

  payForm = signal<number | null>(null);
  payErr = signal('');
  pf: any = { amount: 0, method: 'mpesa', type: 'deposit', paid_at: '', reference: '' };

  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.paymentSettings().subscribe((s) => {
      this.settings.set(s);
      this.pf.method = s.allowed_methods?.[0] ?? 'mpesa';
    });
    this.load();
  }

  load() {
    this.api.event(this.id).subscribe((res) => {
      this.event.set(res.event);
      this.summary.set(res.summary);
      this.bookings.set(res.event.bookings ?? []);
    });
  }

  openPay(b: Booking) {
    this.payErr.set('');
    this.pf.amount = Math.max(0, +this.balanceOf(b));
    this.pf.paid_at = new Date().toISOString().slice(0, 10);
    this.payForm.set(b.id);
  }

  submitPayment(b: Booking) {
    this.payErr.set('');
    this.api.recordPayment({ booking_id: b.id, ...this.pf }).subscribe({
      next: () => { this.payForm.set(null); this.load(); },
      error: (e) => {
        const errs = e?.error?.errors;
        this.payErr.set(errs ? Object.values(errs).flat().join(' ') : (e?.error?.message ?? 'Could not record payment.'));
      },
    });
  }

  canPay(b: Booking): boolean {
    return !['declined', 'cancelled'].includes(b.status);
  }
  paidOf(b: Booking): number {
    return (b.payments ?? []).filter((p) => p.status === 'confirmed').reduce((s, p) => s + +p.amount, 0);
  }
  balanceOf(b: Booking): number {
    return Math.max(0, +b.agreed_price - this.paidOf(b));
  }
  pct(a: number, b: number): number {
    return b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0;
  }
  statusClass(s: string) {
    return { requested: 'amber', accepted: 'blue', confirmed: 'blue', completed: 'green', declined: 'red', cancelled: 'red' }[s] ?? 'gray';
  }
  payClass(s: string) {
    return { pending: 'amber', confirmed: 'green', rejected: 'red' }[s] ?? 'gray';
  }
}
