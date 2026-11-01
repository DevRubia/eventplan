import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { OptionsService } from '../core/options.service';
import { IconComponent } from '../shared/icon.component';
import { VendorProfile } from '../core/models';

@Component({
  selector: 'app-vendor-profile',
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="container" style="max-width:640px">
      <h1 class="page-title">My Business Profile</h1>
      <p class="page-sub">This is what clients see. An admin verifies new vendors before they appear publicly.</p>

      @if (profile(); as p) {
        @if (msg()) { <div class="alert ok">{{ msg() }}</div> }
        <div class="card">
          <div class="flex between">
            <span class="muted">Verification status</span>
            <span class="badge flex" [class]="p.is_verified ? 'green' : 'amber'" style="gap:4px">
              @if (p.is_verified) { <app-icon name="checkCircle" [size]="13"></app-icon> Verified }
              @else { Pending verification }
            </span>
          </div>
          <div class="field mt-3"><label>Business name</label><input [(ngModel)]="form.business_name" /></div>
          <div class="row">
            <div class="field">
              <label>Category</label>
              <select [(ngModel)]="form.category">
                @for (o of opts.group('service_category'); track o.value) {
                  <option [value]="o.value">{{ o.label }}</option>
                }
              </select>
            </div>
            <div class="field"><label>Location</label><input [(ngModel)]="form.location" /></div>
          </div>
          <div class="field"><label>Phone</label><input [(ngModel)]="form.phone" /></div>
          <div class="field"><label>Description</label><textarea rows="3" [(ngModel)]="form.description"></textarea></div>
          <button class="btn" (click)="save()">Save profile</button>
        </div>
      } @else { <p class="muted">Loading…</p> }
    </div>
  `,
})
export class VendorProfileComponent {
  private api = inject(ApiService);
  opts = inject(OptionsService);
  profile = signal<VendorProfile | null>(null);
  form: any = {};
  msg = signal('');

  ngOnInit() {
    this.api.vendorProfile().subscribe((p) => { this.profile.set(p); this.form = { ...p }; });
  }

  save() {
    this.msg.set('');
    this.api.updateVendorProfile(this.form).subscribe((p) => {
      this.profile.set(p); this.msg.set('Profile saved.');
    });
  }
}
