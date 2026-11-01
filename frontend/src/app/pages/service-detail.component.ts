import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { IconComponent } from '../shared/icon.component';
import { EventItem, Service } from '../core/models';

@Component({
  selector: 'app-service-detail',
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  template: `
    <div class="container" style="max-width:720px">
      @if (service(); as s) {
        <a routerLink="/home" class="link-back"><app-icon name="back" [size]="16"></app-icon> Back to browse</a>
        <div class="card mt-2">
          <span class="badge purple">{{ s.category }}</span>
          <h1 class="page-title mt-2">{{ s.name }}</h1>
          <p class="muted">Offered by {{ s.vendor?.name }}</p>
          <p>{{ s.description }}</p>
          <p class="price" style="font-size:1.3rem">KES {{ s.price | number }} <span class="muted" style="font-weight:400;font-size:.9rem">/ {{ s.unit }}</span></p>
        </div>

        @if (auth.role() === 'client') {
          <div class="card mt-3">
            <h3 style="margin-top:0">Book this service</h3>
            @if (msg()) { <div class="alert ok">{{ msg() }}</div> }
            @if (error()) { <div class="alert err">{{ error() }}</div> }

            @if (events().length === 0) {
              <p class="muted">You need an event first. <a routerLink="/events">Create an event</a></p>
            } @else {
              <div class="row">
                <div class="field">
                  <label>For which event?</label>
                  <select [(ngModel)]="eventId">
                    @for (e of events(); track e.id) {
                      <option [value]="e.id">{{ e.title }} ({{ e.event_date }})</option>
                    }
                  </select>
                </div>
                <div class="field">
                  <label>Quantity ({{ s.unit }})</label>
                  <input type="number" min="1" [(ngModel)]="quantity" />
                </div>
              </div>
              <p class="muted">Estimated total: <span class="price">KES {{ (+s.price * quantity) | number }}</span></p>
              <button class="btn" (click)="book(s)" [disabled]="booking()">
                {{ booking() ? 'Sending…' : 'Request booking' }}
              </button>
            }
          </div>
        } @else if (!auth.isLoggedIn()) {
          <div class="card mt-3 center">
            <p>Want to book this service?</p>
            <a routerLink="/register" class="btn">Create a client account</a>
          </div>
        }
      } @else {
        <p class="muted">Loading…</p>
      }
    </div>
  `,
})
export class ServiceDetailComponent {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  auth = inject(AuthService);

  service = signal<Service | null>(null);
  events = signal<EventItem[]>([]);
  eventId: number | null = null;
  quantity = 1;
  booking = signal(false);
  msg = signal('');
  error = signal('');

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.service(id).subscribe((s) => this.service.set(s));
    if (this.auth.role() === 'client') {
      this.api.events().subscribe((e) => {
        // Only events that can still take bookings.
        const open = e.filter((ev) => !['cancelled', 'completed'].includes(ev.status));
        this.events.set(open);
        if (open.length) this.eventId = open[0].id;
      });
    }
  }

  book(s: Service): void {
    if (!this.eventId) return;
    this.booking.set(true);
    this.msg.set(''); this.error.set('');
    this.api.createBooking({ event_id: +this.eventId, service_id: s.id, quantity: +this.quantity }).subscribe({
      next: () => {
        this.msg.set('Booking request sent! The vendor will respond shortly.');
        this.booking.set(false);
      },
      error: (e) => { this.error.set(e?.error?.message ?? 'Could not book.'); this.booking.set(false); },
    });
  }
}
