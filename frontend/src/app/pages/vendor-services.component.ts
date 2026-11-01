import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { ConfirmService } from '../core/confirm.service';
import { OptionsService } from '../core/options.service';
import { IconComponent } from '../shared/icon.component';
import { Service } from '../core/models';

@Component({
  selector: 'app-vendor-services',
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="container">
      <div class="flex between wrap">
        <div>
          <h1 class="page-title">My Services</h1>
          <p class="page-sub">List what you offer so clients can find and book you.</p>
        </div>
        <button class="btn" (click)="newService()"><app-icon name="plus" [size]="16"></app-icon> Add service</button>
      </div>

      @if (editing()) {
        <div class="card mt-2">
          <h3 style="margin-top:0">{{ form.id ? 'Edit' : 'New' }} service</h3>
          @if (error()) { <div class="alert err">{{ error() }}</div> }
          <div class="row">
            <div class="field"><label>Name</label><input [(ngModel)]="form.name" /></div>
            <div class="field">
              <label>Category</label>
              <select [(ngModel)]="form.category">
                @for (o of opts.group('service_category'); track o.value) {
                  <option [value]="o.value">{{ o.label }}</option>
                }
              </select>
            </div>
          </div>
          <div class="row">
            <div class="field"><label>Price (KES)</label><input type="number" [(ngModel)]="form.price" /></div>
            <div class="field">
              <label>Unit</label>
              <select [(ngModel)]="form.unit">
                @for (o of opts.group('service_unit'); track o.value) {
                  <option [value]="o.value">{{ o.label }}</option>
                }
              </select>
            </div>
          </div>
          <div class="field"><label>Description</label><textarea rows="2" [(ngModel)]="form.description"></textarea></div>
          <div class="flex" style="gap:8px">
            <button class="btn" (click)="save()">Save</button>
            <button class="btn btn-outline" (click)="editing.set(false)">Cancel</button>
          </div>
        </div>
      }

      @if (loading()) { <p class="muted mt-3">Loading…</p> }
      @else if (services().length === 0) { <div class="empty">No services yet. Add your first one above.</div> }
      @else {
        <div class="card mt-3" style="padding:0">
         <div class="table-wrap">
          <table>
            <tr><th>Name</th><th>Category</th><th>Price</th><th>Active</th><th></th></tr>
            @for (s of services(); track s.id) {
              <tr>
                <td>{{ s.name }}</td>
                <td><span class="badge purple">{{ s.category }}</span></td>
                <td class="price">KES {{ s.price | number }} <span class="muted" style="font-weight:400">/ {{ s.unit }}</span></td>
                <td><span class="badge" [class]="s.is_active ? 'green' : 'amber'">{{ s.is_active ? 'Active' : 'Inactive' }}</span></td>
                <td class="flex wrap" style="gap:6px">
                  <button class="btn btn-sm" [class.btn-outline]="s.is_active" (click)="toggleActive(s)">
                    <app-icon [name]="s.is_active ? 'x' : 'check'" [size]="14"></app-icon>
                    {{ s.is_active ? 'Deactivate' : 'Activate' }}
                  </button>
                  <button class="btn btn-sm btn-outline" (click)="edit(s)"><app-icon name="pencil" [size]="14"></app-icon> Edit</button>
                  <button class="btn btn-sm btn-bad" (click)="remove(s)"><app-icon name="trash" [size]="14"></app-icon> Delete</button>
                </td>
              </tr>
            }
          </table>
         </div>
        </div>
      }
    </div>
  `,
})
export class VendorServicesComponent {
  private api = inject(ApiService);
  private confirm = inject(ConfirmService);
  opts = inject(OptionsService);

  services = signal<Service[]>([]);
  loading = signal(true);
  editing = signal(false);
  error = signal('');
  form: any = {};

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.myServices().subscribe({
      next: (s) => { this.services.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  newService() {
    this.form = { category: 'Catering', unit: 'per event', price: 0, is_active: true };
    this.error.set('');
    this.editing.set(true);
  }
  edit(s: Service) { this.form = { ...s }; this.error.set(''); this.editing.set(true); }

  save() {
    this.error.set('');
    const obs = this.form.id ? this.api.updateService(this.form.id, this.form) : this.api.createService(this.form);
    obs.subscribe({
      next: () => { this.editing.set(false); this.load(); },
      error: (e) => {
        const errs = e?.error?.errors;
        this.error.set(errs ? Object.values(errs).flat().join(' ') : 'Could not save.');
      },
    });
  }

  async toggleActive(s: Service) {
    if (s.is_active) {
      const ok = await this.confirm.ask({
        title: 'Deactivate this service?',
        message: `"${s.name}" will be hidden from clients and cannot be booked while deactivated. Existing bookings are not affected, and you can reactivate it anytime.`,
        confirmText: 'Deactivate', tone: 'danger', icon: 'x',
      });
      if (!ok) return;
    }
    this.api.toggleService(s.id).subscribe(() => this.load());
  }

  async remove(s: Service) {
    const ok = await this.confirm.ask({
      title: 'Delete this service?',
      message: `"${s.name}" will be permanently removed and will no longer appear to clients. Existing bookings are not affected. This cannot be undone.`,
      confirmText: 'Delete service', tone: 'danger', icon: 'trash',
    });
    if (ok) this.api.deleteService(s.id).subscribe(() => this.load());
  }
}
