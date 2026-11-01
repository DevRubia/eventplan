import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { ConfirmService } from '../core/confirm.service';
import { OptionsService } from '../core/options.service';
import { IconComponent } from '../shared/icon.component';
import { Option } from '../core/models';

@Component({
  selector: 'app-system-options',
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="container">
      <h1 class="page-title">Configuration</h1>
      <p class="page-sub">
        Manage the dropdown lists used across EventPlan so it fits your market. Add, rename, hide or
        remove options for service categories, event types, units and payment methods.
      </p>

      <div class="grid grid-2">
        @for (g of groups; track g.key) {
          <div class="card">
            <h3 style="margin-top:0">{{ g.title }}</h3>
            <p class="muted" style="font-size:.82rem;margin-top:-6px">{{ g.hint }}</p>

            @if ((data()[g.key] ?? []).length === 0) {
              <p class="muted">No options yet.</p>
            } @else {
              <div class="grid" style="gap:8px">
                @for (o of data()[g.key]; track o.id) {
                  <div class="flex between" style="padding:7px 0;border-bottom:1px solid var(--line)">
                    <span [style.opacity]="o.is_active ? 1 : .5">
                      {{ o.label }}
                      @if (!o.is_active) { <span class="badge gray">hidden</span> }
                    </span>
                    <div class="flex" style="gap:6px">
                      <button class="btn btn-sm btn-outline" (click)="toggle(o)" [title]="o.is_active ? 'Hide' : 'Show'">
                        {{ o.is_active ? 'Hide' : 'Show' }}
                      </button>
                      <button class="btn btn-sm btn-bad" (click)="remove(o, g.title)" title="Delete">
                        <app-icon name="trash" [size]="14"></app-icon>
                      </button>
                    </div>
                  </div>
                }
              </div>
            }

            <div class="flex mt-3" style="gap:8px">
              <input [(ngModel)]="draft[g.key]" [placeholder]="'Add ' + g.singular + '…'"
                (keyup.enter)="add(g.key)" style="flex:1" />
              <button class="btn btn-sm" (click)="add(g.key)"><app-icon name="plus" [size]="15"></app-icon> Add</button>
            </div>
            @if (err()[g.key]) { <p class="alert err mt-2">{{ err()[g.key] }}</p> }
          </div>
        }
      </div>
    </div>
  `,
})
export class SystemOptionsComponent {
  private api = inject(ApiService);
  private confirm = inject(ConfirmService);
  private optionsSvc = inject(OptionsService);

  groups = [
    { key: 'service_category', title: 'Service Categories', singular: 'category', hint: 'The kinds of services vendors can offer.' },
    { key: 'event_type', title: 'Event Types', singular: 'event type', hint: 'The kinds of events clients can plan.' },
    { key: 'service_unit', title: 'Service Units', singular: 'unit', hint: 'How services are priced (per plate, per event…).' },
    { key: 'payment_method', title: 'Payment Methods', singular: 'method', hint: 'Offline methods clients can pay with.' },
  ];

  data = signal<Record<string, Option[]>>({});
  draft: Record<string, string> = {};
  err = signal<Record<string, string>>({});

  ngOnInit() { this.load(); }

  load() {
    this.api.adminOptions().subscribe((d) => this.data.set(d ?? {}));
  }

  add(group: string) {
    const label = (this.draft[group] ?? '').trim();
    if (!label) return;
    this.setErr(group, '');
    this.api.createOption({ group, label }).subscribe({
      next: () => { this.draft[group] = ''; this.refreshAll(); },
      error: (e) => this.setErr(group, e?.error?.message ?? 'Could not add.'),
    });
  }

  toggle(o: Option) {
    this.api.toggleOption(o.id).subscribe(() => this.refreshAll());
  }

  async remove(o: Option, groupTitle: string) {
    const ok = await this.confirm.ask({
      title: 'Delete this option?',
      message: `"${o.label}" will be removed from ${groupTitle}. Existing records that already use it are not changed, but it won't be selectable for new ones. Consider "Hide" if you only want to retire it.`,
      confirmText: 'Delete option', tone: 'danger', icon: 'trash',
    });
    if (ok) this.api.deleteOption(o.id).subscribe(() => this.refreshAll());
  }

  // Reload the admin list AND the shared cache used by all the dropdowns.
  private refreshAll() {
    this.load();
    this.optionsSvc.load();
  }

  private setErr(group: string, msg: string) {
    this.err.set({ ...this.err(), [group]: msg });
  }
}
