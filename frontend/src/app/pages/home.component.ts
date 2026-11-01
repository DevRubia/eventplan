import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { OptionsService } from '../core/options.service';
import { IconComponent } from '../shared/icon.component';
import { Service } from '../core/models';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  template: `
    <div class="container">
      <div class="hero">
        <h1>Plan your perfect event, all in one place</h1>
        <p>Compare trusted caterers, decorators, photographers, DJs and more — book, track your budget and manage payments.</p>
      </div>

      <div class="card mt-3">
        <div class="row">
          <div class="field" style="margin:0">
            <label>Search</label>
            <input [(ngModel)]="search" placeholder="e.g. catering, photography" (keyup.enter)="load()" />
          </div>
          <div class="field" style="margin:0">
            <label>Category</label>
            <select [(ngModel)]="category" (change)="load()">
              <option value="">All categories</option>
              @for (o of opts.group('service_category'); track o.value) {
                <option [value]="o.value">{{ o.label }}</option>
              }
            </select>
          </div>
          <div class="field" style="margin:0">
            <label>Sort by price</label>
            <select [(ngModel)]="sort" (change)="load()">
              <option value="price_asc">Low to high</option>
              <option value="price_desc">High to low</option>
            </select>
          </div>
          <div style="display:flex;align-items:flex-end">
            <button class="btn" (click)="load()"><app-icon name="search" [size]="16"></app-icon> Search</button>
          </div>
        </div>
      </div>

      <h2 class="mt-4">Available services</h2>
      @if (loading()) { <p class="muted">Loading…</p> }
      @else if (services().length === 0) { <div class="empty">No services match your search.</div> }
      @else {
        <div class="grid grid-3 mt-2">
          @for (s of services(); track s.id) {
            <div class="card">
              <span class="badge purple">{{ s.category }}</span>
              <h3 style="margin:10px 0 4px">{{ s.name }}</h3>
              <p class="muted" style="font-size:.85rem">by {{ s.vendor?.name }}</p>
              <p style="font-size:.88rem;min-height:40px">{{ s.description }}</p>
              <div class="flex between mt-2">
                <span class="price">KES {{ s.price | number }} <span class="muted" style="font-weight:400">/ {{ s.unit }}</span></span>
                <a [routerLink]="['/services', s.id]" class="btn btn-sm">View</a>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class HomeComponent {
  private api = inject(ApiService);
  auth = inject(AuthService);
  opts = inject(OptionsService);

  search = '';
  category = '';
  sort = 'price_asc';
  services = signal<Service[]>([]);
  loading = signal(true);

  ngOnInit() { this.load(); }

  load(): void {
    this.loading.set(true);
    const params: Record<string, string> = { sort: this.sort };
    if (this.search) params['search'] = this.search;
    if (this.category) params['category'] = this.category;
    this.api.services(params).subscribe({
      next: (s) => { this.services.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
