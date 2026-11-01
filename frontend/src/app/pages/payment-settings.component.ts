import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { OptionsService } from '../core/options.service';
import { PaymentSettings } from '../core/models';

@Component({
  selector: 'app-payment-settings',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container" style="max-width:640px">
      <h1 class="page-title">Payment Settings</h1>
      <p class="page-sub">
        Payments happen outside the system (M-Pesa, bank, cash). These rules control how they are recorded and confirmed.
      </p>

      @if (msg()) { <div class="alert ok">{{ msg() }}</div> }
      @if (form) {
        <div class="card">
          <div class="row">
            <div class="field"><label>Currency</label><input [(ngModel)]="form.currency" /></div>
            <div class="field"><label>Default deposit %</label><input type="number" min="0" max="100" [(ngModel)]="form.deposit_percentage" /></div>
            <div class="field"><label>Receipt prefix</label><input [(ngModel)]="form.receipt_prefix" /></div>
          </div>

          <div class="field">
            <label>Allowed payment methods</label>
            <div class="flex wrap" style="gap:16px">
              @for (m of opts.group('payment_method'); track m.value) {
                <label class="flex" style="gap:6px;font-weight:400">
                  <input type="checkbox" [checked]="form.allowed_methods.includes(m.value)" (change)="toggleMethod(m.value)" style="width:auto" />
                  {{ m.label }}
                </label>
              }
            </div>
            <p class="muted" style="font-size:.8rem">
              Need another method? Add it under <a routerLink="/admin/options">Configuration</a>.
            </p>
          </div>

          <div class="row">
            <div class="field">
              <label>Who can confirm payments?</label>
              <select [(ngModel)]="form.confirmation_role">
                <option value="vendor_or_admin">Vendor or Admin</option>
                <option value="admin">Admin only</option>
              </select>
            </div>
            <div class="field">
              <label>Require a reference (M-Pesa code / slip)?</label>
              <select [(ngModel)]="form.require_reference">
                <option [ngValue]="true">Yes — required before confirming</option>
                <option [ngValue]="false">No — optional</option>
              </select>
            </div>
          </div>

          <div class="field"><label>Business name (on receipts)</label><input [(ngModel)]="form.business_name" /></div>
          <div class="field">
            <label>Payment details shown to clients</label>
            <textarea rows="2" [(ngModel)]="form.business_details" placeholder="e.g. M-Pesa Paybill 123456, Account: event ref"></textarea>
          </div>

          <button class="btn" (click)="save()">Save settings</button>
        </div>
      } @else { <p class="muted">Loading…</p> }
    </div>
  `,
})
export class PaymentSettingsComponent {
  private api = inject(ApiService);
  opts = inject(OptionsService);
  form!: PaymentSettings;
  msg = signal('');

  ngOnInit() {
    this.api.paymentSettings().subscribe((s) => {
      if (!s.allowed_methods) s.allowed_methods = [];
      this.form = s;
    });
  }

  toggleMethod(m: string) {
    const set = new Set(this.form.allowed_methods);
    set.has(m) ? set.delete(m) : set.add(m);
    this.form.allowed_methods = [...set];
  }

  save() {
    this.msg.set('');
    this.api.updatePaymentSettings(this.form).subscribe({
      next: (s) => { this.form = s; this.msg.set('Settings saved.'); },
      error: (e) => {
        const errs = e?.error?.errors;
        this.msg.set(errs ? Object.values(errs).flat().join(' ') : 'Could not save.');
      },
    });
  }
}
