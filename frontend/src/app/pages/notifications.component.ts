import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/api.service';
import { NotificationService } from '../core/notification.service';
import { AppNotification } from '../core/models';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule],
  template: `
    <div class="container" style="max-width:640px">
      <div class="flex between">
        <h1 class="page-title">Notifications</h1>
        @if (items().length) { <button class="btn btn-sm btn-outline" (click)="markAll()">Mark all read</button> }
      </div>

      @if (items().length === 0) { <div class="empty">No notifications.</div> }
      @else {
        <div class="grid mt-2">
          @for (n of items(); track n.id) {
            <div class="card" [style.opacity]="n.is_read ? .6 : 1" (click)="read(n)" style="cursor:pointer">
              <div class="flex between">
                <strong>{{ n.title }}</strong>
                <span class="badge" [class]="badge(n.type)">{{ n.type }}</span>
              </div>
              <p style="margin:6px 0 0">{{ n.body }}</p>
              <p class="muted" style="font-size:.78rem;margin:6px 0 0">{{ n.created_at | date: 'medium' }}</p>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class NotificationsComponent {
  private api = inject(ApiService);
  private notif = inject(NotificationService);
  items = signal<AppNotification[]>([]);

  ngOnInit() { this.load(); }
  load() {
    this.api.notifications().subscribe((r) => { this.items.set(r.items); this.notif.unread.set(r.unread); });
  }
  read(n: AppNotification) { if (!n.is_read) this.api.markNotificationRead(n.id).subscribe(() => { this.load(); this.notif.refresh(); }); }
  markAll() { this.api.markAllNotificationsRead().subscribe(() => { this.load(); this.notif.refresh(); }); }
  badge(t: string) { return { booking: 'blue', payment: 'green' }[t] ?? 'gray'; }
}
