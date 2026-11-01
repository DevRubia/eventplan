import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { OptionsService } from '../core/options.service';
import { IconComponent } from '../shared/icon.component';
import { EventItem } from '../core/models';

@Component({
  selector: 'app-events',
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  template: `
    <div class="container">
      <div class="flex between wrap">
        <div>
          <h1 class="page-title">My Events</h1>
          <p class="page-sub">Create an event, then book services for it.</p>
        </div>
        <button class="btn" (click)="showForm.set(!showForm())">
          <app-icon [name]="showForm() ? 'x' : 'plus'" [size]="16"></app-icon>
          {{ showForm() ? 'Close' : 'New event' }}
        </button>
      </div>

      @if (showForm()) {
        <div class="card mt-2">
          <h3 style="margin-top:0">New event</h3>
          @if (error()) { <div class="alert err">{{ error() }}</div> }
          <div class="row">
            <div class="field"><label>Title</label><input [(ngModel)]="form.title" /></div>
            <div class="field">
              <label>Type</label>
              <select [(ngModel)]="form.type">
                @for (o of opts.group('event_type'); track o.value) {
                  <option [value]="o.value">{{ o.label }}</option>
                }
              </select>
            </div>
          </div>
          <div class="row">
            <div class="field"><label>Date</label><input type="date" [(ngModel)]="form.event_date" /></div>
            <div class="field"><label>Guest count</label><input type="number" [(ngModel)]="form.guest_count" /></div>
            <div class="field"><label>Budget (KES)</label><input type="number" [(ngModel)]="form.budget" /></div>
          </div>
          <div class="row">
            <div class="field"><label>Venue</label><input [(ngModel)]="form.venue" /></div>
            <div class="field"><label>Location</label><input [(ngModel)]="form.location" /></div>
          </div>
          <button class="btn" (click)="create()">Create event</button>
        </div>
      }

      @if (loading()) { <p class="muted mt-3">Loading…</p> }
      @else if (events().length === 0) { <div class="empty">No events yet. Create your first one above.</div> }
      @else {
        <div class="grid grid-2 mt-3">
          @for (e of events(); track e.id) {
            <a [routerLink]="['/events', e.id]" class="card" style="color:inherit">
              <div class="flex between">
                <span class="badge purple">{{ e.type }}</span>
                <span class="badge" [class]="statusClass(e.status)">{{ e.status }}</span>
              </div>
              <h3 style="margin:10px 0 2px">{{ e.title }}</h3>
              <p class="muted" style="font-size:.85rem">{{ e.event_date }} · {{ e.venue || e.location }}</p>
              <div class="flex between mt-2">
                <span class="muted">{{ e.guest_count }} guests · {{ e.bookings_count }} bookings</span>
                <span class="price">KES {{ e.budget | number }}</span>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class EventsComponent {
  private api = inject(ApiService);
  opts = inject(OptionsService);

  events = signal<EventItem[]>([]);
  loading = signal(true);
  showForm = signal(false);
  error = signal('');
  form: any = { title: '', type: 'Wedding', event_date: '', guest_count: 0, budget: 0, venue: '', location: '' };

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.events().subscribe({
      next: (e) => { this.events.set(e); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  create() {
    this.error.set('');
    this.api.createEvent(this.form).subscribe({
      next: () => { this.showForm.set(false); this.form.title = ''; this.load(); },
      error: (e) => {
        const errs = e?.error?.errors;
        this.error.set(errs ? Object.values(errs).flat().join(' ') : 'Could not create event.');
      },
    });
  }

  statusClass(s: string) {
    return { planning: 'amber', confirmed: 'blue', completed: 'green', cancelled: 'red' }[s] ?? 'gray';
  }
}
